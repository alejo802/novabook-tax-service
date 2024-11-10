import { TransactionRepository } from '../repositories/TransactionRepository';
import { AmendmentRepository } from '../repositories/AmendmentRepository';
import { calculateTax } from '../utils/taxUtils';
import { parseDate } from '../utils/dateUtils';
import logger from '../middleware/logger';

// Enums and Interfaces
enum EventType {
  SALES = 'SALES',
  AMENDMENT = 'AMENDMENT',
  TAX_PAYMENT = 'TAX_PAYMENT',
}

interface BaseEvent {
  date: Date;
  eventType: EventType;
}

interface SaleItem {
  itemId: string;
  cost: number;
  taxRate: number;
}

interface SalesEvent extends BaseEvent {
  invoiceId: string;
  items: SaleItem[];
}

interface AmendmentEvent extends BaseEvent {
  invoiceId: string;
  itemId: string;
  cost: number;
  taxRate: number;
}

interface TaxPaymentEvent extends BaseEvent {
  amount: number;
}

type Event = SalesEvent | AmendmentEvent | TaxPaymentEvent;

interface SaleEventData {
  date: Date;
  cost: number;
  taxRate: number;
}

interface AmendmentData {
  date: Date;
  cost: number;
  taxRate: number;
}

interface ItemData {
  saleEvent?: SaleEventData;
  amendments: AmendmentData[];
}

export const TaxPositionService = {
  async getTaxPosition(dateString: string): Promise<number> {
    logger.info(`Calculating tax position for date: ${dateString}`);

    const queryDate = parseAndValidateDate(dateString);
    logger.debug(`Parsed query date: ${queryDate.toISOString()}`);

    try {
      // Fetch transactions and amendments
      const [transactions, amendments] = await Promise.all([
        fetchTransactionsUpToDate(queryDate),
        fetchAmendmentsUpToDate(queryDate),
      ]);

      // Combine and sort all events
      const allEvents: Event[] = [...transactions, ...amendments];
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
      logger.debug(`Total events to process: ${allEvents.length}`);

      // Process events
      const { itemDataMap, totalTaxPayments } = processEvents(allEvents);
      logger.debug(`Processed events. Total items: ${itemDataMap.size}, Total tax payments: ${totalTaxPayments}`);

      // Calculate total tax
      const totalTax = calculateTotalTax(itemDataMap, queryDate);
      logger.debug(`Calculated total tax from sales and amendments: ${totalTax}`);

      // Tax position = total tax from sales - total tax payments
      const taxPosition = totalTax - totalTaxPayments;
      logger.info(`Calculated tax position: ${taxPosition}`);

      return taxPosition;
    } catch (error) {
      logger.error(`Error calculating tax position: ${(error as Error).message}`, error);
      throw error;
    }
  },
};

// Helper Functions

function parseAndValidateDate(dateString: string): Date {
  try {
    const date = parseDate(dateString);
    logger.debug(`Successfully parsed date: ${date.toISOString()}`);
    return date;
  } catch (error) {
    logger.error(`Invalid date format: ${dateString}`);
    throw new Error('Invalid date format. Please provide a valid ISO 8601 date string.');
  }
}

async function fetchTransactionsUpToDate(queryDate: Date): Promise<Event[]> {
  const transactions = await TransactionRepository.findUpToDate(queryDate);
  logger.info(`Fetched ${transactions.length} transactions up to date ${queryDate.toISOString()}`);

  const validTransactions = transactions.filter((tx) => {
    const eventType = tx.eventType as EventType;

    if (eventType === EventType.SALES) {
      if (!tx.invoiceId || !tx.items) {
        logger.warn(`Sales transaction missing invoiceId or items: ${JSON.stringify(tx)}`);
        return false;
      }
      return true;
    } else if (eventType === EventType.TAX_PAYMENT) {
      if (tx.amount === undefined) {
        logger.warn(`Tax payment transaction missing amount: ${JSON.stringify(tx)}`);
        return false;
      }
      return true;
    } else {
      logger.warn(`Unknown transaction eventType: ${tx.eventType}`);
      return false;
    }
  });

  logger.debug(`Valid transactions count: ${validTransactions.length}`);

  return validTransactions.map((tx) => {
    const date = tx.date instanceof Date ? tx.date : new Date(tx.date);
    const eventType = tx.eventType as EventType;

    if (eventType === EventType.SALES) {
      logger.debug(`Mapping sales transaction: Invoice ID ${tx.invoiceId}`);
      return {
        date,
        eventType,
        invoiceId: tx.invoiceId as string,
        items: tx.items as SaleItem[],
      } as SalesEvent;
    } else if (eventType === EventType.TAX_PAYMENT) {
      logger.debug(`Mapping tax payment transaction: Amount ${tx.amount}`);
      return {
        date,
        eventType,
        amount: tx.amount as number,
      } as TaxPaymentEvent;
    } else {
      // Should not reach here due to filtering
      throw new Error(`Unexpected eventType: ${eventType}`);
    }
  });
}

async function fetchAmendmentsUpToDate(queryDate: Date): Promise<AmendmentEvent[]> {
  const amendments = await AmendmentRepository.findUpToDate(queryDate);
  logger.info(`Fetched ${amendments.length} amendments up to date ${queryDate.toISOString()}`);

  const validAmendments = amendments.filter(
    (am) =>
      am.invoiceId &&
      am.itemId &&
      am.cost !== undefined &&
      am.taxRate !== undefined
  );

  logger.debug(`Valid amendments count: ${validAmendments.length}`);

  return validAmendments.map((am) => {
    logger.debug(`Mapping amendment: Invoice ID ${am.invoiceId}, Item ID ${am.itemId}`);
    return {
      date: am.date instanceof Date ? am.date : new Date(am.date),
      eventType: EventType.AMENDMENT,
      invoiceId: am.invoiceId as string,
      itemId: am.itemId as string,
      cost: am.cost as number,
      taxRate: am.taxRate as number,
    };
  });
}

function processEvents(
  events: Event[]
): { itemDataMap: Map<string, ItemData>; totalTaxPayments: number } {
  const itemDataMap = new Map<string, ItemData>();
  let totalTaxPayments = 0;

  logger.debug(`Processing ${events.length} events`);

  for (const event of events) {
    switch (event.eventType) {
      case EventType.SALES:
        logger.debug(`Processing sales event: Invoice ID ${(event as SalesEvent).invoiceId}`);
        processSalesEvent(event as SalesEvent, itemDataMap);
        break;
      case EventType.AMENDMENT:
        logger.debug(`Processing amendment event: Invoice ID ${(event as AmendmentEvent).invoiceId}, Item ID ${(event as AmendmentEvent).itemId}`);
        processAmendmentEvent(event as AmendmentEvent, itemDataMap);
        break;
      case EventType.TAX_PAYMENT:
        totalTaxPayments += (event as TaxPaymentEvent).amount || 0;
        logger.debug(`Processed tax payment: Amount ${(event as TaxPaymentEvent).amount || 0}`);
        break;
      default:
        logger.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  return { itemDataMap, totalTaxPayments };
}

function processSalesEvent(event: SalesEvent, itemDataMap: Map<string, ItemData>): void {
  const invoiceId = event.invoiceId;
  logger.debug(`Processing sales event for invoice ID: ${invoiceId}`);

  event.items.forEach((item: SaleItem) => {
    const key = `${invoiceId}-${item.itemId}`;
    logger.debug(`Processing sale item: ${key}`);

    let itemData = itemDataMap.get(key);
    if (!itemData) {
      itemData = { saleEvent: undefined, amendments: [] };
      itemDataMap.set(key, itemData);
      logger.debug(`Created new item data for key: ${key}`);
    }
    itemData.saleEvent = {
      date: event.date,
      cost: item.cost,
      taxRate: item.taxRate,
    };
    logger.debug(`Updated sale event data for item: ${key}`);
  });
}

function processAmendmentEvent(event: AmendmentEvent, itemDataMap: Map<string, ItemData>): void {
  const key = `${event.invoiceId}-${event.itemId}`;
  logger.debug(`Processing amendment for item: ${key}`);

  let itemData = itemDataMap.get(key);
  if (!itemData) {
    itemData = { saleEvent: undefined, amendments: [] };
    itemDataMap.set(key, itemData);
    logger.debug(`Created new item data for key: ${key}`);
  }
  itemData.amendments.push({
    date: event.date,
    cost: event.cost,
    taxRate: event.taxRate,
  });
  logger.debug(`Added amendment to item data for key: ${key}`);
}

function calculateTotalTax(itemDataMap: Map<string, ItemData>, queryDate: Date): number {
  let totalTax = 0;
  logger.debug(`Calculating total tax for ${itemDataMap.size} items`);

  for (const [key, itemData] of itemDataMap.entries()) {
    const { saleEvent, amendments } = itemData;
    logger.debug(`Calculating tax for item: ${key}`);

    // Collect valid amendments up to the query date
    const validAmendments = amendments.filter((am) => am.date.getTime() <= queryDate.getTime());
    logger.debug(`Found ${validAmendments.length} valid amendments for item: ${key}`);

    if (!saleEvent && validAmendments.length === 0) {
      logger.debug(`No sale event or valid amendments for item ${key}, skipping`);
      continue; // Skip items without relevant data
    }

    let cost: number;
    let taxRate: number;

    if (saleEvent && saleEvent.date.getTime() <= queryDate.getTime()) {
      cost = saleEvent.cost;
      taxRate = saleEvent.taxRate;
      logger.debug(`Using sale event for item ${key}: cost=${cost}, taxRate=${taxRate}`);
    } else if (validAmendments.length > 0) {
      validAmendments.sort((a, b) => a.date.getTime() - b.date.getTime());
      const firstAmendment = validAmendments[0];
      cost = firstAmendment.cost;
      taxRate = firstAmendment.taxRate;
      logger.debug(`No sale event for item ${key}, using earliest amendment: cost=${cost}, taxRate=${taxRate}`);
    } else {
      logger.debug(`No valid data for item ${key}, skipping`);
      continue;
    }

    // Apply all valid amendments in order
    validAmendments.forEach((amendment) => {
      logger.debug(
        `Applying amendment for item ${key}: date=${amendment.date.toISOString()}, cost=${amendment.cost}, taxRate=${amendment.taxRate}`
      );
      cost = amendment.cost;
      taxRate = amendment.taxRate;
    });

    const tax = calculateTax(cost, taxRate);
    totalTax += tax;
    logger.debug(`Calculated tax for item ${key}: ${tax}`);
  }

  logger.info(`Total tax calculated: ${totalTax}`);
  return totalTax;
}
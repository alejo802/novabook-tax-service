import { TransactionRepository } from '../repositories/TransactionRepository';
import { AmendmentRepository } from '../repositories/AmendmentRepository';
import { calculateTax } from '../utils/taxUtils';
import { parseDate } from '../utils/dateUtils';
import logger from '../middleware/logger';

// Interfaces for clarity
interface Event {
  date: Date;
  eventType: string;
  [key: string]: any;
}

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

    // Parse and validate the date
    let queryDate: Date;
    try {
      queryDate = parseDate(dateString);
    } catch (error) {
      logger.error(`Invalid date format: ${dateString}`);
      throw new Error('Invalid date format. Please provide a valid ISO 8601 date string.');
    }

    try {
      // Fetch all transactions up to the given date
      const transactions = await TransactionRepository.findUpToDate(queryDate);
      logger.info(`Fetched ${transactions.length} transactions up to date ${queryDate.toISOString()}`);

      // Fetch all amendments up to the given date
      const amendments = await AmendmentRepository.findUpToDate(queryDate);
      logger.info(`Fetched ${amendments.length} amendments up to date ${queryDate.toISOString()}`);

      // Combine all events into a single list and ensure dates are Date objects
      const allEvents: Event[] = [
        ...transactions.map((tx) => ({
          ...tx,
          date: tx.date instanceof Date ? tx.date : new Date(tx.date),
        })),
        ...amendments.map((am) => ({
          ...am,
          date: am.date instanceof Date ? am.date : new Date(am.date),
          eventType: 'AMENDMENT',
        })),
      ];

      // Sort all events by date
      allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      let totalTax = 0;
      let totalTaxPayments = 0;

      // Map to keep track of sales items, key is `${invoiceId}-${itemId}`
      const itemDataMap = new Map<string, ItemData>();

      // Process events to build item data
      for (const event of allEvents) {
        if (event.eventType === 'SALES') {
          // Process sale items
          const invoiceId = event.invoiceId;
          event.items?.forEach((item: any) => {
            const key = `${invoiceId}-${item.itemId}`;
            let itemData = itemDataMap.get(key);
            if (!itemData) {
              itemData = { saleEvent: undefined, amendments: [] };
              itemDataMap.set(key, itemData);
            }
            itemData.saleEvent = {
              date: event.date,
              cost: item.cost,
              taxRate: item.taxRate,
            };
            logger.debug(`Processed sale event for item: ${key}`);
          });
        } else if (event.eventType === 'AMENDMENT') {
          // Process amendment
          const key = `${event.invoiceId}-${event.itemId}`;
          let itemData = itemDataMap.get(key);
          if (!itemData) {
            itemData = { saleEvent: undefined, amendments: [] };
            itemDataMap.set(key, itemData);
          }
          itemData.amendments.push({
            date: event.date,
            cost: event.cost,
            taxRate: event.taxRate,
          });
          logger.debug(`Processed amendment for item: ${key}`);
        } else if (event.eventType === 'TAX_PAYMENT') {
          // Process tax payment
          totalTaxPayments += event.amount || 0;
          logger.debug(`Processed tax payment: ${event.amount || 0}`);
        }
      }

      // Calculate tax for each item
      for (const [key, itemData] of itemDataMap.entries()) {
        const { saleEvent, amendments } = itemData;

        // Collect all amendments up to the query date
        const validAmendments = amendments.filter((am) => am.date.getTime() <= queryDate.getTime());

        if (!saleEvent && validAmendments.length === 0) {
          // No sale event or amendments up to query date, skip this item
          continue;
        }

        let cost: number;
        let taxRate: number;

        if (saleEvent && saleEvent.date.getTime() <= queryDate.getTime()) {
          // Start with the sale event
          cost = saleEvent.cost;
          taxRate = saleEvent.taxRate;
        } else if (validAmendments.length > 0) {
          // No sale event, use the earliest amendment
          validAmendments.sort((a, b) => a.date.getTime() - b.date.getTime());
          const firstAmendment = validAmendments[0];
          cost = firstAmendment.cost;
          taxRate = firstAmendment.taxRate;
          logger.debug(`No sale event for item ${key}, using earliest amendment.`);
        } else {
          continue;
        }

        // Apply all valid amendments in order
        validAmendments.sort((a, b) => a.date.getTime() - b.date.getTime());

        for (const amendment of validAmendments) {
          cost = amendment.cost;
          taxRate = amendment.taxRate;
        }

        const tax = calculateTax(cost, taxRate);
        totalTax += tax;
        logger.debug(`Calculated tax for item ${key}: ${tax}`);
      }

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
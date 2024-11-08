import { TransactionRepository } from '../repositories/TransactionRepository';
import { AmendmentRepository } from '../repositories/AmendmentRepository';
import { calculateTax } from '../utils/taxUtils';
import { parseDate } from '../utils/dateUtils';

export const TaxPositionService = {
  async getTaxPosition(dateString: string): Promise<number> {
    // Parse and validate the date using dateUtils
    const date = parseDate(dateString);

    // Fetch all relevant transactions and amendments up to the given date
    const transactions = await TransactionRepository.findByDate(date);
    const amendments = await AmendmentRepository.findByDate(date);

    let totalTax = 0;
    let totalTaxPayments = 0;

    // Process sales transactions
    transactions.forEach((transaction) => {
      if (transaction.eventType === 'SALES') {
        transaction.items?.forEach((item) => {
          let { cost, taxRate } = item;

          // Apply any amendments
          const amendment = amendments.find(
            (am) =>
              am.invoiceId === transaction.invoiceId && am.itemId === item.itemId
          );
          if (amendment) {
            cost = amendment.cost;
            taxRate = amendment.taxRate;
          }

          totalTax += calculateTax(cost, taxRate); // Use taxUtils to calculate tax
        });
      } else if (transaction.eventType === 'TAX_PAYMENT') {
        totalTaxPayments += transaction.amount || 0;
      }
    });

    // Tax position = Total tax from sales - Tax payments made
    return totalTax - totalTaxPayments;
  },
};
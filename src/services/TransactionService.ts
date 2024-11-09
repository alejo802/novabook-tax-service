import { TransactionRepository } from '../repositories/TransactionRepository';

export const TransactionService = {
  async ingest(transactionData: any) {
    return await TransactionRepository.create(transactionData);
  },

  async getTransactionsByDate(date: Date) {
    return await TransactionRepository.findUpToDate(date);
  },
};
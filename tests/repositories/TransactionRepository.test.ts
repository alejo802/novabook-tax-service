import { TransactionRepository } from '../../src/repositories/TransactionRepository';

describe('TransactionRepository', () => {
  it('should create a SALES transaction successfully', async () => {
    const transaction = await TransactionRepository.create({
      eventType: 'SALES',
      date: new Date(),
      invoiceId: '123',
      items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
    });

    expect(transaction).toHaveProperty('_id');
    expect(transaction.eventType).toBe('SALES');
  });

  it('should find transactions by date', async () => {
    const date = new Date();
    await TransactionRepository.create({
      eventType: 'SALES',
      date,
      invoiceId: '123',
      items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
    });

    const transactions = await TransactionRepository.findUpToDate(date);
    expect(transactions.length).toBe(1);
  });
});
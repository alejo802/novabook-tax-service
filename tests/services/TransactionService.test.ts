import { TransactionService } from '../../src/services/TransactionService';
import { TransactionRepository } from '../../src/repositories/TransactionRepository';

jest.mock('../../src/repositories/TransactionRepository');

describe('TransactionService', () => {
  it('should ingest a transaction successfully', async () => {
    const mockTransaction = { eventType: 'SALES', date: new Date(), invoiceId: '123', items: [] };
    (TransactionRepository.create as jest.Mock).mockResolvedValue(mockTransaction);

    const result = await TransactionService.ingest(mockTransaction);
    expect(TransactionRepository.create).toHaveBeenCalledWith(mockTransaction);
    expect(result).toEqual(mockTransaction);
  });

  it('should throw an error if ingestion fails', async () => {
    (TransactionRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(TransactionService.ingest({})).rejects.toThrow('Database error');
  });
});
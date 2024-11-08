import { TaxPositionService } from '../../src/services/TaxPositionService';
import { TransactionRepository } from '../../src/repositories/TransactionRepository';
import { AmendmentRepository } from '../../src/repositories/AmendmentRepository';
import { Amendment } from '../../src/repositories/AmendmentRepository';

jest.mock('../../src/repositories/TransactionRepository');
jest.mock('../../src/repositories/AmendmentRepository');

describe('TaxPositionService', () => {
  it('should calculate tax position correctly', async () => {
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: new Date(),
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
      { eventType: 'TAX_PAYMENT', date: new Date(), amount: 200 },
    ];
  
    const mockAmendments: Partial<Amendment>[] = [];
  
    (TransactionRepository.findByDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findByDate as jest.Mock).mockResolvedValue(mockAmendments);
  
    const result = await TaxPositionService.getTaxPosition('2024-02-22T17:29:39Z');
    
    expect(result).toBe(0); // Sales tax: 200 - Tax payment: 200 = 0
  });

  it('should apply amendments correctly', async () => {
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: new Date(),
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      { date: new Date(), invoiceId: '123', itemId: 'item1', cost: 1200, taxRate: 0.2 },
    ];

    (TransactionRepository.findByDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findByDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T17:29:39Z');
    expect(result).toBe(240); // Amended tax: 1200 * 0.2 = 240
  });
});
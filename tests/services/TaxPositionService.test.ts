import { TaxPositionService } from '../../src/services/TaxPositionService';
import { TransactionRepository } from '../../src/repositories/TransactionRepository';
import { AmendmentRepository, Amendment } from '../../src/repositories/AmendmentRepository';

jest.mock('../../src/repositories/TransactionRepository');
jest.mock('../../src/repositories/AmendmentRepository');

describe('TaxPositionService', () => {
  it('should calculate tax position correctly', async () => {
    // Basic test with one sale and one tax payment
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: new Date('2024-02-22T10:00:00Z'),
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
      { eventType: 'TAX_PAYMENT', date: new Date('2024-02-22T11:00:00Z'), amount: 200 },
    ];

    const mockAmendments: Partial<Amendment>[] = [];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');

    expect(result).toBe(0); // Sales tax: 200 - Tax payment: 200 = 0
  });

  it('should apply amendments correctly', async () => {
    // Test applying a single amendment
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: new Date('2024-02-22T10:00:00Z'),
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      {
        date: new Date('2024-02-22T11:00:00Z'),
        invoiceId: '123',
        itemId: 'item1',
        cost: 1200,
        taxRate: 0.2,
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(240); // Amended tax: 1200 * 0.2 = 240
  });

  it('should apply multiple amendments in order', async () => {
    // Test multiple amendments on a single item
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate1 = new Date('2024-02-22T11:00:00Z');
    const amendmentDate2 = new Date('2024-02-22T12:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      { date: amendmentDate1, invoiceId: '123', itemId: 'item1', cost: 1500, taxRate: 0.2 },
      { date: amendmentDate2, invoiceId: '123', itemId: 'item1', cost: 2000, taxRate: 0.2 },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T13:00:00Z');
    expect(result).toBe(400); // Tax: 2000 * 0.2 = 400
  });

  it('should handle amendments before sales event', async () => {
    // Test amendment received before the sales event
    const amendmentDate = new Date('2024-02-22T09:00:00Z');
    const saleDate = new Date('2024-02-22T10:00:00Z');
  
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];
  
    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.15,
      },
    ];
  
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);
  
    const result = await TaxPositionService.getTaxPosition('2024-02-22T11:00:00Z');
    expect(result).toBe(120); // Tax: 800 * 0.15 = 120
  });

  it('should ignore future-dated transactions and amendments', async () => {
    // Test that future events are not considered
    const saleDate = new Date('2024-02-23T10:00:00Z'); // Future date
    const amendmentDate = new Date('2024-02-23T11:00:00Z'); // Future date

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      { date: amendmentDate, invoiceId: '123', itemId: 'item1', cost: 800, taxRate: 0.15 },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // No transactions or amendments up to the query date
  });

  it('should handle negative tax positions when payments exceed sales tax', async () => {
    // Test negative tax position
    const saleDate = new Date('2024-02-22T10:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
      { eventType: 'TAX_PAYMENT', date: saleDate, amount: 300 }, // Payment exceeds sales tax
    ];

    const mockAmendments: Partial<Amendment>[] = [];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(-100); // Tax position: 200 - 300 = -100
  });

  it('should return zero tax position when there are no transactions or amendments', async () => {
    // Test with no data
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0);
  });

  it('should handle tax payments without sales events', async () => {
    // Test tax payments with no sales
    const paymentDate = new Date('2024-02-22T10:00:00Z');

    const mockTransactions = [{ eventType: 'TAX_PAYMENT', date: paymentDate, amount: 200 }];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(-200); // Tax position: 0 - 200 = -200
  });

  it('should calculate tax position when there are sales but no tax payments', async () => {
    // Test sales without tax payments
    const saleDate = new Date('2024-02-22T10:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(200); // Tax position: 200 - 0 = 200
  });

  it('should apply amendments that change the tax rate', async () => {
    // Test amendments that change the tax rate
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate = new Date('2024-02-22T11:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 1000,
        taxRate: 0.1,
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(100); // Tax: 1000 * 0.1 = 100
  });

  it('should handle amendments that cancel a sale (cost set to zero)', async () => {
    // Test amendments that set cost to zero
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate = new Date('2024-02-22T11:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 0,
        taxRate: 0.2,
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // Tax: 0 * 0.2 = 0
  });

  it('should apply amendments when transactions and amendments have the same date', async () => {
    // Test same date for sale and amendment
    const eventDate = new Date('2024-02-22T10:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: eventDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      { date: eventDate, invoiceId: '123', itemId: 'item1', cost: 1200, taxRate: 0.2 },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T11:00:00Z');
    expect(result).toBe(240); // Tax: 1200 * 0.2 = 240
  });

  it('should handle sales with multiple items, some with amendments', async () => {
    // Test multiple items in a sale with amendments on some
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate = new Date('2024-02-22T11:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [
          { itemId: 'item1', cost: 1000, taxRate: 0.2 },
          { itemId: 'item2', cost: 2000, taxRate: 0.2 },
        ],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 1500,
        taxRate: 0.2,
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(700); // Item1: 1500*0.2=300, Item2: 2000*0.2=400, Total: 700
  });

  it('should handle amendments to items that do not exist in any sale event', async () => {
    // Test amendments creating new sale items
    const amendmentDate = new Date('2024-02-22T10:00:00Z');

    const mockTransactions = []; // No sales

    const mockAmendments: Partial<Amendment>[] = [
      { date: amendmentDate, invoiceId: '123', itemId: 'item1', cost: 1000, taxRate: 0.2 },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(200); // Tax: 1000 * 0.2 = 200
  });

  it('should not apply amendments that occur after the query date', async () => {
    // Test that amendments after the query date are not applied
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate = new Date('2024-02-22T13:00:00Z'); // After query date

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    // Amendments up to query date
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]); // No amendments up to query date

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(200); // Tax: 1000 * 0.2 = 200
  });

  it('should apply amendments when calculating tax position after amendment date', async () => {
    // Test that amendments are applied after their date
    const saleDate = new Date('2024-02-22T10:00:00Z');
    const amendmentDate = new Date('2024-02-22T13:00:00Z'); // After previous query date

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.15,
      },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    // Before amendment date
    const resultBefore = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(resultBefore).toBe(200); // Tax before amendment: 1000 * 0.2 = 200

    // After amendment date
    const resultAfter = await TaxPositionService.getTaxPosition('2024-02-22T14:00:00Z');
    expect(resultAfter).toBe(120); // Tax after amendment: 800 * 0.15 = 120
  });

  it('should throw an error for invalid date format', async () => {
    const invalidDateString = 'invalid-date';

    await expect(TaxPositionService.getTaxPosition(invalidDateString)).rejects.toThrow(
      'Invalid date format. Please provide a valid ISO 8601 date string.'
    );
  });

  it('should skip items with no sale event and no valid amendments', async () => {
    const queryDate = new Date('2024-02-22T12:00:00Z');
    const amendmentDate = new Date('2024-02-22T13:00:00Z'); // After query date

    const mockTransactions = []; // No sales

    const mockAmendments: Partial<Amendment>[] = [
      { date: amendmentDate, invoiceId: '123', itemId: 'item1', cost: 1000, taxRate: 0.2 },
    ];

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // Should be 0 as there are no valid events up to the query date
  });

  it('should skip items with sale event after query date and no valid amendments', async () => {
    const saleDate = new Date('2024-02-22T13:00:00Z'); // After query date
    const queryDate = new Date('2024-02-22T12:00:00Z');

    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
    ];

    const mockAmendments: Partial<Amendment>[] = []; // No amendments

    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // Should be 0 as the sale event is after the query date
  });

  it('should handle errors during processing and log them', async () => {
    const queryDate = new Date('2024-02-22T12:00:00Z');

    // Simulate an error in the TransactionRepository
    (TransactionRepository.findUpToDate as jest.Mock).mockRejectedValue(new Error('Database error'));
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);

    await expect(TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z')).rejects.toThrow('Database error');
  });

  it('should skip amendments with missing required fields', async () => {
    const amendmentDate = new Date('2024-02-22T10:00:00Z');
  
    const mockTransactions = []; // No sales
  
    const mockAmendments: Partial<Amendment>[] = [
      {
        date: amendmentDate,
        invoiceId: '123',
        // Missing itemId
        cost: 1000,
        taxRate: 0.2,
      },
      {
        date: amendmentDate,
        // Missing invoiceId
        itemId: 'item1',
        cost: 1000,
        taxRate: 0.2,
      },
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        // Missing cost
        taxRate: 0.2,
      },
      {
        date: amendmentDate,
        invoiceId: '123',
        itemId: 'item1',
        cost: 1000,
        // Missing taxRate
      },
    ];
  
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);
  
    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // All amendments are invalid and filtered out
  });

  it('should skip transactions with missing required fields', async () => {
    const saleDate = new Date('2024-02-22T10:00:00Z');
  
    const mockTransactions = [
      {
        eventType: 'SALES',
        date: saleDate,
        // Missing invoiceId
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
      },
      {
        eventType: 'SALES',
        date: saleDate,
        invoiceId: '123',
        // Missing items
      },
    ];
  
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue(mockTransactions);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
  
    const result = await TaxPositionService.getTaxPosition('2024-02-22T12:00:00Z');
    expect(result).toBe(0); // Transactions are invalid and filtered out
  });

  it('should skip items with no sale event and invalid amendments', async () => {
    const queryDate = new Date('2024-02-22T12:00:00Z');
  
    const mockTransactions = []; // No sales
  
    const mockAmendments: Partial<Amendment>[] = [
      {
        date: new Date('2024-02-22T13:00:00Z'), // After query date
        invoiceId: '123',
        itemId: 'item1',
        cost: 1000,
        taxRate: 0.2,
      },
      {
        date: new Date('2024-02-22T11:00:00Z'), // Before query date
        // Missing required fields
        itemId: 'item1',
        cost: 1000,
      },
    ];
  
    (TransactionRepository.findUpToDate as jest.Mock).mockResolvedValue([]);
    (AmendmentRepository.findUpToDate as jest.Mock).mockResolvedValue(mockAmendments);
  
    const result = await TaxPositionService.getTaxPosition(queryDate.toISOString());
    expect(result).toBe(0); // No valid data for calculation
  });

  it('should handle unexpected errors and log them', async () => {
    const invalidDateString = '2024-02-30T12:00:00Z'; // Invalid date (February 30th doesn't exist)
  
    await expect(TaxPositionService.getTaxPosition(invalidDateString)).rejects.toThrow(
      'Invalid date format. Please provide a valid ISO 8601 date string.'
    );
  });
});
import request from 'supertest';
import app from '../../src/app';
import logger from '../../src/middleware/logger';
import { TransactionService } from '../../src/services/TransactionService';

jest.mock('../../src/services/TransactionService');

describe('TransactionController', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
  });


  it('should ingest SALES transaction successfully', async () => {
    (TransactionService.ingest as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post('/api/transactions')
      .send({
        transactionId: 'txn123',
        date: '2024-02-22T17:29:39Z',
        amount: 1000,
        invoiceId: '12345',
        eventType: 'SALES',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],  
      });

    expect(response.status).toBe(202);
    expect(TransactionService.ingest).toHaveBeenCalledWith({
      transactionId: 'txn123',
      amount: 1000,
      date: '2024-02-22T17:29:39Z',
      invoiceId: '12345',
      eventType: 'SALES',
      items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],  
    });
    
    expect(logger.info).toHaveBeenCalledWith(
      'Transaction ingested successfully',
      expect.objectContaining({
        requestId: expect.any(String),
        processingTime: expect.any(String),
      })
    );
  });

  it('should ingest TAX_PAYMENT transaction successfully', async () => {
    (TransactionService.ingest as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .post('/api/transactions')
      .send({
        transactionId: 'txn123',
        date: '2024-02-22T17:29:39Z',
        amount: 1000,
        invoiceId: '12345',
        eventType: 'TAX_PAYMENT',
        items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],  
      });

    expect(response.status).toBe(202);
    expect(TransactionService.ingest).toHaveBeenCalledWith({
      transactionId: 'txn123',
      amount: 1000,
      date: '2024-02-22T17:29:39Z',
      invoiceId: '12345',
      eventType: 'TAX_PAYMENT',
      items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],  
    });
    
    expect(logger.info).toHaveBeenCalledWith(
      'Transaction ingested successfully',
      expect.objectContaining({
        requestId: expect.any(String),
        processingTime: expect.any(String),
      })
    );
  });

  it('should return a validation error for an invalid SALES transaction', async () => {
    const response = await request(app).post('/api/transactions').send({
      eventType: 'SALES',
      date: 'invalid-date',
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
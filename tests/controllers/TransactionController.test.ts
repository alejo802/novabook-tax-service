import request from 'supertest';
import app from '../../src/app';

describe('TransactionController', () => {
  it('should ingest a SALES transaction successfully', async () => {
    const response = await request(app).post('/api/transactions').send({
      eventType: 'SALES',
      date: '2024-02-22T17:29:39Z',
      invoiceId: '12345',
      items: [{ itemId: 'item1', cost: 1000, taxRate: 0.2 }],
    });

    expect(response.status).toBe(202);
  });

  it('should ingest a TAX_PAYMENT transaction successfully', async () => {
    const response = await request(app).post('/api/transactions').send({
      eventType: 'TAX_PAYMENT',
      date: '2024-02-22T17:29:39Z',
      amount: 5000,
    });

    expect(response.status).toBe(202);
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
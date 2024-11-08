import request from 'supertest';
import app from '../../src/app';
import { AmendmentService } from '../../src/services/AmendmentService';

jest.mock('../../src/services/AmendmentService');

describe('AmendSaleController', () => {
  it('should amend a sale successfully', async () => {
    (AmendmentService.amend as jest.Mock).mockResolvedValueOnce(undefined); // Fix: Provide a resolved value

    const response = await request(app).patch('/api/sale').send({
      date: '2024-02-22T17:29:39Z',
      invoiceId: '12345',
      itemId: 'item1',
      cost: 800,
      taxRate: 0.1,
    });

    expect(response.status).toBe(202);
  });

  it('should return a validation error for an invalid amendment request', async () => {
    const response = await request(app).patch('/api/sale').send({
      invoiceId: '12345',
      itemId: 'item1',
      cost: -800, // Invalid cost
    });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});

import request from 'supertest';
import app from '../../src/app';
import { AmendmentService } from '../../src/services/AmendmentService';
import logger from '../../src/middleware/logger';

jest.mock('../../src/services/AmendmentService');

describe('AmendSaleController', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.spyOn(logger, 'info').mockImplementation(() => {});
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    jest.spyOn(logger, 'debug').mockImplementation(() => {});
  });

  it('should amend a sale successfully', async () => {
    (AmendmentService.amend as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z',
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
      });

    expect(response.status).toBe(202);
    expect(response.body).toEqual({}); // Empty response body

    // Verify that the amendment service was called with the correct data
    expect(AmendmentService.amend).toHaveBeenCalledWith({
      date: '2024-02-22T17:29:39Z',
      invoiceId: '12345',
      itemId: 'item1',
      cost: 800,
      taxRate: 0.1,
    });

    // Verify logging behavior
    expect(logger.info).toHaveBeenCalledWith(
      'Received amendment request',
      expect.objectContaining({
        requestId: expect.any(String),
        method: 'PATCH',
        path: '/api/sale',
        ip: expect.any(String),
      })
    );
    expect(logger.info).toHaveBeenCalledWith(
      'Amendment processed successfully',
      expect.objectContaining({
        requestId: expect.any(String),
        processingTime: expect.any(String),
      })
    );
  });

  it('should return a validation error for a negative cost', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        cost: -800, // Invalid cost
        taxRate: 0.1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.cost - Number must be greater than or equal to 0');
  });

  it('should return a validation error when invoiceId is missing', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.invoiceId - Required');
  });

  it('should return a validation error when itemId is missing', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        cost: 800,
        taxRate: 0.1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.itemId - Required');
  });

  it('should return a validation error when cost is missing', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        taxRate: 0.1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.cost - Required');
  });

  it('should return a validation error when taxRate is missing', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.taxRate - Required');
  });

  it('should return a validation error for an out-of-range taxRate', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 1.5, // Invalid tax rate
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.taxRate - Number must be less than or equal to 1');
  });

  it('should return a validation error for invalid data types', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: 12345, // Should be a string
        itemId: 'item1',
        cost: 'not-a-number', // Should be a number
        taxRate: 'not-a-number', // Should be a number
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('body.invoiceId - Expected string, received number');
    expect(response.body.message).toContain('body.cost - Expected number, received string');
    expect(response.body.message).toContain('body.taxRate - Expected number, received string');
  });

  it('should handle errors thrown by AmendmentService.amend and pass them to next', async () => {
    const error = new Error('Database error');
    (AmendmentService.amend as jest.Mock).mockRejectedValueOnce(error);

    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
      });

    // Since the controller passes the error to next(), and depending on your error handler, the response may be 500
    expect(response.status).toBe(500);
    expect(response.text).toContain('<title>Error</title>');
    expect(response.text).toContain('Error: Database error');

    // Verify that logger.error was called
    expect(logger.error).toHaveBeenCalledWith(
      'Error processing amendment',
      expect.objectContaining({
        requestId: expect.any(String),
        errorMessage: 'Database error',
        stack: expect.any(String),
      })
    );
  });

  it('should accept additional fields in the request body and still process the amendment', async () => {
    (AmendmentService.amend as jest.Mock).mockResolvedValueOnce(undefined);

    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z',
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
        extraField: 'extraValue', // Additional field
      });

    expect(response.status).toBe(202);
    expect(AmendmentService.amend).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2024-02-22T17:29:39Z',
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
        extraField: 'extraValue',
      })
    );
  });

  it('should handle invalid date format in the request body', async () => {
    const response = await request(app)
      .patch('/api/sale')
      .send({
        date: 'invalid-date', // Invalid date
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Invalid date'); 
  });

  it('should generate a unique requestId and include it in logs', async () => {
    (AmendmentService.amend as jest.Mock).mockResolvedValueOnce(undefined);

    // No need to spy again since it's done in beforeEach
    await request(app)
      .patch('/api/sale')
      .send({
        date: '2024-02-22T17:29:39Z', // Added date
        invoiceId: '12345',
        itemId: 'item1',
        cost: 800,
        taxRate: 0.1,
      });

    // Extract the requestId from the logs
    const receivedRequestIds = (logger.info as jest.Mock).mock.calls
      .map((call) => call[1]?.requestId)
      .filter(Boolean);

    // There should be at least one requestId logged
    expect(receivedRequestIds.length).toBeGreaterThan(0);

    // Ensure that requestIds are unique UUIDs
    receivedRequestIds.forEach((id) => {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });
  });
});
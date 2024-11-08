import request from 'supertest';
import app from '../../src/app';
import { TaxPositionService } from '../../src/services/TaxPositionService';

jest.mock('../../src/services/TaxPositionService');

describe('TaxPositionController', () => {
  it('should return the correct tax position for a given date', async () => {
    (TaxPositionService.getTaxPosition as jest.Mock).mockResolvedValue(100);

    const response = await request(app).get('/api/tax-position').query({ date: '2024-02-22T17:29:39Z' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      date: '2024-02-22T17:29:39Z',
      taxPosition: 100,
    });
  });

  it('should return a validation error for an invalid date', async () => {
    const response = await request(app).get('/api/tax-position').query({ date: 'invalid-date' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
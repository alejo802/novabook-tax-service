import { AmendmentService } from '../../src/services/AmendmentService';
import { AmendmentRepository } from '../../src/repositories/AmendmentRepository';

jest.mock('../../src/repositories/AmendmentRepository');

describe('AmendmentService', () => {
  it('should amend a sale successfully', async () => {
    const mockAmendment = { date: new Date(), invoiceId: '123', itemId: 'item1', cost: 800, taxRate: 0.15 };
    (AmendmentRepository.create as jest.Mock).mockResolvedValue(mockAmendment);

    const result = await AmendmentService.amend(mockAmendment);
    expect(AmendmentRepository.create).toHaveBeenCalledWith(mockAmendment);
    expect(result).toEqual(mockAmendment);
  });

  it('should throw an error if amendment fails', async () => {
    (AmendmentRepository.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(AmendmentService.amend({})).rejects.toThrow('Database error');
  });
});
import { AmendmentRepository } from '../../src/repositories/AmendmentRepository';

describe('AmendmentRepository', () => {
  it('should create an amendment successfully', async () => {
    const amendment = await AmendmentRepository.create({
      date: new Date(),
      invoiceId: '123',
      itemId: 'item1',
      cost: 800,
      taxRate: 0.15,
    });

    expect(amendment).toHaveProperty('_id');
    expect(amendment.invoiceId).toBe('123');
  });

  it('should find amendments by invoiceId', async () => {
    const invoiceId = '123';
    await AmendmentRepository.create({
      date: new Date(),
      invoiceId,
      itemId: 'item1',
      cost: 800,
      taxRate: 0.15,
    });

    const amendments = await AmendmentRepository.findByInvoiceId(invoiceId);
    expect(amendments.length).toBe(1);
  });
});
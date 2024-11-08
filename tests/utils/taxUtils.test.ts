import { calculateTax, sumTaxes } from '../../src/utils/taxUtils';

describe('taxUtils', () => {
  describe('calculateTax', () => {
    it('should correctly calculate the tax for a given cost and tax rate', () => {
      expect(calculateTax(1000, 0.2)).toBe(200);
    });

    it('should return 0 for a tax rate of 0', () => {
      expect(calculateTax(1000, 0)).toBe(0);
    });
  });

  describe('sumTaxes', () => {
    it('should correctly sum the taxes of multiple items', () => {
      const items = [
        { cost: 1000, taxRate: 0.2 },
        { cost: 2000, taxRate: 0.1 },
      ];
      expect(sumTaxes(items)).toBe(400); // 200 + 200
    });

    it('should return 0 for an empty array', () => {
      expect(sumTaxes([])).toBe(0);
    });
  });
});
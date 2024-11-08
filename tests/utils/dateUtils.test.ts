import { isValidDate, parseDate, formatDate } from '../../src/utils/dateUtils';

describe('dateUtils', () => {
  describe('isValidDate', () => {
    it('should return true for a valid date string', () => {
      expect(isValidDate('2024-02-22T17:29:39Z')).toBe(true);
    });

    it('should return false for an invalid date string', () => {
      expect(isValidDate('invalid-date')).toBe(false);
    });
  });

  describe('parseDate', () => {
    it('should return a Date object for a valid date string', () => {
      const result = parseDate('2024-02-22T17:29:39Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('should throw an error for an invalid date string', () => {
      expect(() => parseDate('invalid-date')).toThrow('Invalid date format');
    });
  });

  describe('formatDate', () => {
    it('should return an ISO string for a Date object', () => {
      const date = new Date('2024-02-22T17:29:39Z');
      expect(formatDate(date)).toBe('2024-02-22T17:29:39.000Z');
    });
  });
});
// tests/utils/dateUtils.test.ts

import { parseDate } from '../../src/utils/dateUtils';

describe('parseDate', () => {

  it('should throw an error for invalid date strings', () => {
    const invalidDateStrings = [
      'invalid-date',
      '2024-02-30T12:00:00Z', // February 30th doesn't exist
      '2021-04-31T00:00:00Z', // April has 30 days
      '2019-02-29T00:00:00Z', // 2019 is not a leap year
      '2021-13-01T00:00:00Z', // Invalid month
      '2021-00-10T00:00:00Z', // Invalid month
      '2021-01-00T00:00:00Z', // Invalid day
      '2021-01-32T00:00:00Z', // Invalid day
      '2021-01-01T24:00:00Z', // Invalid hour
      '2021-01-01T23:60:00Z', // Invalid minute
      '2021-01-01T23:59:60Z', // Invalid second
    ];

    invalidDateStrings.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrow('Invalid date');
    });
  });

  it('should parse dates without time component correctly', () => {
    const dateString = '2024-02-28';
    const expectedDateString = '2024-02-28T00:00:00.000Z';

    const date = parseDate(dateString);
    expect(date.toISOString()).toBe(expectedDateString);
  });

  it('should handle dates with different time zones', () => {
    const dateString = '2024-02-28T12:00:00+05:00'; // UTC+5
    const date = parseDate(dateString);
    const expectedDateString = '2024-02-28T07:00:00.000Z'; // Converted to UTC

    expect(date.toISOString()).toBe(expectedDateString);
  });

  it('should throw an error for incomplete date strings', () => {
    const invalidDateStrings = [
      '2024-02',          // Missing day
      '2024',             // Missing month and day
      '2024-02-28T',      // Missing time
      'T12:00:00Z',       // Missing date
      '',                 // Empty string
      ' ',                // Space character
      null as any,        // Null value
      undefined as any,   // Undefined value
    ];

    invalidDateStrings.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrowError();
    });
  });

  it('should throw an error for non-ISO date formats', () => {
    const invalidDateStrings = [
      '02/28/2024', // MM/DD/YYYY
      '28-02-2024', // DD-MM-YYYY
      '2024/02/28', // YYYY/MM/DD
      'Feb 28, 2024',
      '2024.02.28',
    ];

    invalidDateStrings.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrow('Invalid date');
    });
  });

  it('should throw an error for dates with invalid separators', () => {
    const invalidDateStrings = [
      '2024.02.28T12:00:00Z',
      '2024/02/28T12:00:00Z',
      '2024-02-28 12:00:00Z',
    ];

    invalidDateStrings.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrow('Invalid date');
    });
  });

  it('should throw an error for invalid leap year dates', () => {
    const invalidLeapDates = [
      '2019-02-29T00:00:00Z', // 2019 is not a leap year
      '2100-02-29T12:00:00Z', // 2100 is not a leap year
    ];

    invalidLeapDates.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrow('Invalid date');
    });
  });

  it('should parse dates with milliseconds correctly', () => {
    const dateString = '2024-02-28T12:00:00.123Z';
    const date = parseDate(dateString);
    expect(date.toISOString()).toBe(dateString);
  });

  it('should throw an error for dates with extra characters', () => {
    const invalidDateStrings = [
      '2024-02-28T12:00:00Z extra text',
      '2024-02-28T12:00:00Zabc',
    ];

    invalidDateStrings.forEach((dateString) => {
      expect(() => parseDate(dateString)).toThrow('Invalid date');
    });
  });
});
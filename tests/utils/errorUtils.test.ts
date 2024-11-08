import { AppError, createValidationError, createNotFoundError } from '../../src/utils/errorUtils';

describe('errorUtils', () => {
  describe('AppError', () => {
    it('should create an AppError with the correct message and status code', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });

    it('should capture the stack trace', () => {
      const error = new AppError('Test error', 400);
      expect(error.stack).toBeDefined();
    });
  });

  describe('createValidationError', () => {
    it('should return an AppError with a 400 status code', () => {
      const error = createValidationError('Validation failed');
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Validation failed');
    });
  });

  describe('createNotFoundError', () => {
    it('should return an AppError with a 404 status code', () => {
      const error = createNotFoundError('Not found');
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
    });
  });
});
import { errorHandler } from '../../src/middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../src/utils/errorUtils';
import logger from '../../src/middleware/logger';

jest.mock('../../src/middleware/logger');  // Mock the logger

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      originalUrl: '/test',
      body: { data: 'test' },
      headers: { 'x-test-header': 'value' },
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    mockNext = jest.fn();

    // Spy on logger.error to capture the logging
    loggerErrorSpy = jest.spyOn(logger, 'error').mockImplementation();
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();  // Restore the original logger after each test
  });

  it('should handle AppError with custom message and status', () => {
    const appError = new AppError('Custom error message', 400);
    errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

    // Verify the response for AppError
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Custom error message',
      statusCode: 400,
    });

    // Verify that error details are logged correctly
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error occurred at GET /test'),
      expect.objectContaining({
        message: 'Custom error message',
        stack: expect.any(String),
        headers: expect.objectContaining({
          'x-test-header': 'value',
        }),
        body: { data: 'test' },
      })
    );
  });

  it('should handle generic errors with 500 status and call next', () => {
    const genericError = new Error('Unexpected error');
    errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    // Verify that next() was called to forward the error
    expect(mockNext).toHaveBeenCalledWith(genericError);

    // Verify that logger.error was called with error details for the generic error
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error occurred at GET /test'),
      expect.objectContaining({
        message: 'Unexpected error',
        stack: expect.any(String),
        headers: expect.objectContaining({
          'x-test-header': 'value',
        }),
        body: { data: 'test' },
      })
    );
  });
});
import { errorHandler } from '../../src/middleware/errorHandler';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../src/utils/errorUtils';

describe('ErrorHandler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as Partial<Response>;
    mockNext = jest.fn();
  });

  it('should handle AppError with custom message and status', () => {
    const appError = new AppError('Custom error message', 400);
    errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Custom error message',
    });
  });

  it('should handle generic errors with 500 status', () => {
    const genericError = new Error('Unexpected error');
    errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error',
    });
  });
});
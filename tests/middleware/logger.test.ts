import { logger } from '../../src/middleware/logger';
import { Request, Response, NextFunction } from 'express';

describe('Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/test',
    };
    mockResponse = {};
    mockNext = jest.fn();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log request method and URL', () => {
    logger(mockRequest as Request, mockResponse as Response, mockNext);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/GET \/test/));
    expect(mockNext).toBeCalled();
  });
});
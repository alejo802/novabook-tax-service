import { validateRequest } from '../../src/middleware/validation';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createValidationError } from '../../src/utils/errorUtils';

const mockSchema = z.object({
  body: z.object({
    field1: z.string(),
    field2: z.number().min(0),
  }),
});

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      body: {
        field1: 'test',
        field2: 10,
      },
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should call next on valid input', () => {
    validateRequest(mockSchema)(mockRequest as Request, mockResponse as Response, mockNext);
    expect(mockNext).toBeCalled();
  });

  it('should return a validation error on invalid input', () => {
    mockRequest.body = { field1: 'test', field2: -10 }; // Invalid field2
    validateRequest(mockSchema)(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toBeCalledWith(expect.any(Error));
    expect(mockNext.mock.calls[0][0]).toEqual(
      createValidationError('Validation Error: body.field2 - Number must be greater than or equal to 0')
    );
  });
});
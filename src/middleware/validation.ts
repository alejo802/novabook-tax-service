import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createValidationError } from '../utils/errorUtils';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // TypeScript now knows error is a ZodError
        const detailedMessage = error.errors
          .map((err) => `${err.path.join('.')} - ${err.message}`)
          .join(', ');
        next(createValidationError(`Validation Error: ${detailedMessage}`));
      } else {
        next(createValidationError('Validation failed with unknown error.'));
      }
    }
  };
};
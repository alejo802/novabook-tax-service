import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errorUtils';
import logger from '../middleware/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log the error details using logger
  logger.error(`Error occurred at ${req.method} ${req.originalUrl}`, {
    message: err.message,
    stack: err.stack,
    headers: req.headers,
    body: req.body,
  });

  // If it is a custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      statusCode: err.statusCode,
    });
  }

  // If we are passing the error to the next middleware
  if (next) {
    return next(err);
  }

  // Fallback for unknown errors or if no other middleware handles the error
  res.status(500).json({
    message: 'Internal Server Error',
  });
};
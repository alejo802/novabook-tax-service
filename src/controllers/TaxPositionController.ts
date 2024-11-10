import { Request, Response, NextFunction } from 'express';
import { TaxPositionService } from '../services/TaxPositionService';
import logger from '../middleware/logger';
import { v4 as uuidv4 } from 'uuid';
import { validateTaxPositionRequest } from '../validators/taxPositionValidator';

export const queryTaxPosition = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4(); // Unique ID for tracing
  const requestStartTime = Date.now();

  try {
    logger.info('Received tax position query request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    // Input validation
    const validationErrors = validateTaxPositionRequest(req.query);
    if (validationErrors.length > 0) {
      logger.warn('Invalid tax position query request data', {
        requestId,
        errors: validationErrors,
      });
      return res.status(400).json({ errors: validationErrors });
    }

    // Exclude sensitive fields before logging
    const { secretInfo, ...safeQuery } = req.query;
    logger.debug('Tax position query parameters', {
      requestId,
      query: safeQuery,
    });

    const { date } = req.query;
    const taxPosition = await TaxPositionService.getTaxPosition(date as string);

    const processingTime = Date.now() - requestStartTime;
    logger.info('Tax position query processed successfully', {
      requestId,
      processingTime: `${processingTime}ms`,
    });

    res.status(200).json({ date, taxPosition });
  } catch (error) {
    logger.error('Error processing tax position query', {
      requestId,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};
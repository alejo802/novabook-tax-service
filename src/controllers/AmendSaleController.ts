import { Request, Response, NextFunction } from 'express';
import { AmendmentService } from '../services/AmendmentService';
import logger from '../middleware/logger';
import { v4 as uuidv4 } from 'uuid';
import { validateAmendmentRequest } from '../validators/amendmentValidator';

export const amendSale = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4(); // Unique ID for tracing
  const requestStartTime = Date.now();

  try {
    logger.info(`Received amendment request`, {
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    // Input validation
    const validationErrors = validateAmendmentRequest(req.body);
    if (validationErrors.length > 0) {
      logger.warn('Invalid amendment request data', {
        requestId,
        errors: validationErrors,
      });
      return res.status(400).json({ errors: validationErrors });
    }

    logger.debug('Amendment request body', {
      requestId,
      body: req.body,
    });

    await AmendmentService.amend(req.body);

    const processingTime = Date.now() - requestStartTime;
    logger.info('Amendment processed successfully', {
      requestId,
      processingTime: `${processingTime}ms`,
    });

    res.status(202).send(); // Accepted
  } catch (error) {
    logger.error('Error processing amendment', {
      requestId,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};
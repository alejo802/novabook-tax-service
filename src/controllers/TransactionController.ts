import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/TransactionService';
import logger from '../middleware/logger';
import { v4 as uuidv4 } from 'uuid';
import { validateTransactionRequest } from '../validators/transactionValidator';

export const ingestTransaction = async (req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4(); // Unique ID for tracing
  const requestStartTime = Date.now();

  try {
    logger.info('Received transaction ingestion request', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    // Input validation
    const validationErrors = validateTransactionRequest(req.body);
    if (validationErrors.length > 0) {
      logger.warn('Invalid transaction data', {
        requestId,
        errors: validationErrors,
      });
      return res.status(400).json({ errors: validationErrors });
    }

    // Exclude sensitive fields before logging
    const { sensitiveInfo, ...safeBody } = req.body;
    logger.debug('Transaction data', {
      requestId,
      body: safeBody,
    });

    await TransactionService.ingest(req.body);

    const processingTime = Date.now() - requestStartTime;
    logger.info('Transaction ingested successfully', {
      requestId,
      processingTime: `${processingTime}ms`,
    });

    res.status(202).send(); // Accepted
  } catch (error) {
    logger.error('Error processing transaction ingestion', {
      requestId,
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    next(error);
  }
};
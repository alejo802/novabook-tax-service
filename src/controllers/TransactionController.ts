import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/TransactionService';

export const ingestTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await TransactionService.ingest(req.body);
    res.status(202).send(); // Accepted
  } catch (error) {
    next(error);
  }
};
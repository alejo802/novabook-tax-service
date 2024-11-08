import { Request, Response, NextFunction } from 'express';
import { AmendmentService } from '../services/AmendmentService';

export const amendSale = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AmendmentService.amend(req.body);
    res.status(202).send(); // Accepted
  } catch (error) {
    next(error);
  }
};
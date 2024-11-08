import { Request, Response, NextFunction } from 'express';
import { TaxPositionService } from '../services/TaxPositionService';

export const queryTaxPosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const taxPosition = await TaxPositionService.getTaxPosition(date as string);
    res.status(200).json({ date, taxPosition });
  } catch (error) {
    next(error);
  }
};
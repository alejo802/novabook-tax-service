import { Router } from 'express';
import { validateRequest } from '../middleware/validation';
import { ingestTransaction } from '../controllers/TransactionController';
import { queryTaxPosition } from '../controllers/TaxPositionController';
import { amendSale } from '../controllers/AmendSaleController';

import {
  saleEventSchema,
  taxPaymentEventSchema,
  queryTaxPositionSchema,
  amendSaleSchema,
} from '../models/Schemas';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// POST /transactions: Validate both SALES and TAX_PAYMENT events
router.post(
  '/transactions',
  (req, res, next) => {
    const schema =
      req.body.eventType === 'SALES' ? saleEventSchema : taxPaymentEventSchema;
    return validateRequest(schema)(req, res, next);
  },
  ingestTransaction
);

// GET /tax-position: Validate query params
router.get('/tax-position', validateRequest(queryTaxPositionSchema), queryTaxPosition);

// PATCH /sale: Validate amend sale requests
router.patch('/sale', validateRequest(amendSaleSchema), amendSale);

export default router;
import { z } from 'zod';

export const saleEventSchema = z.object({
  body: z.object({
    eventType: z.literal('SALES'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    invoiceId: z.string(),
    items: z.array(
      z.object({
        itemId: z.string(),
        cost: z.number().min(0),
        taxRate: z.number().min(0).max(1),
      })
    ),
  }),
});

export const taxPaymentEventSchema = z.object({
    body: z.object({
        eventType: z.literal('TAX_PAYMENT'),
        date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
        amount: z.number().min(0),
    }),
});

export const queryTaxPositionSchema = z.object({
    query: z.object({
      date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
    }),
});

export const amendSaleSchema = z.object({
    body: z.object({
      date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date'),
      invoiceId: z.string(),
      itemId: z.string(),
      cost: z.number().min(0),
      taxRate: z.number().min(0).max(1),
    }),
  });
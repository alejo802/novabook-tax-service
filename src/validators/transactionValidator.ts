export const validateTransactionRequest = (body: any): string[] => {
  const errors: string[] = [];

  if (!body.eventType || (body.eventType !== 'SALES' && body.eventType !== 'TAX_PAYMENT')) {
    errors.push('Missing or invalid eventType. Must be either "SALES" or "TAX_PAYMENT".');
  }

  if (!body.date || typeof body.date !== 'string') {
    errors.push('Missing or invalid date');
  } else {
    const date = new Date(body.date);
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }
  }

  if (body.eventType === 'SALES') {
    if (!body.invoiceId || typeof body.invoiceId !== 'string') {
      errors.push('Missing or invalid invoiceId');
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      errors.push('Missing or invalid items array');
    } else {
      body.items.forEach((item: any, index: number) => {
        if (!item.itemId || typeof item.itemId !== 'string') {
          errors.push(`Item ${index + 1}: Missing or invalid itemId`);
        }

        if (item.cost == null || typeof item.cost !== 'number') {
          errors.push(`Item ${index + 1}: Missing or invalid cost`);
        } else if (item.cost <= 0) {
          errors.push(`Item ${index + 1}: Cost must be greater than 0`);
        }

        if (item.taxRate == null || typeof item.taxRate !== 'number') {
          errors.push(`Item ${index + 1}: Missing or invalid taxRate`);
        } else if (item.taxRate < 0 || item.taxRate > 1) {
          errors.push(`Item ${index + 1}: Tax rate must be between 0 and 1`);
        }
      });
    }
  } else if (body.eventType === 'TAX_PAYMENT') {
    if (body.amount == null || typeof body.amount !== 'number') {
      errors.push('Missing or invalid amount');
    } else if (body.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
  }

  return errors;
};
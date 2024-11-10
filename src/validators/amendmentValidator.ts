export function validateAmendmentRequest(body: any): string[] {
    const errors: string[] = [];
  
    if (!body.invoiceId) {
      errors.push('Missing invoiceId');
    }
  
    if (!body.itemId) {
      errors.push('Missing itemId');
    }
  
    if (body.cost === undefined || typeof body.cost !== 'number') {
      errors.push('Invalid or missing cost');
    }

    if (body.cost < 0) {
        errors.push('Cost cannot be negative');
      }
  
    if (body.taxRate === undefined || typeof body.taxRate !== 'number') {
      errors.push('Invalid or missing taxRate');
    }
  
    return errors;
  }
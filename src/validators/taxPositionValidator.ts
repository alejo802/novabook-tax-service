export const validateTaxPositionRequest = (query: any): string[] => {
    const errors: string[] = [];
  
    if (!query.date) {
      errors.push('Missing date');
    } else if (typeof query.date !== 'string') {
      errors.push('Invalid date');
    } else {
      const date = new Date(query.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid date format');
      }
    }
  
    return errors;
  };
export const isValidDate = (date: string): boolean => {
    return !isNaN(Date.parse(date));
  };
  
  export const parseDate = (date: string): Date => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date format');
    }
    return parsedDate;
  };
  
  export const formatDate = (date: Date): string => {
    return date.toISOString();
  };
export function parseDate(dateString: string): Date {
  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  // Verify that the date components match the input
  const [inputDatePart] = dateString.split('T');
  const [year, month, day] = inputDatePart.split('-').map(Number);

  const dateYear = date.getUTCFullYear();
  const dateMonth = date.getUTCMonth() + 1; // Months are zero-based
  const dateDay = date.getUTCDate();

  if (year !== dateYear || month !== dateMonth || day !== dateDay) {
    throw new Error('Invalid date');
  }

  return date;
}
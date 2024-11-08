export const calculateTax = (cost: number, taxRate: number): number => {
    return cost * taxRate;
  };
  
  export const sumTaxes = (items: Array<{ cost: number; taxRate: number }>): number => {
    return items.reduce((total, item) => total + calculateTax(item.cost, item.taxRate), 0);
  };


export const generateInvoiceNumber = () => {
  const date = new Date();
  return `INV-${date.getFullYear()}${date.getMonth() + 1}-${Date.now()}`;
};

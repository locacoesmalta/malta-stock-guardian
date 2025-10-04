/**
 * SUPABASE INTEGRATION READY: PAT Utility Functions
 * These functions ensure consistent PAT formatting across the application
 * and are ready for cloud database integration when the project returns to Lovable.
 */

/**
 * Formats a PAT number to exactly 6 digits with leading zeros
 * @param pat - The PAT number to format
 * @returns The formatted PAT with leading zeros (e.g., "123" → "000123")
 */
export const formatPAT = (pat: string): string => {
  return pat.padStart(6, '0');
};

/**
 * Validates if a PAT is valid (numeric and up to 6 digits)
 * @param pat - The PAT to validate
 * @returns True if valid, false otherwise
 */
export const validatePAT = (pat: string): boolean => {
  return /^\d{1,6}$/.test(pat);
};

/**
 * Calcula o tempo em meses desde a data de compra até hoje
 * @param purchaseDate - Data da compra no formato YYYY-MM-DD
 * @returns Número de meses ou null se data inválida
 */
export const calculateEquipmentAge = (purchaseDate: string): number | null => {
  if (!purchaseDate) return null;
  
  const purchase = new Date(purchaseDate);
  const today = new Date();
  
  if (isNaN(purchase.getTime())) return null;
  
  const months = (today.getFullYear() - purchase.getFullYear()) * 12 +
                 (today.getMonth() - purchase.getMonth());
  
  return Math.max(0, months);
};

/**
 * Formata valor para moeda brasileira (R$)
 * @param value - Valor numérico
 * @returns String formatada como moeda
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

/**
 * Parse de string de moeda para número
 * @param currencyString - String no formato "R$ 1.234,56"
 * @returns Número ou 0 se inválido
 */
export const parseCurrency = (currencyString: string): number => {
  if (!currencyString) return 0;
  
  // Remove R$, espaços e pontos de milhar
  const cleaned = currencyString
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  const value = parseFloat(cleaned);
  return isNaN(value) ? 0 : value;
};

/**
 * Formata o número do PAT para ter exatamente 6 dígitos com zeros à esquerda
 * @param pat - Número do PAT (string ou number)
 * @returns String com 6 dígitos ou null se inválido
 */
export const formatPAT = (pat: string | number): string | null => {
  // Converter para string e remover caracteres não numéricos
  const patString = String(pat).replace(/\D/g, '');
  
  // Validar se é um número
  if (!patString || isNaN(Number(patString))) {
    return null;
  }
  
  // Validar se tem mais de 6 dígitos
  if (patString.length > 6) {
    return null;
  }
  
  // Formatar com zeros à esquerda até completar 6 dígitos
  return patString.padStart(6, '0');
};

/**
 * Alias para formatPAT - busca por PAT aceitando formatos flexíveis
 * Aceita "1258" ou "001258" e retorna "001258"
 * @param pat - Número do PAT em qualquer formato
 * @returns String com 6 dígitos ou null se inválido
 */
export const searchByPAT = (pat: string): string | null => {
  return formatPAT(pat);
};

/**
 * Valida se o PAT está no formato correto
 * @param pat - Número do PAT
 * @returns Objeto com status de validação e mensagem de erro se houver
 */
export const validatePAT = (pat: string): { valid: boolean; error?: string } => {
  const patString = String(pat).replace(/\D/g, '');
  
  if (!patString) {
    return { valid: false, error: 'PAT é obrigatório' };
  }
  
  if (isNaN(Number(patString))) {
    return { valid: false, error: 'PAT deve conter apenas números' };
  }
  
  if (patString.length > 6) {
    return { valid: false, error: 'PAT não pode ter mais de 6 dígitos' };
  }
  
  return { valid: true };
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

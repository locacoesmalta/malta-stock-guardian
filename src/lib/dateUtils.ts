/**
 * Utilitário para manipulação de datas garantindo sempre o horário local
 * 
 * PROBLEMA: new Date().toISOString().split('T')[0] converte para UTC,
 * causando perda de 1 dia em alguns casos
 * 
 * SOLUÇÃO: Usar sempre horário local do Brasil (America/Belem - UTC-3)
 */

/**
 * Retorna a data atual no formato YYYY-MM-DD usando o horário local
 * 
 * @example
 * getTodayLocalDate() // "2025-11-05"
 */
export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte um objeto Date para string YYYY-MM-DD usando o horário local
 * 
 * @param date - Data a ser convertida
 * @example
 * toLocalDateString(new Date()) // "2025-11-05"
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Utilitário para manipulação de datas garantindo sempre o horário de Belém-PA
 * 
 * PROBLEMA: new Date().toISOString().split('T')[0] converte para UTC,
 * causando perda de 1 dia em alguns casos
 * 
 * SOLUÇÃO: Usar SEMPRE o timezone America/Belem (UTC-3) explicitamente
 * em todas as operações de data do sistema
 */

export const BELEM_TIMEZONE = "America/Belem";

/**
 * Retorna a data/hora atual no timezone de Belém (UTC-3)
 * 
 * @example
 * getNowInBelem() // Date object in America/Belem timezone
 */
export function getNowInBelem(): Date {
  return toZonedTime(new Date(), BELEM_TIMEZONE);
}

/**
 * Retorna a data atual no formato YYYY-MM-DD no timezone de Belém
 * 
 * @example
 * getTodayLocalDate() // "2025-11-17"
 */
export function getTodayLocalDate(): string {
  const now = getNowInBelem();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte um objeto Date para string YYYY-MM-DD no timezone de Belém
 * 
 * @param date - Data a ser convertida
 * @example
 * toLocalDateString(new Date()) // "2025-11-17"
 */
export function toLocalDateString(date: Date): string {
  const zonedDate = toZonedTime(date, BELEM_TIMEZONE);
  const year = zonedDate.getFullYear();
  const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
  const day = String(zonedDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma string de data (YYYY-MM-DD) para Date no timezone de Belém
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @example
 * parseLocalDate("2025-11-17") // Date object in Belém timezone
 */
export function parseLocalDate(dateString: string): Date {
  return toZonedTime(parseISO(dateString), BELEM_TIMEZONE);
}

/**
 * Formata uma data para exibição no formato brasileiro (dd/MM/yyyy)
 * 
 * @param date - Data a ser formatada (string ou Date)
 * @example
 * formatDateBR("2025-11-17") // "17/11/2025"
 */
export function formatDateBR(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const zonedDate = toZonedTime(dateObj, BELEM_TIMEZONE);
  return format(zonedDate, "dd/MM/yyyy", { locale: ptBR });
}

/**
 * Formata uma data/hora para exibição no formato brasileiro (dd/MM/yyyy HH:mm)
 * 
 * @param date - Data a ser formatada (string ou Date)
 * @example
 * formatDateTimeBR("2025-11-17T14:30:00") // "17/11/2025 14:30"
 */
export function formatDateTimeBR(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const zonedDate = toZonedTime(dateObj, BELEM_TIMEZONE);
  return format(zonedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

/**
 * Calcula a diferença em dias entre duas datas no timezone de Belém
 * 
 * @param dateLeft - Data mais recente
 * @param dateRight - Data mais antiga
 * @example
 * getDaysDifference(new Date(), "2025-11-10") // 7
 */
export function getDaysDifference(dateLeft: string | Date, dateRight: string | Date): number {
  const leftDate = typeof dateLeft === "string" ? parseISO(dateLeft) : dateLeft;
  const rightDate = typeof dateRight === "string" ? parseISO(dateRight) : dateRight;
  
  const zonedLeft = toZonedTime(leftDate, BELEM_TIMEZONE);
  const zonedRight = toZonedTime(rightDate, BELEM_TIMEZONE);
  
  return differenceInDays(zonedLeft, zonedRight);
}

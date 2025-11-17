/**
 * CONFIGURAÇÃO CENTRALIZADA DE FUSO HORÁRIO
 * 
 * ⚠️ CRITICAL: Todo o sistema DEVE usar estas funções para trabalhar com datas.
 * 
 * Fuso Horário: America/Belem (UTC-3)
 * Localização: Belém - Pará, Brasil
 * 
 * NUNCA use:
 * - new Date() diretamente
 * - Date.now() diretamente
 * - funções de data sem considerar o fuso horário
 * 
 * SEMPRE use:
 * - getCurrentDateTime() para obter data/hora atual
 * - getCurrentDate() para obter apenas a data atual
 * - formatInTimeZone() para formatar datas
 */

import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Fuso horário configurado do sistema
 * America/Belem = UTC-3 (Belém, Pará, Brasil)
 */
export const SYSTEM_TIMEZONE = 'America/Belem';

/**
 * Obtém a data e hora atual no fuso horário de Belém
 * 
 * @returns Date object com data/hora atual em America/Belem
 * 
 * @example
 * const agora = getCurrentDateTime();
 * console.log(agora); // 2025-11-17 10:30:00 (horário de Belém)
 */
export function getCurrentDateTime(): Date {
  return toZonedTime(new Date(), SYSTEM_TIMEZONE);
}

/**
 * Obtém a data atual (sem hora) no fuso horário de Belém
 * Formato: YYYY-MM-DD
 * 
 * @returns string com data atual no formato ISO (YYYY-MM-DD)
 * 
 * @example
 * const hoje = getCurrentDate();
 * console.log(hoje); // "2025-11-17"
 */
export function getCurrentDate(): string {
  return formatInTimeZone(new Date(), SYSTEM_TIMEZONE, 'yyyy-MM-dd');
}

/**
 * Obtém a data e hora atual formatada no padrão brasileiro
 * Formato: DD/MM/YYYY HH:mm:ss
 * 
 * @returns string com data/hora formatada
 * 
 * @example
 * const dataHora = getCurrentDateTimeBR();
 * console.log(dataHora); // "17/11/2025 10:30:00"
 */
export function getCurrentDateTimeBR(): string {
  return formatInTimeZone(new Date(), SYSTEM_TIMEZONE, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
}

/**
 * Obtém apenas a data atual formatada no padrão brasileiro
 * Formato: DD/MM/YYYY
 * 
 * @returns string com data formatada
 * 
 * @example
 * const data = getCurrentDateBR();
 * console.log(data); // "17/11/2025"
 */
export function getCurrentDateBR(): string {
  return formatInTimeZone(new Date(), SYSTEM_TIMEZONE, 'dd/MM/yyyy', { locale: ptBR });
}

/**
 * Converte uma data/hora UTC para o fuso horário de Belém
 * 
 * @param date - Data em UTC ou string ISO
 * @returns Date object convertido para America/Belem
 * 
 * @example
 * const dataUTC = new Date('2025-11-17T13:30:00Z');
 * const dataBelem = toBelemTime(dataUTC);
 * console.log(dataBelem); // 2025-11-17 10:30:00 (UTC-3)
 */
export function toBelemTime(date: Date | string): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, SYSTEM_TIMEZONE);
}

/**
 * Formata uma data no fuso horário de Belém
 * 
 * @param date - Data a ser formatada
 * @param formatStr - Formato desejado (padrão date-fns)
 * @returns string com data formatada
 * 
 * @example
 * const data = new Date('2025-11-17T13:30:00Z');
 * const formatada = formatBelemDate(data, 'dd/MM/yyyy HH:mm');
 * console.log(formatada); // "17/11/2025 10:30"
 */
export function formatBelemDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, SYSTEM_TIMEZONE, formatStr, { locale: ptBR });
}

/**
 * Verifica se uma data está no futuro (considerando fuso horário de Belém)
 * 
 * @param date - Data a ser verificada
 * @returns true se a data é futura, false caso contrário
 * 
 * @example
 * const amanha = new Date('2025-11-18');
 * console.log(isFutureDate(amanha)); // true
 */
export function isFutureDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = getCurrentDateTime();
  return dateObj > now;
}

/**
 * Verifica se uma data está no passado (considerando fuso horário de Belém)
 * 
 * @param date - Data a ser verificada
 * @returns true se a data é passada, false caso contrário
 * 
 * @example
 * const ontem = new Date('2025-11-16');
 * console.log(isPastDate(ontem)); // true
 */
export function isPastDate(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const now = getCurrentDateTime();
  return dateObj < now;
}

/**
 * Obtém informações completas sobre o fuso horário do sistema
 * 
 * @returns Objeto com informações do fuso horário
 */
export function getTimezoneInfo() {
  return {
    timezone: SYSTEM_TIMEZONE,
    name: 'Horário de Belém',
    location: 'Belém, Pará, Brasil',
    utcOffset: 'UTC-3',
    currentDate: getCurrentDate(),
    currentDateTime: getCurrentDateTimeBR(),
  };
}

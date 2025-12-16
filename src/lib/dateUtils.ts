import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * ⚠️ CONFIGURAÇÃO CRÍTICA DE FUSO HORÁRIO - LEIA ATENTAMENTE
 * 
 * FUSO HORÁRIO DO SISTEMA: America/Belem (UTC-3)
 * LOCALIZAÇÃO: Belém, Pará, Brasil
 * DATA DE REFERÊNCIA: 17/11/2025 (17 de novembro de 2025)
 * 
 * 🚫 NUNCA USE:
 * - new Date() diretamente
 * - Date.now() diretamente  
 * - toISOString().split('T')[0] (converte para UTC e perde 1 dia!)
 * 
 * ✅ SEMPRE USE as funções deste arquivo que consideram o fuso horário
 * 
 * PROBLEMA: new Date().toISOString().split('T')[0] converte para UTC,
 * causando perda de 1 dia em alguns casos (ex: 23h em Belém = 02h UTC do dia seguinte)
 * 
 * SOLUÇÃO: Usar SEMPRE o timezone America/Belem (UTC-3) explicitamente
 * em todas as operações de data do sistema
 */

export const BELEM_TIMEZONE = "America/Belem";

/**
 * Alias para compatibilidade com código que usava timezone.ts
 * @deprecated Use BELEM_TIMEZONE diretamente
 */
export const SYSTEM_TIMEZONE = BELEM_TIMEZONE;

/**
 * ⚠️ FUNÇÃO PRINCIPAL: Retorna a data/hora atual no timezone de Belém (UTC-3)
 * USE ESTA FUNÇÃO sempre que precisar da data/hora atual
 * 
 * @returns Date object in America/Belem timezone
 * 
 * @example
 * const agora = getNowInBelem();
 * console.log(agora); // 2025-11-17 10:30:00 (UTC-3)
 */
export function getNowInBelem(): Date {
  return toZonedTime(new Date(), BELEM_TIMEZONE);
}

/**
 * ⚠️ FUNÇÃO PRINCIPAL: Retorna a data atual no formato YYYY-MM-DD
 * USE ESTA FUNÇÃO para preencher campos de data em formulários
 * 
 * @returns string no formato YYYY-MM-DD (data atual em Belém)
 * 
 * @example
 * const hoje = getTodayLocalDate();
 * console.log(hoje); // "2025-11-17"
 * 
 * // Uso em formulários:
 * const [formData, setFormData] = useState({
 *   report_date: getTodayLocalDate(), // ✅ Correto
 * });
 */
export function getTodayLocalDate(): string {
  const now = getNowInBelem();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ⚠️ FUNÇÃO PRINCIPAL: Retorna a data e hora atual formatada no padrão brasileiro
 * Formato: DD/MM/YYYY HH:mm
 * 
 * @returns string com data/hora atual formatada
 * 
 * @example
 * const dataHora = getCurrentDateTimeBR();
 * console.log(dataHora); // "17/11/2025 10:30"
 */
export function getCurrentDateTimeBR(): string {
  return formatInTimeZone(new Date(), BELEM_TIMEZONE, 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

/**
 * ⚠️ FUNÇÃO PRINCIPAL: Retorna apenas a data atual formatada no padrão brasileiro
 * Formato: DD/MM/YYYY
 * 
 * @returns string com data atual formatada
 * 
 * @example
 * const data = getCurrentDateBR();
 * console.log(data); // "17/11/2025"
 */
export function getCurrentDateBR(): string {
  return formatInTimeZone(new Date(), BELEM_TIMEZONE, 'dd/MM/yyyy', { locale: ptBR });
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

/**
 * ⚠️ FUNÇÃO SEGURA: Formata YYYY-MM-DD para DD/MM/YYYY sem conversão UTC
 * USE ESTA FUNÇÃO para exibir datas salvas no banco de dados
 * 
 * Evita bug de `new Date("YYYY-MM-DD")` que interpreta como UTC e perde 1 dia no timezone America/Belem
 * 
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns string no formato DD/MM/YYYY
 * 
 * @example
 * formatBRFromYYYYMMDD("2025-11-04") // "04/11/2025"
 * 
 * // Uso em exibição:
 * <p>Data: {formatBRFromYYYYMMDD(report.report_date)}</p> // ✅ Correto
 */
export function formatBRFromYYYYMMDD(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * ⚠️ FUNÇÃO CRÍTICA: Converte data de input (YYYY-MM-DD) considerando timezone de Belém
 * USE ESTA FUNÇÃO ao enviar datas de formulários para o banco de dados
 * 
 * Resolve o problema de datas sendo salvas com 1 dia a menos devido a conversão UTC incorreta
 * 
 * @param dateString - Data no formato YYYY-MM-DD do input HTML
 * @returns string no formato YYYY-MM-DD interpretado como data de Belém
 * 
 * @example
 * parseInputDateToBelem("2025-11-04") // "2025-11-04" (garantido timezone correto)
 * 
 * // Uso em envio de dados:
 * const { data } = await supabase.from("reports").insert({
 *   report_date: parseInputDateToBelem(formData.report_date), // ✅ Correto
 * });
 */
export function parseInputDateToBelem(dateString: string): string {
  if (!dateString) return dateString;
  
  // Input HTML date retorna "YYYY-MM-DD"
  // Precisamos garantir que seja interpretado como data de Belém
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Criar data explicitamente no timezone de Belém (meio-dia para evitar edge cases)
  const belemDate = toZonedTime(
    new Date(year, month - 1, day, 12, 0, 0),
    BELEM_TIMEZONE
  );
  
  // Retornar apenas a data no formato ISO (YYYY-MM-DD)
  return format(belemDate, 'yyyy-MM-dd');
}

// ============================================================================
// FUNÇÕES CONSOLIDADAS DE src/config/timezone.ts
// ============================================================================

/**
 * Alias para getNowInBelem - para compatibilidade com código que usava timezone.ts
 * @deprecated Use getNowInBelem() diretamente
 */
export function getCurrentDateTime(): Date {
  return getNowInBelem();
}

/**
 * Alias para getTodayLocalDate - para compatibilidade com código que usava timezone.ts
 * @deprecated Use getTodayLocalDate() diretamente
 */
export function getCurrentDate(): string {
  return getTodayLocalDate();
}

/**
 * Converte uma data/hora para o fuso horário de Belém
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
  return toZonedTime(dateObj, BELEM_TIMEZONE);
}

/**
 * Formata uma data no fuso horário de Belém com formato customizável
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
  return formatInTimeZone(dateObj, BELEM_TIMEZONE, formatStr, { locale: ptBR });
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
  const now = getNowInBelem();
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
  const now = getNowInBelem();
  return dateObj < now;
}

/**
 * Obtém informações completas sobre o fuso horário do sistema
 * 
 * @returns Objeto com informações do fuso horário
 */
export function getTimezoneInfo() {
  return {
    timezone: BELEM_TIMEZONE,
    name: 'Horário de Belém',
    location: 'Belém, Pará, Brasil',
    utcOffset: 'UTC-3',
    currentDate: getTodayLocalDate(),
    currentDateTime: getCurrentDateTimeBR(),
  };
}

/**
 * ⚠️ FUNÇÃO CRÍTICA: Retorna timestamp ISO no timezone de Belém
 * USE ESTA FUNÇÃO ao salvar timestamps no banco de dados (campos updated_at, created_at, etc)
 * 
 * @returns string ISO timestamp com timezone correto de Belém
 * 
 * @example
 * const timestamp = getISOStringInBelem();
 * console.log(timestamp); // "2025-11-17T10:30:00.000-03:00"
 * 
 * // Uso em atualizações:
 * await supabase.from("assets").update({ updated_at: getISOStringInBelem() });
 */
export function getISOStringInBelem(): string {
  return formatInTimeZone(new Date(), BELEM_TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
}

// ============================================================================
// FUNÇÕES SAFE - SEM CONVERSÃO DE TIMEZONE DUPLA
// ============================================================================

/**
 * ⚠️ FUNÇÃO SAFE: Parse de string "YYYY-MM-DD" para Date SEM conversão UTC
 * 
 * USE ESTA FUNÇÃO para strings que já representam datas de Belém (vindas do banco ou inputs HTML)
 * Cria Date ao MEIO-DIA para evitar edge cases de meia-noite
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @returns Date object local (sem conversão timezone)
 * 
 * @example
 * safeParseDateString("2025-12-14") // Date local 14/12/2025 12:00:00
 */
export function safeParseDateString(dateString: string): Date {
  if (!dateString) throw new Error("Data inválida");
  const [year, month, day] = dateString.split('-').map(Number);
  // Criar Date ao MEIO-DIA para evitar edge cases de meia-noite
  return new Date(year, month - 1, day, 12, 0, 0);
}

/**
 * ⚠️ FUNÇÃO SAFE: Converte Date para string "YYYY-MM-DD" SEM conversão timezone
 * 
 * USE ESTA FUNÇÃO para converter Date local para string sem aplicar timezone
 * 
 * @param date - Date object
 * @returns string no formato YYYY-MM-DD
 * 
 * @example
 * safeDateToString(new Date(2025, 11, 14)) // "2025-12-14"
 */
export function safeDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * ⚠️ FUNÇÃO SAFE: Formata string YYYY-MM-DD para formato curto DD/MM/YY
 * 
 * USE ESTA FUNÇÃO para exibir datas em formato curto sem conversão timezone
 * 
 * @param dateString - String no formato YYYY-MM-DD
 * @returns string no formato DD/MM/YY
 * 
 * @example
 * formatBRShortFromYYYYMMDD("2025-12-14") // "14/12/25"
 */
export function formatBRShortFromYYYYMMDD(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

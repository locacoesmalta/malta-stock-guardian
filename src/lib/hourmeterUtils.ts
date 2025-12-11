/**
 * Formata segundos para o formato de horímetro: 000:00:00 (horas:minutos:segundos)
 */
export function formatHourmeter(seconds: number): string {
  if (!seconds || seconds < 0) return "000:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  // Formato dinâmico: mínimo 3 dígitos, mas cresce se necessário
  const hoursStr = hours < 1000 ? String(hours).padStart(3, '0') : String(hours);
  return `${hoursStr}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Converte string no formato 000:00:00 para segundos
 */
export function parseHourmeter(formatted: string): number {
  if (!formatted) return 0;
  
  const parts = formatted.split(':').map(p => parseInt(p) || 0);
  
  if (parts.length !== 3) return 0;
  
  const [hours, minutes, seconds] = parts;
  return (hours * 3600) + (minutes * 60) + seconds;
}

/**
 * Valida formato de horímetro
 */
export function validateHourmeterFormat(value: string): boolean {
  const regex = /^\d{3}:\d{2}:\d{2}$/;
  return regex.test(value);
}

/**
 * Calcula diferença entre dois horímetros
 */
export function calculateHourmeterDiff(previous: number, current: number): number {
  return Math.max(0, current - previous);
}

/**
 * Normaliza entrada de horímetro flexível para o formato padrão 000:00:00
 * Aceita formatos como: 1:02:20, 12:30:45, 001:02:20
 * @returns String formatada ou null se inválida
 */
export function normalizeHourmeterInput(input: string): string | null {
  if (!input) return null;
  
  // Remove espaços e caracteres inválidos (apenas números e :)
  const cleaned = input.trim().replace(/[^\d:]/g, '');
  
  // Divide pelas partes
  const parts = cleaned.split(':');
  
  // Precisa ter exatamente 3 partes (HH:MM:SS)
  if (parts.length !== 3) return null;
  
  // Converte para números
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  const seconds = parseInt(parts[2]) || 0;
  
  // Validação de ranges - permite até 99.999 horas para equipamentos de alta utilização
  if (hours < 0 || hours > 99999) return null;
  if (minutes < 0 || minutes > 59) return null;
  if (seconds < 0 || seconds > 59) return null;
  
  // Formata no padrão correto: 000:00:00
  return `${String(hours).padStart(3, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

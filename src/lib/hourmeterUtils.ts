/**
 * Formata segundos para o formato de horímetro: 000:00:00 (horas:minutos:segundos)
 */
export function formatHourmeter(seconds: number): string {
  if (!seconds || seconds < 0) return "000:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${String(hours).padStart(3, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

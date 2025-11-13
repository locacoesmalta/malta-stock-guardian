/**
 * Helper de sanitização para Edge Functions.
 * Protege contra XSS e SQL Injection em inputs de backend.
 */

/**
 * Sanitiza input removendo tags HTML e caracteres perigosos.
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  
  // Remove tags HTML
  let clean = input.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle
  clean = clean.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove protocolos perigosos
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, '');
  
  // Limita comprimento
  clean = clean.slice(0, 1000);
  
  return clean.trim();
};

/**
 * Valida e sanitiza parâmetro de query string.
 */
export const validateQueryParam = (
  param: string | null, 
  maxLength: number = 200
): string | null => {
  if (!param) return null;
  
  const clean = sanitizeInput(param);
  
  if (clean.length > maxLength) return null;
  if (clean.length === 0) return null;
  
  return clean;
};

/**
 * Valida formato de email.
 */
export const validateEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  
  const clean = email.trim().toLowerCase();
  
  // Regex rigoroso
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(clean)) return null;
  if (clean.length > 255) return null;
  if (/<|>|"|'|`|\\/.test(clean)) return null;
  
  return clean;
};

/**
 * Valida UUID v4.
 */
export const validateUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Detecta padrões de ataque XSS.
 */
export const containsXSSPatterns = (input: string | null | undefined): boolean => {
  if (!input) return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /onerror\s*=/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Detecta padrões de SQL injection.
 */
export const containsSQLInjectionPatterns = (input: string | null | undefined): boolean => {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\bOR\b.*=.*|\bAND\b.*=.*)/i,
    /\bDROP\b\s+\bTABLE\b/i,
    /\bUNION\b\s+\bSELECT\b/i,
    /;.*--/,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Sanitiza nome de arquivo.
 */
export const sanitizeFileName = (filename: string | null | undefined): string => {
  if (!filename) return '';
  
  let clean = filename.replace(/\.\./g, '');
  clean = clean.replace(/[<>:"|?*\/\\]/g, '');
  clean = clean.trim().replace(/\s+/g, '_');
  
  if (clean.length > 255) {
    const ext = clean.split('.').pop() || '';
    clean = clean.slice(0, 250 - ext.length) + '.' + ext;
  }
  
  return clean;
};

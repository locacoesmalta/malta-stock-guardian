import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML removendo todas as tags e atributos perigosos.
 * USO: Campos que podem aceitar rich text mas precisam ser seguros.
 * 
 * @example
 * sanitizeHTML('<script>alert("xss")</script>Hello') // Returns: 'Hello'
 * 
 * @param dirty - String potencialmente perigosa
 * @returns String limpa e segura
 */
export const sanitizeHTML = (dirty: string | null | undefined): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Sem tags HTML permitidas
    ALLOWED_ATTR: [], // Sem atributos permitidos
    KEEP_CONTENT: true, // Mantém o texto interno
  });
};

/**
 * Sanitiza texto removendo caracteres perigosos mas mantendo texto normal.
 * USO: Campos de texto simples (nomes, descrições, etc).
 * 
 * @example
 * sanitizeText('<script>alert("xss")</script>') // Returns: 'scriptalert("xss")/script'
 * sanitizeText('João Silva') // Returns: 'João Silva'
 * 
 * @param input - String de entrada
 * @returns String sanitizada
 */
export const sanitizeText = (input: string | null | undefined): string => {
  if (!input) return '';
  
  // Remove tags HTML
  let clean = input.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle (exceto quebras de linha e tabs)
  clean = clean.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove sequências perigosas
  clean = clean.replace(/javascript:/gi, '');
  clean = clean.replace(/on\w+\s*=/gi, '');
  
  return clean;
};

/**
 * Remove especificamente tags <script> e seus conteúdos.
 * USO: Quando precisa manter alguma formatação mas bloquear scripts.
 * 
 * @param input - String de entrada
 * @returns String sem scripts
 */
export const stripScriptTags = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Sanitiza nomes de arquivo removendo caracteres perigosos.
 * USO: Upload de arquivos.
 * 
 * @example
 * sanitizeFileName('<script>.jpg') // Returns: 'script.jpg'
 * sanitizeFileName('../../etc/passwd') // Returns: 'etcpasswd'
 * 
 * @param filename - Nome do arquivo
 * @returns Nome seguro
 */
export const sanitizeFileName = (filename: string | null | undefined): string => {
  if (!filename) return '';
  
  // Remove path traversal
  let clean = filename.replace(/\.\./g, '');
  
  // Remove caracteres especiais perigosos
  clean = clean.replace(/[<>:"|?*\/\\]/g, '');
  
  // Remove espaços extras
  clean = clean.trim().replace(/\s+/g, '_');
  
  // Limita comprimento
  if (clean.length > 255) {
    const ext = clean.split('.').pop() || '';
    clean = clean.slice(0, 250 - ext.length) + '.' + ext;
  }
  
  return clean;
};

/**
 * Valida e sanitiza URLs.
 * USO: Links externos, redirects.
 * 
 * @example
 * sanitizeURL('javascript:alert(1)') // Returns: null
 * sanitizeURL('https://example.com') // Returns: 'https://example.com'
 * 
 * @param url - URL a validar
 * @returns URL segura ou null se inválida
 */
export const sanitizeURL = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  const clean = url.trim();
  
  // Bloqueia protocolos perigosos
  if (/^(javascript|data|vbscript):/i.test(clean)) {
    return null;
  }
  
  // Aceita apenas http, https, mailto
  if (!/^(https?:\/\/|mailto:)/i.test(clean)) {
    return null;
  }
  
  try {
    new URL(clean);
    return clean;
  } catch {
    return null;
  }
};

/**
 * Escape adicional para prevenir SQL injection.
 * USO: Quando precisar construir queries dinâmicas (EVITE isso, use parameterized queries).
 * 
 * @param input - String para escapar
 * @returns String escapada
 */
export const escapeForSQL = (input: string | null | undefined): string => {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '');
};

/**
 * Valida e sanitiza endereços de email.
 * USO: Formulários de contato, cadastros.
 * 
 * @example
 * validateAndSanitizeEmail('user@example.com') // Returns: 'user@example.com'
 * validateAndSanitizeEmail('invalid<script>@test.com') // Returns: null
 * 
 * @param email - Email a validar
 * @returns Email sanitizado ou null se inválido
 */
export const validateAndSanitizeEmail = (email: string | null | undefined): string | null => {
  if (!email) return null;
  
  const clean = email.trim().toLowerCase();
  
  // Regex rigoroso para email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(clean)) {
    return null;
  }
  
  // Remove caracteres perigosos
  if (/<|>|"|'|`|\\/g.test(clean)) {
    return null;
  }
  
  if (clean.length > 255) {
    return null;
  }
  
  return clean;
};

/**
 * Detecta padrões de ataque XSS em strings.
 * USO: Validação de inputs em Zod schemas.
 * 
 * @param input - String a verificar
 * @returns true se contém padrões suspeitos
 */
export const containsXSSPatterns = (input: string | null | undefined): boolean => {
  if (!input) return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /onerror\s*=/i,
    /onload\s*=/i,
    /<svg.*onload/i,
    /data:text\/html/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * Detecta padrões de SQL injection em strings.
 * USO: Validação de inputs em Zod schemas.
 * 
 * @param input - String a verificar
 * @returns true se contém padrões suspeitos
 */
export const containsSQLInjectionPatterns = (input: string | null | undefined): boolean => {
  if (!input) return false;
  
  const sqlPatterns = [
    /(\bOR\b.*=.*|\bAND\b.*=.*)/i,
    /\bDROP\b\s+\bTABLE\b/i,
    /\bUNION\b\s+\bSELECT\b/i,
    /\bINSERT\b\s+\bINTO\b/i,
    /\bDELETE\b\s+\bFROM\b/i,
    /;.*--/,
    /\/\*.*\*\//,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * Limita comprimento de string de forma segura.
 * 
 * @param input - String de entrada
 * @param maxLength - Comprimento máximo
 * @returns String truncada
 */
export const truncateString = (input: string | null | undefined, maxLength: number): string => {
  if (!input) return '';
  if (input.length <= maxLength) return input;
  return input.slice(0, maxLength);
};

/**
 * Rate limiting simples em memória para Edge Functions.
 * NOTA: Esta é uma implementação básica. Para produção, considere usar Redis ou Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const requestCounts = new Map<string, RateLimitEntry>();

/**
 * Verifica se uma requisição excede o rate limit.
 * 
 * @param identifier - Identificador único (IP, user ID, etc)
 * @param maxRequests - Número máximo de requisições
 * @param windowMs - Janela de tempo em milissegundos
 * @returns true se permitido, false se bloqueado
 */
export const checkRateLimit = (
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const entry = requestCounts.get(identifier);
  
  // Nova entrada ou expirada
  if (!entry || now > entry.resetAt) {
    requestCounts.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  // Excedeu limite
  if (entry.count >= maxRequests) {
    return false;
  }
  
  // Incrementa contador
  entry.count++;
  return true;
};

/**
 * Extrai IP da requisição.
 */
export const getClientIP = (req: Request): string => {
  // Tenta vários headers
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
  ];
  
  for (const header of headers) {
    const value = req.headers.get(header);
    if (value) {
      // Pega o primeiro IP se houver múltiplos
      return value.split(',')[0].trim();
    }
  }
  
  return 'unknown';
};

/**
 * Limpa entradas antigas do mapa (executar periodicamente).
 */
export const cleanupRateLimitCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of requestCounts.entries()) {
    if (now > entry.resetAt) {
      requestCounts.delete(key);
    }
  }
};

// Limpa cache a cada 5 minutos
setInterval(cleanupRateLimitCache, 5 * 60 * 1000);

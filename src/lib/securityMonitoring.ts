import { supabase } from "@/integrations/supabase/client";

/**
 * Tipos de incidentes de segurança rastreados.
 */
export type SecurityIncidentType = 
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'suspicious_pattern';

/**
 * Registra tentativa de ataque ou comportamento suspeito.
 * 
 * @example
 * logSecurityIncident('xss_attempt', '<script>alert(1)</script>', '/api/products')
 */
export const logSecurityIncident = async (
  incidentType: SecurityIncidentType,
  payload: string,
  endpoint: string
): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Trunca payload para evitar logs enormes
    const truncatedPayload = payload.slice(0, 500);
    
    // @ts-ignore - security_incidents table exists but types not yet regenerated
    await supabase.from('security_incidents').insert({
      incident_type: incidentType,
      user_id: user?.id || null,
      user_agent: navigator.userAgent,
      payload: truncatedPayload,
      endpoint,
    });
    
    // Log no console em desenvolvimento
    if (import.meta.env.DEV) {
      console.warn('🔒 Security Incident:', {
        type: incidentType,
        payload: truncatedPayload,
        endpoint,
      });
    }
  } catch (error) {
    // Falha silenciosa para não quebrar UX
    if (import.meta.env.DEV) {
      console.error('Erro ao registrar incidente de segurança:', error);
    }
  }
};

/**
 * Verifica se um input contém padrões suspeitos e registra se necessário.
 * 
 * @returns true se seguro, false se suspeito
 */
export const validateAndLogInput = async (
  input: string,
  fieldName: string,
  endpoint: string
): Promise<boolean> => {
  // Padrões XSS
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /onerror\s*=/i,
  ];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      await logSecurityIncident('xss_attempt', input, endpoint);
      return false;
    }
  }
  
  // Padrões SQL Injection
  const sqlPatterns = [
    /(\bOR\b.*=.*|\bAND\b.*=.*)/i,
    /\bDROP\b\s+\bTABLE\b/i,
    /\bUNION\b\s+\bSELECT\b/i,
    /;.*--/,
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      await logSecurityIncident('sql_injection_attempt', input, endpoint);
      return false;
    }
  }
  
  return true;
};

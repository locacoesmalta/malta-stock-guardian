export const SECURITY_CONFIG = {
  // Tempo de inatividade antes do logout automático (20 minutos) - horário comercial
  IDLE_TIMEOUT_MS: 20 * 60 * 1000, // 1.200.000 ms
  
  // Tempo antes de mostrar aviso de inatividade (18 minutos - aviso 2 min antes)
  IDLE_WARNING_MS: 18 * 60 * 1000, // 1.080.000 ms
  
  // Timeout após horário comercial (45 minutos após 17:00)
  AFTER_HOURS_IDLE_TIMEOUT_MS: 45 * 60 * 1000, // 2.700.000 ms
  
  // Aviso 2 min antes do logout após horário comercial
  AFTER_HOURS_IDLE_WARNING_MS: 43 * 60 * 1000, // 2.580.000 ms
  
  // Horário de início do timeout estendido (17:00)
  AFTER_HOURS_START: 17,
  
  // Intervalo de verificação de versão (5 minutos)
  VERSION_CHECK_INTERVAL_MS: 5 * 60 * 1000, // 300.000 ms
  
  // Tempo de espera antes de forçar logout após detectar atualização (30 segundos)
  UPDATE_GRACE_PERIOD_MS: 30 * 1000, // 30.000 ms
};

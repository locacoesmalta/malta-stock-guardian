export const SECURITY_CONFIG = {
  // Tempo de inatividade antes do logout automático (20 minutos)
  IDLE_TIMEOUT_MS: 20 * 60 * 1000, // 1.200.000 ms
  
  // Tempo antes de mostrar aviso de inatividade (18 minutos - aviso 2 min antes)
  IDLE_WARNING_MS: 18 * 60 * 1000, // 1.080.000 ms
  
  // Intervalo de verificação de versão (5 minutos)
  VERSION_CHECK_INTERVAL_MS: 5 * 60 * 1000, // 300.000 ms
  
  // Tempo de espera antes de forçar logout após detectar atualização (30 segundos)
  UPDATE_GRACE_PERIOD_MS: 30 * 1000, // 30.000 ms
};

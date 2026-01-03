// Versão atual do aplicativo
// IMPORTANTE: Incrementar esta versão a cada deploy para forçar re-login dos usuários
// Exemplo: "1.0.0" -> "1.0.1" (patch), "1.1.0" (minor), "2.0.0" (major)
//
// CHANGELOG:
// 1.3.0 (03/01/2026) - Padronização PAT 6 dígitos e correções de timezone
//   - Todos os hooks de busca por PAT agora formatam internamente para 6 dígitos
//   - Corrigido useDuplicateValidation para usar formatPAT ao invés de normalizeText
//   - Corrigido useAssetUnifiedHistory, useAvailablePartsByPAT, usePatrimonioHistorico
//   - Corrigido usePricingCalculator para usar getTodayLocalDate()
//   - Corrigido calculateEquipmentAge para usar timezone Belém
//
// 1.2.0 (16/12/2024) - Correções críticas de timezone e sistema de medições
//   - Corrigidas funções de data para SEMPRE usar timezone Belém explícito
//   - safeParseDateString e safeDateToString agora usam formatInTimeZone/toZonedTime
//   - Corrigido cálculo de período de medição (eliminada dependência do browser timezone)
//   - Corrigidos dados no banco (rental_measurement_items.period_end)
//   - Atualizado Knowledge Base com regra definitiva de timezone
//
// 1.1.0 (21/11/2024) - Sistema de confiabilidade em deploys
//   - Desabilitadas migrações automáticas
//   - Criado botão manual de correção de dados no Admin
//   - Implementado checklist de deploy
//   - Melhorado sistema de logs e versionamento
export const APP_VERSION = "1.3.0";

export const getStoredVersion = (): string | null => {
  return localStorage.getItem('app_version');
};

export const setStoredVersion = (version: string): void => {
  localStorage.setItem('app_version', version);
};

export const isVersionOutdated = (): boolean => {
  const storedVersion = getStoredVersion();
  return storedVersion !== null && storedVersion !== APP_VERSION;
};

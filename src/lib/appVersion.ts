// Versão atual do aplicativo
// IMPORTANTE: Incrementar esta versão a cada deploy para forçar re-login dos usuários
// Exemplo: "1.0.0" -> "1.0.1" (patch), "1.1.0" (minor), "2.0.0" (major)
//
// CHANGELOG:
// 1.1.0 (21/11/2024) - Sistema de confiabilidade em deploys
//   - Desabilitadas migrações automáticas
//   - Criado botão manual de correção de dados no Admin
//   - Implementado checklist de deploy
//   - Melhorado sistema de logs e versionamento
export const APP_VERSION = "1.1.0";

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

// Versão atual do aplicativo
// IMPORTANTE: Incrementar esta versão a cada deploy para forçar re-login dos usuários
// Exemplo: "1.0.0" -> "1.0.1" (patch), "1.1.0" (minor), "2.0.0" (major)
export const APP_VERSION = "1.0.0";

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

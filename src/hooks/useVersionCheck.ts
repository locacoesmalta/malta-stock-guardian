import { useEffect, useState } from 'react';
import { APP_VERSION, isVersionOutdated } from '@/lib/appVersion';
import { SECURITY_CONFIG } from '@/config/security';

interface UseVersionCheckOptions {
  onUpdateDetected: () => void;
  isEnabled: boolean;
}

export const useVersionCheck = ({ onUpdateDetected, isEnabled }: UseVersionCheckOptions) => {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setUpdateAvailable(false);
      return;
    }

    // Verificar versão imediatamente
    const checkVersion = () => {
      if (isVersionOutdated()) {
        setUpdateAvailable(true);
        onUpdateDetected();
      }
    };

    // Verificar ao montar
    checkVersion();

    // Verificar periodicamente
    const interval = setInterval(() => {
      checkVersion();
    }, SECURITY_CONFIG.VERSION_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isEnabled, onUpdateDetected]);

  return {
    updateAvailable,
    currentVersion: APP_VERSION,
  };
};

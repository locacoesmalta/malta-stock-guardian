import { useEffect, useRef, useState, useCallback } from 'react';
import { SECURITY_CONFIG } from '@/config/security';

interface UseIdleTimeoutOptions {
  onIdle: () => void;
  onWarning: () => void;
  isEnabled: boolean;
}

export const useIdleTimeout = ({ onIdle, onWarning, isEnabled }: UseIdleTimeoutOptions) => {
  const [isWarningShown, setIsWarningShown] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimers = useCallback(() => {
    // Limpar timers existentes
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    // Fechar aviso se estiver aberto
    setIsWarningShown(false);

    if (!isEnabled) return;

    // Timer para mostrar aviso (2 minutos antes do logout)
    warningTimerRef.current = setTimeout(() => {
      setIsWarningShown(true);
      onWarning();
    }, SECURITY_CONFIG.IDLE_WARNING_MS);

    // Timer para fazer logout automático
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, SECURITY_CONFIG.IDLE_TIMEOUT_MS);
  }, [isEnabled, onIdle, onWarning]);

  useEffect(() => {
    if (!isEnabled) {
      setIsWarningShown(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      return;
    }

    // Eventos de atividade do usuário
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timers em qualquer atividade
    const handleActivity = () => {
      resetTimers();
    };

    // Adicionar listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Iniciar timers
    resetTimers();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [isEnabled, resetTimers]);

  return {
    isWarningShown,
    resetTimers,
  };
};

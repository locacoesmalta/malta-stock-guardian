import { useEffect, useRef, useState, useCallback } from 'react';
import { SECURITY_CONFIG } from '@/config/security';
import { getNowInBelem } from '@/lib/dateUtils';

interface UseIdleTimeoutOptions {
  onIdle: () => void;
  onWarning: () => void;
  isEnabled: boolean;
}

/**
 * Retorna os timeouts apropriados baseado na hora atual em Belém
 * Antes das 17h: timeout padrão de 20 minutos
 * Após 17h: timeout estendido de 45 minutos
 */
const getTimeouts = () => {
  const now = getNowInBelem();
  const currentHour = now.getHours();
  
  if (currentHour >= SECURITY_CONFIG.AFTER_HOURS_START) {
    return {
      warningTimeout: SECURITY_CONFIG.AFTER_HOURS_IDLE_WARNING_MS,
      idleTimeout: SECURITY_CONFIG.AFTER_HOURS_IDLE_TIMEOUT_MS,
      isAfterHours: true,
    };
  }
  
  return {
    warningTimeout: SECURITY_CONFIG.IDLE_WARNING_MS,
    idleTimeout: SECURITY_CONFIG.IDLE_TIMEOUT_MS,
    isAfterHours: false,
  };
};

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

    // Obter timeouts baseado na hora atual
    const { warningTimeout, idleTimeout } = getTimeouts();

    // Timer para mostrar aviso (2 minutos antes do logout)
    warningTimerRef.current = setTimeout(() => {
      setIsWarningShown(true);
      onWarning();
    }, warningTimeout);

    // Timer para fazer logout automático
    idleTimerRef.current = setTimeout(() => {
      onIdle();
    }, idleTimeout);
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

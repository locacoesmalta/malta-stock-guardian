import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UseSessionHealthOptions {
  session: Session | null;
  user: User | null;
  isEnabled: boolean;
}

export const useSessionHealth = ({ session, user, isEnabled }: UseSessionHealthOptions) => {
  const [isHealthy, setIsHealthy] = useState(true);
  const failureCountRef = useRef(0);
  const MAX_FAILURES = 3;
  
  useEffect(() => {
    if (!isEnabled || !user) {
      setIsHealthy(true);
      failureCountRef.current = 0;
      return;
    }
    
    const checkHealth = async () => {
      try {
        // Testar se consegue fazer query simples
        const { error } = await supabase
          .from('user_permissions')
          .select('is_active')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          failureCountRef.current++;
          console.warn('[SESSION HEALTH] Query falhou:', error, `(${failureCountRef.current}/${MAX_FAILURES})`);
          
          // Se falhar 3x consecutivas, sessão está corrompida
          if (failureCountRef.current >= MAX_FAILURES) {
            setIsHealthy(false);
            console.error('[SESSION HEALTH] Sessão corrompida detectada! Forçando logout...');
          }
        } else {
          // Query bem sucedida - resetar contador
          if (failureCountRef.current > 0) {
            console.log('[SESSION HEALTH] Sessão recuperada');
          }
          failureCountRef.current = 0;
          setIsHealthy(true);
        }
      } catch (error) {
        failureCountRef.current++;
        console.error('[SESSION HEALTH] Erro crítico:', error, `(${failureCountRef.current}/${MAX_FAILURES})`);
        
        if (failureCountRef.current >= MAX_FAILURES) {
          setIsHealthy(false);
        }
      }
    };
    
    // Verificar imediatamente
    checkHealth();
    
    // Verificar a cada 2 minutos
    const interval = setInterval(checkHealth, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [isEnabled, user, session]);
  
  return { isHealthy, failureCount: failureCountRef.current };
};

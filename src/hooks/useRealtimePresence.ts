import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';

interface UseRealtimePresenceOptions {
  user: User | null;
  isEnabled: boolean;
}

export const useRealtimePresence = ({ user, isEnabled }: UseRealtimePresenceOptions) => {
  const location = useLocation();
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const presenceIdRef = useRef<string | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Atualizar presença no banco de dados
  const updatePresence = async () => {
    if (!user || !isEnabled) return;

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      const presenceData = {
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || '',
        is_online: true,
        last_activity: new Date().toISOString(),
        session_id: sessionIdRef.current,
        current_route: location.pathname,
        browser_info: browserInfo,
      };

      if (!presenceIdRef.current) {
        // Primeira inserção
        const { data, error } = await supabase
          .from('user_presence')
          .insert(presenceData)
          .select('id')
          .single();

        if (error) throw error;
        presenceIdRef.current = data?.id || null;
      } else {
        // Atualização
        const { error } = await supabase
          .from('user_presence')
          .update(presenceData)
          .eq('id', presenceIdRef.current);

        if (error) throw error;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[PRESENCE] Error updating presence:', error);
      }
    }
  };

  // Marcar como offline ao sair
  const markOffline = async () => {
    if (!presenceIdRef.current) return;

    try {
      await supabase
        .from('user_presence')
        .update({ is_online: false })
        .eq('id', presenceIdRef.current);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[PRESENCE] Error marking offline:', error);
      }
    }
  };

  useEffect(() => {
    if (!isEnabled || !user) {
      // Limpar tudo se não estiver habilitado
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (presenceIdRef.current) {
        markOffline();
        presenceIdRef.current = null;
      }
      return;
    }

    // Atualizar presença imediatamente
    updatePresence();

    // Atualizar a cada 30 segundos
    updateIntervalRef.current = setInterval(() => {
      updatePresence();
    }, 30000);

    // Marcar offline ao fechar aba/navegador
    const handleBeforeUnload = () => {
      markOffline();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      markOffline();
    };
  }, [user, isEnabled]);

  // Atualizar rota atual quando mudar
  useEffect(() => {
    if (isEnabled && presenceIdRef.current) {
      updatePresence();
    }
  }, [location.pathname]);

  return {
    sessionId: sessionIdRef.current,
  };
};

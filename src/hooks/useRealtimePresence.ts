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
    // Validar que user e auth.uid() existem antes de tentar
    if (!user || !user.id || !isEnabled) {
      if (import.meta.env.DEV) {
        console.warn('⚠️ [PRESENCE] updatePresence: user, user.id ou isEnabled não disponível');
      }
      return;
    }

    try {
      const browserInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      };

      const presenceData = {
        user_id: user.id,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email || 'Usuário',
        is_online: true,
        last_activity: new Date().toISOString(),
        session_id: sessionIdRef.current,
        current_route: location.pathname,
        browser_info: browserInfo,
      };

      if (import.meta.env.DEV) {
        console.log('🔄 [PRESENCE] Atualizando presença:', {
          user_id: presenceData.user_id,
          session_id: presenceData.session_id,
          route: presenceData.current_route,
        });
      }

      // Usar upsert com constraint UNIQUE (user_id, session_id)
      const { data, error } = await supabase
        .from('user_presence')
        .upsert(presenceData, {
          onConflict: 'user_id,session_id',
          ignoreDuplicates: false,
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ [PRESENCE] Erro ao atualizar presença:', error);
        
        // Estratégia de fallback: buscar e atualizar manualmente
        const { data: existing } = await supabase
          .from('user_presence')
          .select('id')
          .eq('user_id', user.id)
          .eq('session_id', sessionIdRef.current)
          .maybeSingle();

        if (existing?.id) {
          // Atualizar registro existente
          presenceIdRef.current = existing.id;
          const { error: updateError } = await supabase
            .from('user_presence')
            .update(presenceData)
            .eq('id', existing.id);

          if (updateError) {
            console.error('❌ [PRESENCE] Erro no fallback UPDATE:', updateError);
          } else if (import.meta.env.DEV) {
            console.log('✅ [PRESENCE] Presença atualizada via fallback UPDATE');
          }
        } else {
          // Tentar inserir novamente
          const { data: inserted, error: insertError } = await supabase
            .from('user_presence')
            .insert(presenceData)
            .select('id')
            .single();

          if (insertError) {
            console.error('❌ [PRESENCE] Erro no fallback INSERT:', insertError);
          } else if (inserted?.id) {
            presenceIdRef.current = inserted.id;
            if (import.meta.env.DEV) {
              console.log('✅ [PRESENCE] Presença inserida via fallback INSERT');
            }
          }
        }
      } else if (data?.id) {
        presenceIdRef.current = data.id;
        if (import.meta.env.DEV) {
          console.log('✅ [PRESENCE] Presença atualizada com sucesso');
        }
      }
    } catch (error) {
      console.error('💥 [PRESENCE] Erro crítico em updatePresence:', error);
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

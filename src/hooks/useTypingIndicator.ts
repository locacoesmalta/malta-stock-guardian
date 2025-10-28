import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface TypingUser {
  user_id: string;
  user_name: string;
  conversation_id: string | null;
}

export const useTypingIndicator = (conversationId: string | null) => {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(async () => {
    if (!user || !channel) return;

    // Buscar nome do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    await channel.track({
      user_id: user.id,
      user_name: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
      conversation_id: conversationId,
      is_typing: true,
    });

    // Auto-stop após 3 segundos
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000);
  }, [user, channel, conversationId]);

  const stopTyping = useCallback(async () => {
    if (!user || !channel) return;

    await channel.untrack();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [user, channel]);

  useEffect(() => {
    if (!user) return;

    const channelName = conversationId 
      ? `typing-${conversationId}` 
      : 'typing-global';

    const typingChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    typingChannel
      .on('presence', { event: 'sync' }, () => {
        const state = typingChannel.presenceState();
        const typing: TypingUser[] = [];
        
        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id && presence.is_typing) {
              typing.push({
                user_id: presence.user_id,
                user_name: presence.user_name,
                conversation_id: presence.conversation_id,
              });
            }
          });
        });
        
        setTypingUsers(typing);
      })
      .subscribe();

    setChannel(typingChannel);

    return () => {
      stopTyping();
      typingChannel.unsubscribe();
    };
  }, [user, conversationId]);

  return { typingUsers, startTyping, stopTyping };
};

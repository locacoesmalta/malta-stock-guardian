import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface OnlineUser {
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'online' | 'away';
  last_seen: string;
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const trackPresence = useCallback(async () => {
    if (!user) return;

    const presenceChannel = supabase.channel('user-presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              users.push({
                user_id: presence.user_id,
                user_name: presence.user_name,
                user_email: presence.user_email,
                status: presence.status || 'online',
                last_seen: presence.last_seen || new Date().toISOString(),
              });
            }
          });
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Buscar nome do usuário do profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user.id)
            .single();

          await presenceChannel.track({
            user_id: user.id,
            user_name: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
            user_email: user.email || '',
            status: 'online',
            last_seen: new Date().toISOString(),
          });
        }
      });

    setChannel(presenceChannel);
  }, [user]);

  useEffect(() => {
    trackPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [trackPresence]);

  return { onlineUsers };
};

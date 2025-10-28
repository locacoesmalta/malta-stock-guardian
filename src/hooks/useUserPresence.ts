import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

export interface OnlineUser {
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'online' | 'offline';
  last_seen: string;
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [allUsers, setAllUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Buscar todos os usuários ativos do sistema
  const fetchAllUsers = useCallback(async () => {
    if (!user) return;

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .neq('id', user.id);

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    if (profiles) {
      const users: OnlineUser[] = profiles.map(profile => ({
        user_id: profile.id,
        user_name: profile.full_name || profile.email || 'Usuário',
        user_email: profile.email || '',
        status: 'offline',
        last_seen: new Date().toISOString(),
      }));
      setAllUsers(users);
    }
  }, [user]);

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
        const onlineUserIds = new Set<string>();
        
        Object.keys(state).forEach((presenceKey) => {
          const presences = state[presenceKey];
          presences.forEach((presence: any) => {
            if (presence.user_id !== user.id) {
              onlineUserIds.add(presence.user_id);
            }
          });
        });
        
        // Atualizar status de todos os usuários baseado na presença
        setAllUsers(prevUsers => 
          prevUsers.map(u => ({
            ...u,
            status: onlineUserIds.has(u.user_id) ? 'online' : 'offline'
          }))
        );
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
    fetchAllUsers();
    trackPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [trackPresence, fetchAllUsers]);

  return { onlineUsers: allUsers };
};

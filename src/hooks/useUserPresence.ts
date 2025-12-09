import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";
import { getISOStringInBelem } from "@/lib/dateUtils";

export interface OnlineUser {
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'online' | 'offline';
  last_seen: string;
  is_active: boolean;
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [allUsers, setAllUsers] = useState<OnlineUser[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Buscar todos os usuários ativos do sistema
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!user) return;

      const { data: activeUsers } = await supabase
        .from('user_permissions')
        .select('user_id, profiles(full_name, email)')
        .eq('is_active', true);

      if (activeUsers) {
        const users: OnlineUser[] = activeUsers
          .filter(u => u.user_id !== user.id && u.profiles)
          .map(u => ({
            user_id: u.user_id,
            user_name: (u.profiles as any)?.full_name || (u.profiles as any)?.email?.split('@')[0] || 'Usuário',
            user_email: (u.profiles as any)?.email || '',
            status: 'offline' as const,
            last_seen: getISOStringInBelem(),
            is_active: true,
          }));
        
        setAllUsers(users);
      }
    };

    fetchAllUsers();
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

        // Atualizar status dos usuários - marcar online os que estão presentes
        setOnlineUsers(prevUsers => 
          allUsers.map(u => ({
            ...u,
            status: onlineUserIds.has(u.user_id) ? 'online' as const : 'offline' as const,
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
            last_seen: getISOStringInBelem(),
          });
        }
      });

    setChannel(presenceChannel);
  }, [user, allUsers]);

  useEffect(() => {
    trackPresence();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [trackPresence]);

  // Atualizar onlineUsers quando allUsers mudar
  useEffect(() => {
    if (allUsers.length > 0 && onlineUsers.length === 0) {
      setOnlineUsers(allUsers);
    }
  }, [allUsers, onlineUsers.length]);

  return { onlineUsers };
};

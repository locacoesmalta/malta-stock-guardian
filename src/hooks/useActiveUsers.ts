import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActiveUser {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  is_online: boolean;
  last_activity: string;
  session_id: string;
  current_route: string | null;
  browser_info: any;
  created_at: string;
  updated_at: string;
}

export const useActiveUsers = () => {
  const { isAdmin, isSuperuser } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveUsers = async () => {
    if (!isAdmin && !isSuperuser) {
      setActiveUsers([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('user_presence')
        .select('*')
        .order('last_activity', { ascending: false });

      if (fetchError) throw fetchError;

      setActiveUsers(data || []);
      setError(null);
    } catch (err: any) {
      console.error('[ACTIVE_USERS] Error fetching:', err);
      setError(err.message || 'Erro ao buscar usuários ativos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();

    // Recarregar a cada 10 segundos
    const interval = setInterval(() => {
      fetchActiveUsers();
    }, 10000);

    // Realtime subscription para updates instantâneos
    const channel = supabase
      .channel('user_presence_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
        },
        () => {
          fetchActiveUsers();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [isAdmin, isSuperuser]);

  return {
    activeUsers,
    loading,
    error,
    refetch: fetchActiveUsers,
  };
};

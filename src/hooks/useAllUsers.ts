import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  is_active: boolean;
}

export const useAllUsers = () => {
  const { user } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      if (!user) return [];

      // Buscar todos os perfis
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email');

      if (profilesError) throw profilesError;

      // Buscar permissões para verificar quem está ativo no sistema
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('user_id, is_active');

      if (permissionsError) throw permissionsError;

      // Mapear usuários com status ativo (permissão para usar o sistema)
      const usersWithStatus = profiles
        .filter(profile => profile.id !== user.id) // Excluir usuário atual
        .map(profile => {
          const permission = permissions.find(p => p.user_id === profile.id);
          return {
            id: profile.id,
            full_name: profile.full_name,
            email: profile.email,
            is_active: permission?.is_active ?? false,
          };
        })
        .filter(u => u.is_active); // Mostrar apenas usuários com permissão ativa

      return usersWithStatus as User[];
    },
    enabled: !!user,
  });

  return { users, isLoading };
};

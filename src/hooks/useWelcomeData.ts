import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface WelcomeNews {
  lowStockCount: number;
  overdueMaintenanceCount: number;
  pendingReportsCount: number;
  hasNews: boolean;
}

export interface WelcomeData {
  userName: string;
  userEmail: string;
  lastLoginAt: string | null;
  lastLoginFormatted: string | null;
  loginCount: number;
  greeting: string;
  isFirstLogin: boolean;
  news: WelcomeNews;
}

export const useWelcomeData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['welcome-data', user?.id],
    queryFn: async (): Promise<WelcomeData> => {
      if (!user) throw new Error("User not authenticated");

      // Buscar dados do perfil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, last_login_at, login_count')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Buscar novidades via função do banco
      const { data: newsData, error: newsError } = await supabase
        .rpc('get_user_welcome_data', { p_user_id: user.id });

      if (newsError) throw newsError;

      // Type assertion para o retorno da função RPC
      const newsResponse = newsData as unknown as {
        low_stock_count: number;
        overdue_maintenance_count: number;
        pending_reports_count: number;
        has_news: boolean;
      };

      // Determinar saudação baseada no horário
      const hour = new Date().getHours();
      let greeting = "Bom dia";
      if (hour >= 12 && hour < 18) greeting = "Boa tarde";
      else if (hour >= 18) greeting = "Boa noite";

      // Formatar último acesso
      let lastLoginFormatted = null;
      if (profile.last_login_at) {
        const lastLogin = new Date(profile.last_login_at);
        lastLoginFormatted = format(lastLogin, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      }

      const welcomeData: WelcomeData = {
        userName: profile.full_name || profile.email?.split('@')[0] || 'Usuário',
        userEmail: profile.email || '',
        lastLoginAt: profile.last_login_at,
        lastLoginFormatted,
        loginCount: profile.login_count || 0,
        greeting,
        isFirstLogin: !profile.last_login_at || profile.login_count <= 1,
        news: {
          lowStockCount: newsResponse.low_stock_count || 0,
          overdueMaintenanceCount: newsResponse.overdue_maintenance_count || 0,
          pendingReportsCount: newsResponse.pending_reports_count || 0,
          hasNews: newsResponse.has_news || false,
        }
      };

      return welcomeData;
    },
    enabled: !!user,
    staleTime: 0, // Sempre buscar dados frescos
  });
};

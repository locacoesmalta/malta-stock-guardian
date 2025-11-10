import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WelcomeData {
  userName: string;
  userEmail: string;
  lastLoginAt: string | null;
  loginCount: number;
  greeting: string;
  news: {
    lowStockCount: number;
    overdueMaintenanceCount: number;
    pendingReportsCount: number;
    hasNews: boolean;
  };
}

export const useWelcomeData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['welcome-data', user?.id],
    queryFn: async () => {
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
      const news = newsData as unknown as {
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

      const welcomeData: WelcomeData = {
        userName: profile.full_name || profile.email?.split('@')[0] || 'Usuário',
        userEmail: profile.email,
        lastLoginAt: profile.last_login_at,
        loginCount: profile.login_count || 0,
        greeting,
        news: {
          lowStockCount: news.low_stock_count || 0,
          overdueMaintenanceCount: news.overdue_maintenance_count || 0,
          pendingReportsCount: news.pending_reports_count || 0,
          hasNews: news.has_news || false,
        }
      };

      return welcomeData;
    },
    enabled: !!user,
    staleTime: 0,
  });
};

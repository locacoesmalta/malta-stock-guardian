import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface UserActivityDetail {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface UseUserActivityDetailsOptions {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

/**
 * Hook para buscar detalhes das atividades de um usuário específico
 */
export const useUserActivityDetails = (options: UseUserActivityDetailsOptions) => {
  const { userId, startDate, endDate, enabled = true } = options;

  return useQuery({
    queryKey: ["user_activity_details", userId, startDate, endDate],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      // Construir query base - apenas atividades de usuário real
      let query = supabase
        .from("audit_logs")
        .select("*")
        .eq("user_id", userId)
        .neq("action", "AUTO_NORMALIZATION")
        .neq("table_name", "system");

      // Aplicar filtros de data
      if (startDate) {
        const startStr = format(startDate, "yyyy-MM-dd 00:00:00");
        query = query.gte("created_at", startStr);
      }

      if (endDate) {
        const endStr = format(endDate, "yyyy-MM-dd 23:59:59");
        query = query.lte("created_at", endStr);
      }

      // Ordenar por data decrescente (mais recente primeiro)
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user activity details:", error);
        throw error;
      }

      return (data || []) as UserActivityDetail[];
    },
    enabled,
  });
};

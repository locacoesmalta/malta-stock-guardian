import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface UserActivitySummary {
  user_id: string;
  user_email: string;
  user_name: string | null;
  total_actions: number;
  days_active: number;
  last_activity: string;
  actions_breakdown: {
    INSERT: number;
    UPDATE: number;
    DELETE: number;
  };
}

interface UseUserActivitiesOptions {
  startDate?: Date;
  endDate?: Date;
}

/**
 * Hook para buscar resumo de atividades agrupadas por usuário
 */
export const useUserActivities = (options: UseUserActivitiesOptions = {}) => {
  const { startDate, endDate } = options;

  return useQuery({
    queryKey: ["user_activities", startDate, endDate],
    queryFn: async () => {
      // Construir query base
      let query = supabase
        .from("audit_logs")
        .select("user_id, user_email, user_name, action, created_at");

      // Aplicar filtros de data
      if (startDate) {
        const startStr = format(startDate, "yyyy-MM-dd 00:00:00");
        query = query.gte("created_at", startStr);
      }

      if (endDate) {
        const endStr = format(endDate, "yyyy-MM-dd 23:59:59");
        query = query.lte("created_at", endStr);
      }

      // Ordenar por data decrescente
      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user activities:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Agrupar por usuário
      const userMap = new Map<string, UserActivitySummary>();

      data.forEach((log) => {
        const userId = log.user_id || "unknown";
        
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            user_id: userId,
            user_email: log.user_email,
            user_name: log.user_name,
            total_actions: 0,
            days_active: 0,
            last_activity: log.created_at,
            actions_breakdown: {
              INSERT: 0,
              UPDATE: 0,
              DELETE: 0,
            },
          });
        }

        const summary = userMap.get(userId)!;
        summary.total_actions++;

        // Contar por tipo de ação
        if (log.action === "INSERT") {
          summary.actions_breakdown.INSERT++;
        } else if (log.action === "UPDATE") {
          summary.actions_breakdown.UPDATE++;
        } else if (log.action === "DELETE") {
          summary.actions_breakdown.DELETE++;
        }

        // Atualizar última atividade
        if (log.created_at > summary.last_activity) {
          summary.last_activity = log.created_at;
        }
      });

      // Calcular dias ativos para cada usuário
      for (const [userId, summary] of userMap.entries()) {
        const userLogs = data.filter((log) => (log.user_id || "unknown") === userId);
        const uniqueDays = new Set(
          userLogs.map((log) => format(new Date(log.created_at), "yyyy-MM-dd"))
        );
        summary.days_active = uniqueDays.size;
      }

      // Converter para array e ordenar por total de ações (decrescente)
      const result = Array.from(userMap.values()).sort(
        (a, b) => b.total_actions - a.total_actions
      );

      return result;
    },
  });
};

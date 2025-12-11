import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export interface UserActivitySummary {
  user_id: string;
  user_email: string;
  user_name: string | null;
  total_actions: number;
  days_active: number;
  first_activity: string;
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
  actionTypes?: ('INSERT' | 'UPDATE' | 'DELETE')[];
}

/**
 * Hook para buscar resumo de atividades agrupadas por usuário
 */
export const useUserActivities = (options: UseUserActivitiesOptions = {}) => {
  const { startDate, endDate, actionTypes } = options;
  const queryClient = useQueryClient();

  // Setup realtime subscription for audit_logs
  useEffect(() => {
    const channel = supabase
      .channel('audit_logs_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs'
        },
        (payload) => {
          console.log('🔴 Nova atividade detectada em tempo real:', payload);
          
          // Invalidar cache para forçar refetch
          queryClient.invalidateQueries({ queryKey: ["user_activities"] });
          
          // Mostrar notificação
          toast({
            title: "🔴 Nova atividade detectada",
            description: "Os dados foram atualizados automaticamente",
            duration: 3000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [startDate, endDate, queryClient]);

  return useQuery({
    queryKey: ["user_activities", startDate, endDate, actionTypes],
    queryFn: async () => {
      // Construir query base - apenas usuários reais (não sistema)
      // Incluir LOGIN/LOGOUT para rastreamento de jornada
      let query = supabase
        .from("audit_logs")
        .select("user_id, user_email, user_name, action, created_at")
        .not("user_id", "is", null)
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

      // Aplicar filtro de tipos de ação (incluindo LOGIN/LOGOUT se não houver filtro)
      if (actionTypes && actionTypes.length > 0) {
        // Sempre incluir LOGIN/LOGOUT para o cálculo de início de jornada
        const actionsWithSession = [...actionTypes, 'LOGIN', 'LOGOUT'];
        query = query.in("action", actionsWithSession);
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
            first_activity: log.created_at,
            last_activity: log.created_at,
            actions_breakdown: {
              INSERT: 0,
              UPDATE: 0,
              DELETE: 0,
            },
          });
        }

        const summary = userMap.get(userId)!;

        // LOGIN/LOGOUT não contam como ações, apenas marcam início/fim de jornada
        if (log.action === 'LOGIN') {
          // LOGIN marca o início da jornada (primeira atividade)
          if (log.created_at < summary.first_activity) {
            summary.first_activity = log.created_at;
          }
          return; // Não incrementar contador de ações
        }
        
        if (log.action === 'LOGOUT') {
          // LOGOUT não altera contagem, apenas registra fim de sessão
          return;
        }

        // Contar apenas ações reais (não LOGIN/LOGOUT)
        summary.total_actions++;

        // Contar por tipo de ação
        if (log.action === "INSERT") {
          summary.actions_breakdown.INSERT++;
        } else if (log.action === "UPDATE") {
          summary.actions_breakdown.UPDATE++;
        } else if (log.action === "DELETE") {
          summary.actions_breakdown.DELETE++;
        }

        // Atualizar última atividade (apenas ações reais)
        if (log.created_at > summary.last_activity) {
          summary.last_activity = log.created_at;
        }
      });

      // Calcular dias ativos para cada usuário
      for (const [userId, summary] of userMap.entries()) {
        const userLogs = data.filter((log) => (log.user_id || "unknown") === userId);
        const uniqueDays = new Set(
          userLogs.map((log) => {
            try {
              const date = new Date(log.created_at);
              if (isNaN(date.getTime())) return 'invalid-date';
              return format(date, "yyyy-MM-dd");
            } catch {
              return 'invalid-date';
            }
          })
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductIntegrityIssue {
  product_id: string;
  product_code: string;
  product_name: string;
  current_quantity: number;
  has_adjustment_history: boolean;
  issue_type: string;
}

interface SessionIntegrityIssue {
  session_id: string;
  user_email: string;
  user_name: string;
  last_activity: string;
  is_online: boolean;
  session_count: number;
  issue_type: string;
}

interface AuditLogIntegrityIssue {
  log_id: string;
  user_email: string;
  action: string;
  table_name: string;
  created_at: string;
  issue_type: string;
}

export const useSystemIntegrity = () => {
  // Verificar integridade de produtos
  const productsIntegrity = useQuery({
    queryKey: ["integrity-products"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_products_integrity");
      if (error) throw error;
      return (data || []) as ProductIntegrityIssue[];
    },
  });

  // Verificar integridade de sessões
  const sessionsIntegrity = useQuery({
    queryKey: ["integrity-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_sessions_integrity");
      if (error) throw error;
      return (data || []) as SessionIntegrityIssue[];
    },
  });

  // Verificar integridade de audit logs
  const auditLogsIntegrity = useQuery({
    queryKey: ["integrity-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_audit_logs_integrity");
      if (error) throw error;
      return (data || []) as AuditLogIntegrityIssue[];
    },
  });

  // Função para corrigir sessões órfãs (marcar como offline)
  const fixStaleSessions = async () => {
    const staleDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from("user_presence")
      .update({ is_online: false })
      .eq("is_online", true)
      .lt("last_activity", staleDate);

    if (error) throw error;
    
    // Refetch após correção
    await sessionsIntegrity.refetch();
  };

  // Função para limpar sessões duplicadas (manter apenas a mais recente)
  const fixDuplicateSessions = async () => {
    // Buscar usuários com múltiplas sessões
    const { data: duplicates } = await supabase
      .from("user_presence")
      .select("user_id")
      .eq("is_online", true);

    if (!duplicates) return;

    // Agrupar por user_id
    const userIds = [...new Set(duplicates.map(d => d.user_id))];

    for (const userId of userIds) {
      // Buscar todas as sessões do usuário
      const { data: sessions } = await supabase
        .from("user_presence")
        .select("*")
        .eq("user_id", userId)
        .eq("is_online", true)
        .order("last_activity", { ascending: false });

      if (!sessions || sessions.length <= 1) continue;

      // Manter apenas a mais recente, desativar as outras
      const [_keep, ...toDisable] = sessions;
      const idsToDisable = toDisable.map(s => s.id);

      await supabase
        .from("user_presence")
        .update({ is_online: false })
        .in("id", idsToDisable);
    }

    await sessionsIntegrity.refetch();
  };

  const refetchAll = async () => {
    await Promise.all([
      productsIntegrity.refetch(),
      sessionsIntegrity.refetch(),
      auditLogsIntegrity.refetch(),
    ]);
  };

  return {
    productsIntegrity: {
      data: productsIntegrity.data || [],
      isLoading: productsIntegrity.isLoading,
      error: productsIntegrity.error,
      count: productsIntegrity.data?.length || 0,
    },
    sessionsIntegrity: {
      data: sessionsIntegrity.data || [],
      isLoading: sessionsIntegrity.isLoading,
      error: sessionsIntegrity.error,
      count: sessionsIntegrity.data?.length || 0,
    },
    auditLogsIntegrity: {
      data: auditLogsIntegrity.data || [],
      isLoading: auditLogsIntegrity.isLoading,
      error: auditLogsIntegrity.error,
      count: auditLogsIntegrity.data?.length || 0,
    },
    fixStaleSessions,
    fixDuplicateSessions,
    refetchAll,
    isLoading:
      productsIntegrity.isLoading ||
      sessionsIntegrity.isLoading ||
      auditLogsIntegrity.isLoading,
  };
};

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

interface AssetIntegrityIssue {
  asset_id: string;
  asset_code: string;
  equipment_name: string;
  location_type: string;
  issue_type: string;
  details: string;
}

interface WithdrawalIntegrityIssue {
  withdrawal_id: string;
  product_code: string;
  product_name: string;
  equipment_code: string;
  quantity: number;
  withdrawal_date: string;
  issue_type: string;
  details: string;
}

interface ReportIntegrityIssue {
  report_id: string;
  report_date: string;
  equipment_code: string;
  work_site: string;
  company: string;
  issue_type: string;
  details: string;
}

interface ProductStockIntegrityIssue {
  product_id: string;
  product_code: string;
  product_name: string;
  current_quantity: number;
  min_quantity: number;
  issue_type: string;
  details: string;
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

  // Verificar integridade de assets
  const assetsIntegrity = useQuery({
    queryKey: ["integrity-assets"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_assets_integrity");
      if (error) throw error;
      return (data || []) as AssetIntegrityIssue[];
    },
  });

  // Verificar integridade de retiradas
  const withdrawalsIntegrity = useQuery({
    queryKey: ["integrity-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_withdrawals_integrity");
      if (error) throw error;
      return (data || []) as WithdrawalIntegrityIssue[];
    },
  });

  // Verificar integridade de relatórios
  const reportsIntegrity = useQuery({
    queryKey: ["integrity-reports"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_reports_integrity");
      if (error) throw error;
      return (data || []) as ReportIntegrityIssue[];
    },
  });

  // Verificar integridade de estoque de produtos
  const productsStockIntegrity = useQuery({
    queryKey: ["integrity-products-stock"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("check_products_stock_integrity");
      if (error) throw error;
      return (data || []) as ProductStockIntegrityIssue[];
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
      assetsIntegrity.refetch(),
      withdrawalsIntegrity.refetch(),
      reportsIntegrity.refetch(),
      productsStockIntegrity.refetch(),
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
    assetsIntegrity: {
      data: assetsIntegrity.data || [],
      isLoading: assetsIntegrity.isLoading,
      error: assetsIntegrity.error,
      count: assetsIntegrity.data?.length || 0,
    },
    withdrawalsIntegrity: {
      data: withdrawalsIntegrity.data || [],
      isLoading: withdrawalsIntegrity.isLoading,
      error: withdrawalsIntegrity.error,
      count: withdrawalsIntegrity.data?.length || 0,
    },
    reportsIntegrity: {
      data: reportsIntegrity.data || [],
      isLoading: reportsIntegrity.isLoading,
      error: reportsIntegrity.error,
      count: reportsIntegrity.data?.length || 0,
    },
    productsStockIntegrity: {
      data: productsStockIntegrity.data || [],
      isLoading: productsStockIntegrity.isLoading,
      error: productsStockIntegrity.error,
      count: productsStockIntegrity.data?.length || 0,
    },
    fixStaleSessions,
    fixDuplicateSessions,
    refetchAll,
    isLoading:
      productsIntegrity.isLoading ||
      sessionsIntegrity.isLoading ||
      auditLogsIntegrity.isLoading ||
      assetsIntegrity.isLoading ||
      withdrawalsIntegrity.isLoading ||
      reportsIntegrity.isLoading ||
      productsStockIntegrity.isLoading,
  };
};

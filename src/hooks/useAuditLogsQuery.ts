import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UseAuditLogsQueryOptions {
  page?: number;
  pageSize?: number;
  userId?: string;
  action?: string;
  tableName?: string;
  startDate?: string;
  endDate?: string;
}

const fetchAuditLogs = async (options: UseAuditLogsQueryOptions = {}): Promise<{ data: AuditLog[], count: number }> => {
  const { 
    page = 0, 
    pageSize = 50,
    userId,
    action,
    tableName,
    startDate,
    endDate
  } = options;
  
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("audit_logs")
    .select("*", { count: 'exact' })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Aplicar filtros
  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (action) {
    query = query.eq("action", action);
  }

  if (tableName) {
    query = query.eq("table_name", tableName);
  }

  if (startDate) {
    query = query.gte("created_at", startDate);
  }

  if (endDate) {
    query = query.lte("created_at", endDate);
  }

  const { data, error, count } = await query.returns<AuditLog[]>();

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const useAuditLogsQuery = (options?: UseAuditLogsQueryOptions) => {
  return useQuery({
    queryKey: ["audit_logs", options],
    queryFn: () => fetchAuditLogs(options),
  });
};

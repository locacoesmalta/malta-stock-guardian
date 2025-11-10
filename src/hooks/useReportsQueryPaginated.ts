import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Report {
  id: string;
  report_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  work_site: string;
  company: string;
  technician_name: string;
  service_comments: string;
  equipment_code: string;
  equipment_name: string | null;
  considerations: string | null;
  observations: string | null;
  receiver: string | null;
  responsible: string | null;
}

interface UseReportsQueryOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  startDate?: string;
  endDate?: string;
}

const fetchReports = async ({ 
  page = 0, 
  pageSize = 50,
  searchTerm = "",
  startDate,
  endDate
}: UseReportsQueryOptions = {}): Promise<{ data: Report[], count: number }> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("reports")
    .select("*", { count: 'exact' })
    .is("deleted_at", null)
    .order("report_date", { ascending: false });

  // Filtro de busca
  if (searchTerm) {
    query = query.or(`equipment_code.ilike.%${searchTerm}%,technician_name.ilike.%${searchTerm}%,work_site.ilike.%${searchTerm}%`);
  }

  // Filtro por data
  if (startDate) {
    query = query.gte("report_date", startDate);
  }
  if (endDate) {
    query = query.lte("report_date", endDate);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const useReportsQueryPaginated = (options?: UseReportsQueryOptions) => {
  return useQuery({
    queryKey: ["reports-paginated", options?.page, options?.pageSize, options?.searchTerm, options?.startDate, options?.endDate],
    queryFn: () => fetchReports(options),
  });
};

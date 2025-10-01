import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_roles: Array<{ role: string }>;
  user_permissions: {
    is_active: boolean;
    can_access_main_menu: boolean;
    can_access_admin: boolean;
    can_view_products: boolean;
    can_create_reports: boolean;
    can_view_reports: boolean;
    can_create_withdrawals: boolean;
    can_view_withdrawal_history: boolean;
    can_edit_products: boolean;
    can_delete_products: boolean;
    can_edit_reports: boolean;
    can_delete_reports: boolean;
    can_access_assets: boolean;
    can_create_assets: boolean;
    can_edit_assets: boolean;
    can_delete_assets: boolean;
    can_scan_assets: boolean;
  } | null;
}

interface UseUsersQueryOptions {
  page?: number;
  pageSize?: number;
}

const fetchUsers = async ({ page = 0, pageSize = 20 }: UseUsersQueryOptions = {}): Promise<{ data: User[], count: number }> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from("profiles")
    .select(`
      *,
      user_roles(role),
      user_permissions!inner(
        is_active, 
        can_access_main_menu, 
        can_access_admin, 
        can_view_products, 
        can_create_reports, 
        can_view_reports,
        can_create_withdrawals,
        can_view_withdrawal_history,
        can_edit_products,
        can_delete_products,
        can_edit_reports,
        can_delete_reports,
        can_access_assets,
        can_create_assets,
        can_edit_assets,
        can_delete_assets,
        can_scan_assets
      )
    `, { count: 'exact' })
    .order("created_at")
    .range(from, to)
    .returns<User[]>();

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const useUsersQuery = (options?: UseUsersQueryOptions) => {
  return useQuery({
    queryKey: ["users", options?.page, options?.pageSize],
    queryFn: () => fetchUsers(options),
  });
};

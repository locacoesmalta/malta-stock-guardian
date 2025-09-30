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
      user_permissions!inner(is_active, can_access_main_menu, can_access_admin, can_view_products, can_create_reports, can_view_reports)
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

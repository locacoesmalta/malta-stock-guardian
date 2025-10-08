import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Withdrawal {
  id: string;
  product_id: string;
  quantity: number;
  withdrawal_date: string;
  withdrawal_reason: string | null;
  withdrawn_by: string;
  created_at: string;
  equipment_code: string;
  work_site: string;
  company: string;
  products: {
    code: string;
    name: string;
    purchase_price: number | null;
    sale_price: number | null;
  };
  profiles: {
    full_name: string | null;
    email: string;
  };
}

const fetchWithdrawals = async (): Promise<Withdrawal[]> => {
  // First fetch all withdrawals with products (including prices)
  const { data: withdrawalsData, error: withdrawalsError } = await supabase
    .from("material_withdrawals")
    .select(`
      *,
      products(code, name, purchase_price, sale_price)
    `)
    .order("withdrawal_date", { ascending: false });

  if (withdrawalsError) throw withdrawalsError;

  // Get unique user IDs
  const userIds = [...new Set((withdrawalsData || []).map(w => w.withdrawn_by))];

  // Fetch all profiles in one query
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  // Create a map for quick lookup
  const profilesMap = new Map(
    (profilesData || []).map(profile => [profile.id, profile])
  );

  // Combine data
  const withdrawalsWithProfiles = (withdrawalsData || []).map(withdrawal => ({
    ...withdrawal,
    profiles: profilesMap.get(withdrawal.withdrawn_by) || { 
      full_name: null, 
      email: "Desconhecido" 
    },
  }));

  return withdrawalsWithProfiles;
};

export const useWithdrawalsQuery = () => {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: fetchWithdrawals,
  });
};

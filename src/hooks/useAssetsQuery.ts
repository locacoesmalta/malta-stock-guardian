import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  location_type: string;
  rental_company?: string;
  rental_work_site?: string;
  rental_start_date?: string;
  rental_end_date?: string;
  deposito_description?: string;
  available_for_rental?: boolean;
  maintenance_company?: string;
  maintenance_work_site?: string;
  maintenance_description?: string;
  is_new_equipment?: boolean;
  equipment_observations?: string;
  created_at: string;
}

const fetchAssets = async (): Promise<Asset[]> => {
  const { data, error } = await supabase
    .from("assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const useAssetsQuery = () => {
  return useQuery({
    queryKey: ["assets"],
    queryFn: fetchAssets,
  });
};

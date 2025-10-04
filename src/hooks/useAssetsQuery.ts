import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  voltage_combustion?: string;
  supplier?: string;
  purchase_date?: string;
  unit_value?: number;
  equipment_condition?: string;
  manual_attachment?: string;
  exploded_drawing_attachment?: string;
  comments?: string;
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
  maintenance_arrival_date?: string;
  maintenance_departure_date?: string;
  maintenance_delay_observations?: string;
  returns_to_work_site?: boolean;
  was_replaced?: boolean;
  replaced_by_asset_id?: string;
  replacement_reason?: string;
  is_new_equipment?: boolean;
  destination_after_maintenance?: string;
  equipment_observations?: string;
  malta_collaborator?: string;
  inspection_start_date?: string;
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

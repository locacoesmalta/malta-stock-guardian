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
  maintenance_status?: string;
}

interface UseAssetsQueryOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  locationType?: string;
}

const fetchAssets = async ({ 
  page = 0, 
  pageSize = 50,
  searchTerm = "",
  locationType
}: UseAssetsQueryOptions = {}): Promise<{ data: Asset[], count: number }> => {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("assets")
    .select("*", { count: 'exact' })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Filtro de busca
  if (searchTerm) {
    query = query.or(`asset_code.ilike.%${searchTerm}%,equipment_name.ilike.%${searchTerm}%`);
  }

  // Filtro por tipo de localização
  if (locationType) {
    query = query.eq("location_type", locationType);
  }

  const { data, error, count } = await query.range(from, to);

  if (error) throw error;
  return { data: data || [], count: count || 0 };
};

export const useAssetsQueryPaginated = (options?: UseAssetsQueryOptions) => {
  return useQuery({
    queryKey: ["assets-paginated", options?.page, options?.pageSize, options?.searchTerm, options?.locationType],
    queryFn: () => fetchAssets(options),
  });
};

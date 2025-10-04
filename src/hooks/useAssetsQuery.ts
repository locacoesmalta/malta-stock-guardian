import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  voltage_combustion?: string | null;
  supplier?: string | null;
  purchase_date?: string | null;
  unit_value?: number | null;
  equipment_condition?: string | null;
  manual_attachment?: string | null;
  exploded_drawing_attachment?: string | null;
  comments?: string | null;
  location_type: string;
  rental_company?: string | null;
  rental_work_site?: string | null;
  rental_start_date?: string | null;
  rental_end_date?: string | null;
  deposito_description?: string | null;
  available_for_rental?: boolean | null;
  maintenance_company?: string | null;
  maintenance_work_site?: string | null;
  maintenance_description?: string | null;
  maintenance_arrival_date?: string | null;
  maintenance_departure_date?: string | null;
  maintenance_delay_observations?: string | null;
  returns_to_work_site?: boolean | null;
  was_replaced?: boolean | null;
  replaced_by_asset_id?: string | null;
  replacement_reason?: string | null;
  is_new_equipment?: boolean | null;
  destination_after_maintenance?: string | null;
  equipment_observations?: string | null;
  malta_collaborator?: string | null;
  inspection_start_date?: string | null;
  created_at: string;
}

interface PaginatedAssetsResponse {
  data: Asset[];
  count: number;
  hasMore: boolean;
}

interface AssetsQueryOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

const fetchAssets = async (options: AssetsQueryOptions = {}): Promise<PaginatedAssetsResponse> => {
  const { page = 1, pageSize = 50, searchTerm } = options;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("assets")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  // Add search functionality if searchTerm is provided
  if (searchTerm) {
    query = query.or(`asset_code.ilike.%${searchTerm}%,equipment_name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    count: count || 0,
    hasMore: (count || 0) > to + 1,
  };
};

// Hook for paginated assets
export const useAssetsQuery = (options: AssetsQueryOptions = {}) => {
  return useQuery({
    queryKey: ["assets", options],
    queryFn: () => fetchAssets(options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for all assets (backward compatibility)
export const useAllAssetsQuery = () => {
  const fetchAllAssets = async (): Promise<Asset[]> => {
    const { data, error } = await supabase
      .from("assets")
      .select(`
        id,
        asset_code,
        equipment_name,
        manufacturer,
        model,
        serial_number,
        voltage_combustion,
        supplier,
        purchase_date,
        unit_value,
        equipment_condition,
        manual_attachment,
        exploded_drawing_attachment,
        comments,
        location_type,
        rental_company,
        rental_work_site,
        rental_start_date,
        rental_end_date,
        deposito_description,
        available_for_rental,
        maintenance_company,
        maintenance_work_site,
        maintenance_description,
        maintenance_arrival_date,
        maintenance_departure_date,
        maintenance_delay_observations,
        returns_to_work_site,
        was_replaced,
        replaced_by_asset_id,
        replacement_reason,
        is_new_equipment,
        destination_after_maintenance,
        equipment_observations,
        malta_collaborator,
        inspection_start_date,
        created_at
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  };

  return useQuery({
    queryKey: ["assets", "all"],
    queryFn: fetchAllAssets,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

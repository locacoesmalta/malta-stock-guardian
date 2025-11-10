import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AssetMissingData {
  id: string;
  asset_code: string;
  equipment_name: string;
  location_type: string;
  created_at: string;
}

/**
 * Hook para buscar equipamentos sem fabricante cadastrado
 */
export const useAssetsMissingData = () => {
  return useQuery({
    queryKey: ["assets-missing-manufacturer"],
    queryFn: async (): Promise<AssetMissingData[]> => {
      const { data, error } = await supabase.rpc("get_assets_missing_manufacturer");
      
      if (error) {
        console.error("Error fetching assets missing data:", error);
        throw error;
      }
      
      return (data || []) as AssetMissingData[];
    },
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });
};

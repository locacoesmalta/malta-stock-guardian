import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";

interface EquipmentInfo {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer: string;
  model: string | null;
  location_type: string;
  rental_company: string | null;
  rental_work_site: string | null;
  deposito_description: string | null;
  maintenance_company: string | null;
  maintenance_work_site: string | null;
  equipment_observations: string | null;
}

/**
 * Hook para buscar informações completas do equipamento pelo PAT
 */
export const useEquipmentByPAT = (pat: string) => {
  return useQuery({
    queryKey: ["equipment-by-pat", pat],
    queryFn: async (): Promise<EquipmentInfo | null> => {
      if (!pat) {
        return null;
      }

      const formattedPAT = formatPAT(pat);
      if (!formattedPAT) {
        return null;
      }

      const { data, error } = await supabase
        .from("assets")
        .select(`
          id,
          asset_code,
          equipment_name,
          manufacturer,
          model,
          location_type,
          rental_company,
          rental_work_site,
          deposito_description,
          maintenance_company,
          maintenance_work_site,
          equipment_observations
        `)
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (error) {
        console.error("Error fetching equipment:", error);
        return null;
      }

      return data;
    },
    enabled: !!pat && pat.replace(/\D/g, '').length > 0,
    staleTime: 0,
  });
};

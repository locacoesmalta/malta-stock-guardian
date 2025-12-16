import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SuggestedEquipment {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer: string;
  rental_work_site: string | null;
  rental_company: string | null;
}

export function useEquipmentsByCompany(companyName: string | undefined) {
  return useQuery({
    queryKey: ["equipments-by-company", companyName],
    queryFn: async () => {
      if (!companyName) return [];

      // Extrair primeiro nome da empresa para busca mais flexível
      const firstName = companyName.split(" ")[0].toUpperCase();

      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code, equipment_name, manufacturer, rental_work_site, rental_company")
        .eq("location_type", "locacao")
        .is("deleted_at", null)
        .or(`rental_company.ilike.%${firstName}%,rental_company.ilike.%${companyName}%`)
        .order("asset_code", { ascending: true });

      if (error) throw error;
      return (data || []) as SuggestedEquipment[];
    },
    enabled: !!companyName && companyName.length > 2,
  });
}

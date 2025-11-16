import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SmartAutofillData {
  last_company: string | null;
  last_work_site: string | null;
  last_technician: string | null;
  top_products: Array<{
    product_id: string;
    product_name: string;
    product_code: string;
    usage_count: number;
  }>;
  pending_parts_count: number;
}

/**
 * Hook para auto-preenchimento inteligente baseado no histórico do PAT
 * Retorna último contexto usado: empresa, obra, técnico e peças mais usadas
 */
export const useSmartAutofill = (equipmentCode: string | null) => {
  return useQuery({
    queryKey: ["smart-autofill", equipmentCode],
    queryFn: async (): Promise<SmartAutofillData | null> => {
      if (!equipmentCode || equipmentCode.length === 0) {
        return null;
      }

      const { data, error } = await supabase.rpc("get_asset_last_context", {
        p_equipment_code: equipmentCode,
      });

      if (error) {
        console.error("Erro ao buscar contexto do PAT:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      
      // Parse top_products do JSONB
      let topProducts = [];
      if (result.top_products) {
        try {
          topProducts = typeof result.top_products === 'string' 
            ? JSON.parse(result.top_products) 
            : result.top_products;
        } catch (e) {
          console.error("Erro ao parsear top_products:", e);
          topProducts = [];
        }
      }
      
      return {
        last_company: result.last_company,
        last_work_site: result.last_work_site,
        last_technician: result.last_technician,
        top_products: Array.isArray(topProducts) ? topProducts : [],
        pending_parts_count: result.pending_parts_count || 0,
      };
    },
    enabled: !!equipmentCode && equipmentCode.length > 0,
    staleTime: 30000, // Cache por 30 segundos
  });
};

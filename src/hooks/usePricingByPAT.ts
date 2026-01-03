import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";
import type { 
  PricingAssetCosts, 
  PricingTaxConfig, 
  MaintenanceEntryExtended,
  MaintenancePartDetail 
} from "@/types/pricing";

interface AssetForPricing {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer: string;
  model: string | null;
  serial_number: string | null;
  location_type: string;
  rental_company: string | null;
  rental_work_site: string | null;
  unit_value: number | null;
  purchase_date: string | null;
}

/**
 * Hook para buscar equipamento pelo PAT para módulo de precificação
 * Aceita "1258" ou "001258" e retorna o mesmo equipamento
 */
export const usePATSearch = (pat: string) => {
  return useQuery({
    queryKey: ["pricing-asset-by-pat", pat],
    queryFn: async (): Promise<AssetForPricing | null> => {
      if (!pat) return null;

      const formattedPAT = formatPAT(pat);
      if (!formattedPAT) return null;

      const { data, error } = await supabase
        .from("assets")
        .select(`
          id,
          asset_code,
          equipment_name,
          manufacturer,
          model,
          serial_number,
          location_type,
          rental_company,
          rental_work_site,
          unit_value,
          purchase_date
        `)
        .eq("asset_code", formattedPAT)
        .is("deleted_at", null)
        .maybeSingle();

      if (error) {
        console.error("Error fetching asset for pricing:", error);
        return null;
      }

      return data;
    },
    enabled: !!pat && pat.replace(/\D/g, '').length >= 1,
    staleTime: 0,
  });
};

/**
 * Hook para buscar custos operacionais por PAT
 * Retorna null se o equipamento não tiver custos cadastrados
 */
export const useAssetCostsByPAT = (pat: string) => {
  return useQuery({
    queryKey: ["pricing-asset-costs", pat],
    queryFn: async (): Promise<PricingAssetCosts | null> => {
      if (!pat) return null;

      const formattedPAT = formatPAT(pat);
      if (!formattedPAT) return null;

      const { data, error } = await supabase
        .from("pricing_asset_costs")
        .select("*")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      // PGRST116 = not found, which is ok
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching asset costs:", error);
        return null;
      }

      return data as PricingAssetCosts | null;
    },
    enabled: !!pat && pat.replace(/\D/g, '').length >= 1,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};

/**
 * Hook para buscar histórico de manutenções por PAT
 * Inclui detalhes das peças usadas em cada manutenção
 */
export const useMaintenanceHistoryByPAT = (pat: string) => {
  return useQuery({
    queryKey: ["pricing-maintenance-history", pat],
    queryFn: async (): Promise<(MaintenanceEntryExtended & { parts: MaintenancePartDetail[] })[]> => {
      if (!pat) return [];

      const formattedPAT = formatPAT(pat);
      if (!formattedPAT) return [];

      // Primeiro busca o asset_id pelo PAT
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_code", formattedPAT)
        .is("deleted_at", null)
        .maybeSingle();

      if (assetError || !asset) {
        return [];
      }

      // Busca manutenções pelo asset_id
      const { data: maintenances, error: maintenanceError } = await supabase
        .from("asset_maintenances")
        .select(`
          id,
          asset_id,
          maintenance_date,
          maintenance_type,
          services_performed,
          problem_description,
          is_recurring_problem,
          recurrence_count,
          is_client_misuse,
          parts_cost,
          labor_cost,
          total_cost,
          observations,
          registered_by,
          created_at,
          asset_maintenance_parts (
            id,
            maintenance_id,
            product_id,
            quantity,
            unit_cost,
            total_cost,
            created_at
          )
        `)
        .eq("asset_id", asset.id)
        .order("maintenance_date", { ascending: false });

      if (maintenanceError) {
        console.error("Error fetching maintenance history:", maintenanceError);
        return [];
      }

      // Mapeia para o formato esperado
      return (maintenances || []).map(m => ({
        id: m.id,
        asset_id: m.asset_id,
        asset_code: formattedPAT,
        maintenance_date: m.maintenance_date,
        maintenance_type: m.maintenance_type as 'preventiva' | 'corretiva',
        services_performed: m.services_performed,
        problem_description: m.problem_description || undefined,
        is_recurring_problem: m.is_recurring_problem || false,
        recurrence_count: m.recurrence_count || 0,
        is_client_misuse: m.is_client_misuse || false,
        parts_cost: Number(m.parts_cost) || 0,
        labor_cost: Number(m.labor_cost) || 0,
        total_cost: Number(m.total_cost) || 0,
        observations: m.observations || undefined,
        registered_by: m.registered_by,
        created_at: m.created_at,
        parts: (m.asset_maintenance_parts || []).map(p => ({
          id: p.id,
          maintenance_id: p.maintenance_id,
          product_id: p.product_id,
          quantity: p.quantity,
          unit_cost: Number(p.unit_cost),
          total_cost: Number(p.total_cost) || 0,
          created_at: p.created_at,
        })),
      }));
    },
    enabled: !!pat && pat.replace(/\D/g, '').length >= 1,
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
};

/**
 * Hook para buscar configurações fiscais ativas
 */
export const useTaxConfig = () => {
  return useQuery({
    queryKey: ["pricing-tax-config"],
    queryFn: async (): Promise<PricingTaxConfig[]> => {
      const { data, error } = await supabase
        .from("pricing_tax_config")
        .select("*")
        .eq("is_active", true)
        .order("location_type");

      if (error) {
        console.error("Error fetching tax config:", error);
        return [];
      }

      return (data || []) as PricingTaxConfig[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache - tax config rarely changes
  });
};

/**
 * Hook para buscar configuração fiscal por tipo de localização
 */
export const useTaxConfigByLocation = (locationType: string) => {
  return useQuery({
    queryKey: ["pricing-tax-config", locationType],
    queryFn: async (): Promise<PricingTaxConfig | null> => {
      if (!locationType) return null;

      const { data, error } = await supabase
        .from("pricing_tax_config")
        .select("*")
        .eq("location_type", locationType)
        .eq("is_active", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching tax config by location:", error);
        return null;
      }

      return data as PricingTaxConfig | null;
    },
    enabled: !!locationType,
    staleTime: 1000 * 60 * 5,
  });
};

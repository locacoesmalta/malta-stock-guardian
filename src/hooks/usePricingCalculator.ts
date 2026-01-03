/**
 * Hook de Cálculo Inteligente de Precificação
 * 
 * Integra com o sistema de locação para calcular preços baseados em:
 * - Depreciação do equipamento
 * - Custos de manutenção
 * - Custos de transporte
 * - Custos operacionais
 * - Custos de funcionário (opcional)
 * - Impostos por localização
 * - Margem de lucro
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPAT } from "@/lib/patUtils";
import { toast } from "@/hooks/use-toast";
import type { 
  PricingCalculationInput, 
  PricingCalculationResultExtended,
  PricingAssetCosts,
  PricingTaxConfig 
} from "@/types/pricing";

// ============================================
// HOOK PRINCIPAL DE CÁLCULO
// ============================================

export const usePricingCalculator = () => {
  const queryClient = useQueryClient();

  const calculatePricing = useMutation({
    mutationFn: async (input: PricingCalculationInput): Promise<PricingCalculationResultExtended> => {
      const normalizedPAT = formatPAT(input.asset_code);
      
      if (!normalizedPAT) {
        throw new Error("PAT inválido");
      }

      // 1. Buscar dados do equipamento
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .select("id, asset_code, equipment_name, manufacturer, unit_value")
        .eq("asset_code", normalizedPAT)
        .is("deleted_at", null)
        .maybeSingle();

      if (assetError) throw assetError;
      if (!asset) throw new Error("Equipamento não encontrado");

      // 2. Buscar custos operacionais do equipamento
      const { data: assetCosts, error: costsError } = await supabase
        .from("pricing_asset_costs")
        .select("*")
        .eq("asset_code", normalizedPAT)
        .maybeSingle();

      if (costsError && costsError.code !== 'PGRST116') throw costsError;
      if (!assetCosts) throw new Error("Custos do equipamento não cadastrados. Cadastre os custos operacionais primeiro.");

      // 3. Buscar configuração fiscal pela localização
      const { data: taxConfig, error: taxError } = await supabase
        .from("pricing_tax_config")
        .select("*")
        .eq("location_type", input.location_type)
        .eq("is_active", true)
        .maybeSingle();

      if (taxError) throw taxError;
      if (!taxConfig) throw new Error(`Configuração fiscal não encontrada para: ${input.location_type}`);

      // Cast para tipos corretos
      const costs = assetCosts as PricingAssetCosts;
      const taxes = taxConfig as PricingTaxConfig;

      // 4. Calcular depreciação
      const assetValue = asset.unit_value || 0;
      const depreciationMonthly = costs.depreciation_months > 0 
        ? assetValue / costs.depreciation_months 
        : 0;
      const depreciationDaily = depreciationMonthly / 30;
      const depreciation_cost = depreciationDaily * input.rental_days;

      // 5. Calcular custo de manutenção
      const maintenanceDaily = costs.monthly_maintenance_cost / 30;
      const maintenance_cost = maintenanceDaily * input.rental_days;

      // 6. Calcular transporte (ida e volta)
      const transport_cost = input.distance_km * costs.transport_cost_per_km * 2;

      // 7. Calcular custo de funcionário (opcional)
      const employee_cost = input.include_employee 
        ? (input.employee_cost || costs.employee_cost_per_day) * input.rental_days
        : 0;

      // 8. Calcular custo operacional (estimativa de 8h/dia)
      const operational_hours = input.rental_days * 8;
      const operational_cost = operational_hours * costs.operational_cost_per_hour;

      // 9. Subtotal de custos
      const subtotal_costs = 
        depreciation_cost + 
        maintenance_cost + 
        transport_cost + 
        employee_cost + 
        operational_cost;

      // 10. Calcular impostos sobre o subtotal
      const tax_iss = subtotal_costs * (taxes.iss_rate / 100);
      const tax_pis = subtotal_costs * (taxes.pis_rate / 100);
      const tax_cofins = subtotal_costs * (taxes.cofins_rate / 100);
      const tax_csll = subtotal_costs * (taxes.csll_rate / 100);
      const tax_irpj = subtotal_costs * (taxes.irpj_rate / 100);
      const tax_total = tax_iss + tax_pis + tax_cofins + tax_csll + tax_irpj;

      // 11. Custo total
      const total_cost = subtotal_costs + tax_total;

      // 12. Aplicar margem de lucro
      const profit_margin_percentage = input.custom_profit_margin ?? costs.profit_margin_percentage;
      const profit_amount = total_cost * (profit_margin_percentage / 100);
      const suggested_price = total_cost + profit_amount;

      return {
        asset_code: normalizedPAT,
        equipment_name: asset.equipment_name,
        depreciation_cost,
        maintenance_cost,
        transport_cost,
        employee_cost,
        operational_cost,
        subtotal_costs,
        tax_iss,
        tax_pis,
        tax_cofins,
        tax_csll,
        tax_irpj,
        tax_total,
        total_cost,
        profit_margin_percentage,
        profit_amount,
        suggested_price,
        breakdown: {
          depreciation_daily: depreciationDaily,
          maintenance_daily: maintenanceDaily,
          transport_total: transport_cost,
          operational_hours_estimated: operational_hours,
        }
      };
    },
    onSuccess: () => {
      toast({
        title: "Cálculo realizado com sucesso!",
        description: "Preço sugerido calculado com base em todos os custos.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cálculo",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Salvar cálculo no histórico
  const saveCalculation = useMutation({
    mutationFn: async (params: {
      calculation: PricingCalculationResultExtended;
      input: PricingCalculationInput;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("pricing_calculations")
        .insert({
          asset_code: params.calculation.asset_code,
          calculation_date: new Date().toISOString().split('T')[0],
          location_type: params.input.location_type,
          distance_km: params.input.distance_km,
          rental_days: params.input.rental_days,
          profit_margin: params.calculation.profit_margin_percentage,
          employee_cost: params.calculation.employee_cost,
          depreciation_cost: params.calculation.depreciation_cost,
          maintenance_cost: params.calculation.maintenance_cost,
          transport_cost: params.calculation.transport_cost,
          tax_total: params.calculation.tax_total,
          total_cost: params.calculation.total_cost,
          suggested_price: params.calculation.suggested_price,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-calculations"] });
      toast({
        title: "Cálculo salvo!",
        description: "O cálculo foi salvo no histórico.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return {
    calculatePricing,
    saveCalculation,
  };
};

// ============================================
// HOOK PARA HISTÓRICO DE CÁLCULOS
// ============================================

export const usePricingHistory = (asset_code?: string) => {
  return useQuery({
    queryKey: ["pricing-calculations", asset_code],
    queryFn: async () => {
      let query = supabase
        .from("pricing_calculations")
        .select("*")
        .order("calculation_date", { ascending: false });

      if (asset_code) {
        const normalizedPAT = formatPAT(asset_code);
        if (normalizedPAT) {
          query = query.eq("asset_code", normalizedPAT);
        }
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data;
    },
  });
};

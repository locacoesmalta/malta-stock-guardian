import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface EquipmentConsumption {
  manufacturer: string;
  equipment_name: string;
  model: string | null;
  asset_code: string;
  parts: PartConsumption[];
  total_quantity: number;
  total_cost: number;
}

export interface PartConsumption {
  product_id: string;
  product_code: string;
  product_name: string;
  total_quantity: number;
  total_cost: number;
  withdrawal_count: number;
  monthly_average: number;
  months_active: number;
}

interface Withdrawal {
  id: string;
  product_id: string;
  quantity: number;
  withdrawal_date: string;
  equipment_code: string;
  company: string;
  products: {
    code: string;
    name: string;
    purchase_price: number | null;
  };
}

interface Asset {
  asset_code: string;
  manufacturer: string;
  equipment_name: string;
  model: string | null;
}

interface UsePartsConsumptionReportParams {
  startDate?: Date;
  endDate?: Date;
  brandFilter?: string;
  typeFilter?: string;
}

export const usePartsConsumptionReport = ({
  startDate,
  endDate,
  brandFilter,
  typeFilter,
}: UsePartsConsumptionReportParams = {}) => {
  return useQuery({
    queryKey: ["parts-consumption-report", startDate, endDate, brandFilter, typeFilter],
    queryFn: async () => {
      // 1. Buscar todas as retiradas (exceto vendas)
      let withdrawalsQuery = supabase
        .from("material_withdrawals")
        .select(`
          id,
          product_id,
          quantity,
          withdrawal_date,
          equipment_code,
          company,
          products(code, name, purchase_price)
        `)
        .neq("equipment_code", "VENDA")
        .order("withdrawal_date", { ascending: false });

      if (startDate) {
        withdrawalsQuery = withdrawalsQuery.gte("withdrawal_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        withdrawalsQuery = withdrawalsQuery.lte("withdrawal_date", format(endDate, "yyyy-MM-dd"));
      }

      const { data: withdrawalsData, error: withdrawalsError } = await withdrawalsQuery;
      if (withdrawalsError) throw withdrawalsError;

      const withdrawals = withdrawalsData as unknown as Withdrawal[];

      // 2. Buscar informações dos equipamentos
      const equipmentCodes = [...new Set(withdrawals.map(w => w.equipment_code))];
      
      let assetsQuery = supabase
        .from("assets")
        .select("asset_code, manufacturer, equipment_name, model")
        .in("asset_code", equipmentCodes);

      if (brandFilter) {
        assetsQuery = assetsQuery.ilike("manufacturer", `%${brandFilter}%`);
      }
      if (typeFilter) {
        assetsQuery = assetsQuery.ilike("equipment_name", `%${typeFilter}%`);
      }

      const { data: assetsData, error: assetsError } = await assetsQuery;
      if (assetsError) throw assetsError;

      const assets = assetsData as Asset[];
      const assetsMap = new Map(assets.map(a => [a.asset_code, a]));

      // 3. Agrupar consumo por equipamento e produto
      const equipmentMap = new Map<string, {
        asset: Asset;
        partsMap: Map<string, {
          product_id: string;
          product_code: string;
          product_name: string;
          total_quantity: number;
          total_cost: number;
          withdrawal_count: number;
          months: Set<string>;
        }>;
      }>();

      withdrawals.forEach(withdrawal => {
        const asset = assetsMap.get(withdrawal.equipment_code);
        if (!asset) return; // Ignora se não encontrou o ativo (pode ter sido filtrado)

        if (!equipmentMap.has(asset.asset_code)) {
          equipmentMap.set(asset.asset_code, {
            asset,
            partsMap: new Map(),
          });
        }

        const equipment = equipmentMap.get(asset.asset_code)!;
        const productKey = withdrawal.product_id;

        if (!equipment.partsMap.has(productKey)) {
          equipment.partsMap.set(productKey, {
            product_id: withdrawal.product_id,
            product_code: withdrawal.products.code,
            product_name: withdrawal.products.name,
            total_quantity: 0,
            total_cost: 0,
            withdrawal_count: 0,
            months: new Set(),
          });
        }

        const part = equipment.partsMap.get(productKey)!;
        const cost = withdrawal.quantity * (withdrawal.products.purchase_price || 0);
        const monthKey = format(new Date(withdrawal.withdrawal_date), "yyyy-MM");

        part.total_quantity += withdrawal.quantity;
        part.total_cost += cost;
        part.withdrawal_count += 1;
        part.months.add(monthKey);
      });

      // 4. Converter para formato final
      const equipmentConsumption: EquipmentConsumption[] = Array.from(equipmentMap.values()).map(({ asset, partsMap }) => {
        const parts: PartConsumption[] = Array.from(partsMap.values()).map(part => ({
          product_id: part.product_id,
          product_code: part.product_code,
          product_name: part.product_name,
          total_quantity: part.total_quantity,
          total_cost: part.total_cost,
          withdrawal_count: part.withdrawal_count,
          months_active: part.months.size,
          monthly_average: part.months.size > 0 ? part.total_quantity / part.months.size : 0,
        }));

        // Ordenar peças por quantidade decrescente
        parts.sort((a, b) => b.total_quantity - a.total_quantity);

        return {
          manufacturer: asset.manufacturer,
          equipment_name: asset.equipment_name,
          model: asset.model,
          asset_code: asset.asset_code,
          parts,
          total_quantity: parts.reduce((sum, p) => sum + p.total_quantity, 0),
          total_cost: parts.reduce((sum, p) => sum + p.total_cost, 0),
        };
      });

      // Ordenar equipamentos por custo total decrescente
      equipmentConsumption.sort((a, b) => b.total_cost - a.total_cost);

      // 5. Calcular resumo geral
      const summary = {
        total_equipments: equipmentConsumption.length,
        total_unique_parts: new Set(
          equipmentConsumption.flatMap(eq => eq.parts.map(p => p.product_id))
        ).size,
        total_quantity: equipmentConsumption.reduce((sum, eq) => sum + eq.total_quantity, 0),
        total_cost: equipmentConsumption.reduce((sum, eq) => sum + eq.total_cost, 0),
      };

      // 6. Top 10 peças mais consumidas (geral)
      const allParts = new Map<string, {
        product_id: string;
        product_code: string;
        product_name: string;
        total_quantity: number;
        total_cost: number;
      }>();

      equipmentConsumption.forEach(eq => {
        eq.parts.forEach(part => {
          if (!allParts.has(part.product_id)) {
            allParts.set(part.product_id, {
              product_id: part.product_id,
              product_code: part.product_code,
              product_name: part.product_name,
              total_quantity: 0,
              total_cost: 0,
            });
          }
          const aggregated = allParts.get(part.product_id)!;
          aggregated.total_quantity += part.total_quantity;
          aggregated.total_cost += part.total_cost;
        });
      });

      const topParts = Array.from(allParts.values())
        .sort((a, b) => b.total_quantity - a.total_quantity)
        .slice(0, 10);

      // 7. Consumo mensal (últimos meses)
      const monthlyConsumption = new Map<string, number>();
      
      withdrawals.forEach(withdrawal => {
        const monthKey = format(new Date(withdrawal.withdrawal_date), "yyyy-MM");
        const cost = withdrawal.quantity * (withdrawal.products.purchase_price || 0);
        monthlyConsumption.set(monthKey, (monthlyConsumption.get(monthKey) || 0) + cost);
      });

      const monthlyData = Array.from(monthlyConsumption.entries())
        .map(([month, cost]) => ({ month, cost }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return {
        equipments: equipmentConsumption,
        summary,
        topParts,
        monthlyData,
      };
    },
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MaintenanceWithdrawal {
  equipment_code: string;
  equipment_name: string;
  total_cost: number;
  withdrawal_count: number;
  withdrawals: {
    id: string;
    withdrawal_date: string;
    product_name: string;
    product_code: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
    withdrawal_reason: string | null;
  }[];
}

const fetchMaintenanceWithdrawals = async (
  equipmentFilter?: string,
  startDate?: string,
  endDate?: string
): Promise<MaintenanceWithdrawal[]> => {
  let query = supabase
    .from("material_withdrawals")
    .select(`
      id,
      equipment_code,
      quantity,
      withdrawal_date,
      withdrawal_reason,
      products(code, name, purchase_price)
    `)
    .eq("company", "Manutenção Interna")
    .order("withdrawal_date", { ascending: false });

  if (equipmentFilter) {
    query = query.eq("equipment_code", equipmentFilter);
  }

  if (startDate) {
    query = query.gte("withdrawal_date", startDate);
  }

  if (endDate) {
    query = query.lte("withdrawal_date", endDate);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Buscar nomes dos equipamentos
  const equipmentCodes = [...new Set((data || []).map(w => w.equipment_code))];
  
  const { data: equipmentData, error: equipmentError } = await supabase
    .from("assets")
    .select("asset_code, equipment_name")
    .in("asset_code", equipmentCodes);

  if (equipmentError) throw equipmentError;

  const equipmentMap = new Map(
    (equipmentData || []).map(eq => [eq.asset_code, eq.equipment_name])
  );

  // Agrupar por equipamento
  const grouped = new Map<string, MaintenanceWithdrawal>();

  (data || []).forEach((withdrawal: any) => {
    const equipmentCode = withdrawal.equipment_code;
    const unitCost = withdrawal.products?.purchase_price || 0;
    const totalCost = unitCost * withdrawal.quantity;

    if (!grouped.has(equipmentCode)) {
      grouped.set(equipmentCode, {
        equipment_code: equipmentCode,
        equipment_name: equipmentMap.get(equipmentCode) || "Equipamento não encontrado",
        total_cost: 0,
        withdrawal_count: 0,
        withdrawals: [],
      });
    }

    const group = grouped.get(equipmentCode)!;
    group.total_cost += totalCost;
    group.withdrawal_count += 1;
    group.withdrawals.push({
      id: withdrawal.id,
      withdrawal_date: withdrawal.withdrawal_date,
      product_name: withdrawal.products?.name || "Desconhecido",
      product_code: withdrawal.products?.code || "-",
      quantity: withdrawal.quantity,
      unit_cost: unitCost,
      total_cost: totalCost,
      withdrawal_reason: withdrawal.withdrawal_reason,
    });
  });

  return Array.from(grouped.values()).sort((a, b) => b.total_cost - a.total_cost);
};

export const useMaintenanceWithdrawals = (
  equipmentFilter?: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ["maintenance-withdrawals", equipmentFilter, startDate, endDate],
    queryFn: () => fetchMaintenanceWithdrawals(equipmentFilter, startDate, endDate),
  });
};

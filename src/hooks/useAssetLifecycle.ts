import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LeaseCycleData {
  rental_company: string | null;
  rental_work_site: string | null;
  rental_start_date: string | null;
  rental_end_date: string | null;
  rental_contract_number: string | null;
}

interface MaintenanceCycleData {
  maintenance_company: string | null;
  maintenance_work_site: string | null;
  maintenance_arrival_date: string | null;
  maintenance_departure_date: string | null;
  maintenance_description: string | null;
}

interface AssetLifecycle {
  id: string;
  asset_id: string;
  asset_code: string;
  cycle_number: number;
  cycle_started_at: string;
  cycle_closed_at: string | null;
  closed_by: string | null;
  reason: string | null;
  archived_withdrawals_count: number;
  created_at: string;
}

export const useAssetLifecycle = () => {
  const { user } = useAuth();

  /**
   * Salva um ciclo de locação completo no histórico
   */
  const saveLeaseCycle = async (
    assetId: string,
    assetCode: string,
    cycleData: LeaseCycleData
  ): Promise<void> => {
    if (!user) {
      console.error("Usuário não autenticado");
      toast.error("Usuário não autenticado");
      return;
    }

    // Verificar se há dados válidos para salvar
    const hasValidData = cycleData.rental_company || cycleData.rental_work_site;
    if (!hasValidData) {
      console.log("Nenhum dado de locação para salvar no ciclo de vida");
      return;
    }

    try {
      // Buscar o último cycle_number para este ativo
      const { data: lastCycle } = await supabase
        .from("asset_lifecycle_history")
        .select("cycle_number")
        .eq("asset_id", assetId)
        .order("cycle_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextCycleNumber = lastCycle ? lastCycle.cycle_number + 1 : 1;

      // Inserir registro de ciclo de vida
      const { error } = await supabase
        .from("asset_lifecycle_history")
        .insert({
          asset_id: assetId,
          asset_code: assetCode,
          cycle_number: nextCycleNumber,
          cycle_started_at: cycleData.rental_start_date || new Date().toISOString(),
          cycle_closed_at: new Date().toISOString(),
          closed_by: user.id,
          reason: `Ciclo de locação encerrado. Cliente: ${cycleData.rental_company || "N/A"}, Obra: ${cycleData.rental_work_site || "N/A"}, Contrato: ${cycleData.rental_contract_number || "N/A"}`,
          archived_withdrawals_count: 0, // Será atualizado posteriormente se necessário
        });

      if (error) {
        console.error("Erro ao salvar ciclo de locação:", error);
        throw error;
      }

      console.log(`✓ Ciclo de locação #${nextCycleNumber} salvo para ${assetCode}`);
    } catch (error) {
      console.error("Erro ao salvar ciclo de locação:", error);
      toast.error("Erro ao arquivar ciclo de locação");
      throw error;
    }
  };

  /**
   * Salva um ciclo de manutenção completo no histórico
   */
  const saveMaintenanceCycle = async (
    assetId: string,
    assetCode: string,
    cycleData: MaintenanceCycleData
  ): Promise<void> => {
    if (!user) {
      console.error("Usuário não autenticado");
      toast.error("Usuário não autenticado");
      return;
    }

    // Verificar se há dados válidos para salvar
    const hasValidData = cycleData.maintenance_company || cycleData.maintenance_work_site;
    if (!hasValidData) {
      console.log("Nenhum dado de manutenção para salvar no ciclo de vida");
      return;
    }

    try {
      // Buscar o último cycle_number para este ativo
      const { data: lastCycle } = await supabase
        .from("asset_lifecycle_history")
        .select("cycle_number")
        .eq("asset_id", assetId)
        .order("cycle_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextCycleNumber = lastCycle ? lastCycle.cycle_number + 1 : 1;

      // Calcular duração se houver datas
      let durationDays = 0;
      if (cycleData.maintenance_arrival_date && cycleData.maintenance_departure_date) {
        const arrival = new Date(cycleData.maintenance_arrival_date);
        const departure = new Date(cycleData.maintenance_departure_date);
        durationDays = Math.ceil((departure.getTime() - arrival.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Inserir registro de ciclo de vida
      const { error } = await supabase
        .from("asset_lifecycle_history")
        .insert({
          asset_id: assetId,
          asset_code: assetCode,
          cycle_number: nextCycleNumber,
          cycle_started_at: cycleData.maintenance_arrival_date || new Date().toISOString(),
          cycle_closed_at: new Date().toISOString(),
          closed_by: user.id,
          reason: `Ciclo de manutenção encerrado (${durationDays} dias). ${cycleData.maintenance_company || "N/A"} - ${cycleData.maintenance_work_site || "N/A"}. ${cycleData.maintenance_description || ""}`,
          archived_withdrawals_count: 0,
        });

      if (error) {
        console.error("Erro ao salvar ciclo de manutenção:", error);
        throw error;
      }

      console.log(`✓ Ciclo de manutenção #${nextCycleNumber} salvo para ${assetCode}`);
    } catch (error) {
      console.error("Erro ao salvar ciclo de manutenção:", error);
      toast.error("Erro ao arquivar ciclo de manutenção");
      throw error;
    }
  };

  /**
   * Busca todos os ciclos históricos de um ativo
   */
  const getAssetLifecycles = async (assetId: string): Promise<AssetLifecycle[]> => {
    try {
      const { data, error } = await supabase
        .from("asset_lifecycle_history")
        .select("*")
        .eq("asset_id", assetId)
        .order("cycle_number", { ascending: false });

      if (error) {
        console.error("Erro ao buscar ciclos de vida:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Erro ao buscar ciclos de vida:", error);
      toast.error("Erro ao carregar histórico de ciclos");
      return [];
    }
  };

  return {
    saveLeaseCycle,
    saveMaintenanceCycle,
    getAssetLifecycles,
  };
};

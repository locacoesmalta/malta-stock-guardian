import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MaintenancePart {
  product_id: string;
  quantity: number;
  unit_cost: number;
}

export interface MaintenanceData {
  asset_id: string;
  maintenance_date: string;
  maintenance_type: "preventiva" | "corretiva";
  previous_hourmeter: number;
  current_hourmeter: number;
  services_performed: string;
  observations?: string;
  technician_name?: string;
  labor_cost?: number;
  parts: MaintenancePart[];
}

export const useAssetMaintenances = (assetId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: maintenances, isLoading } = useQuery({
    queryKey: ["asset-maintenances", assetId],
    queryFn: async () => {
      if (!assetId) return [];

      const { data, error } = await supabase
        .from("asset_maintenances")
        .select(`
          *,
          asset:assets(asset_code, equipment_name)
        `)
        .eq("asset_id", assetId)
        .order("maintenance_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!assetId,
  });

  const createMaintenance = useMutation({
    mutationFn: async (data: MaintenanceData) => {
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Inserir a manutenção
      const { data: maintenance, error: maintenanceError } = await supabase
        .from("asset_maintenances")
        .insert({
          asset_id: data.asset_id,
          maintenance_date: data.maintenance_date,
          maintenance_type: data.maintenance_type,
          previous_hourmeter: data.previous_hourmeter,
          current_hourmeter: data.current_hourmeter,
          services_performed: data.services_performed,
          observations: data.observations,
          technician_name: data.technician_name,
          labor_cost: data.labor_cost || 0,
          parts_cost: 0, // Será calculado depois
          registered_by: user.id,
        })
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // 2. Inserir as peças e calcular custo total
      let totalPartsCost = 0;
      
      if (data.parts && data.parts.length > 0) {
        const partsToInsert = data.parts.map(part => ({
          maintenance_id: maintenance.id,
          product_id: part.product_id,
          quantity: part.quantity,
          unit_cost: part.unit_cost,
        }));

        const { error: partsError } = await supabase
          .from("asset_maintenance_parts")
          .insert(partsToInsert);

        if (partsError) throw partsError;

        totalPartsCost = data.parts.reduce(
          (sum, part) => sum + (part.quantity * part.unit_cost),
          0
        );

        // 3. Atualizar o custo de peças na manutenção
        const { error: updateError } = await supabase
          .from("asset_maintenances")
          .update({ parts_cost: totalPartsCost })
          .eq("id", maintenance.id);

        if (updateError) throw updateError;

        // 4. Dar baixa no estoque dos produtos
        for (const part of data.parts) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("quantity")
            .eq("id", part.product_id)
            .single();

          if (productError) {
            console.warn("Erro ao buscar produto:", productError);
            continue;
          }

          const newQuantity = (product.quantity || 0) - part.quantity;
          
          const { error: updateError } = await supabase
            .from("products")
            .update({ quantity: Math.max(0, newQuantity) })
            .eq("id", part.product_id);

          if (updateError) {
            console.warn("Erro ao atualizar estoque:", updateError);
          }
        }
      }

      return maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-maintenances"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Manutenção registrada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar manutenção:", error);
      toast.error("Erro ao registrar manutenção");
    },
  });

  const deleteMaintenance = useMutation({
    mutationFn: async (maintenanceId: string) => {
      const { error } = await supabase
        .from("asset_maintenances")
        .delete()
        .eq("id", maintenanceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-maintenances"] });
      queryClient.invalidateQueries({ queryKey: ["patrimonio-historico"] });
      toast.success("Manutenção excluída com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao excluir manutenção:", error);
      toast.error("Erro ao excluir manutenção");
    },
  });

  const getTotalHourmeter = useQuery({
    queryKey: ["total-hourmeter", assetId],
    queryFn: async () => {
      if (!assetId) return 0;

      const { data, error } = await supabase.rpc("get_total_hourmeter", {
        p_asset_id: assetId,
      });

      if (error) throw error;
      return data as number;
    },
    enabled: !!assetId,
  });

  return {
    maintenances: maintenances || [],
    isLoading,
    createMaintenance,
    deleteMaintenance,
    totalHourmeter: getTotalHourmeter.data || 0,
    isLoadingTotal: getTotalHourmeter.isLoading,
  };
};

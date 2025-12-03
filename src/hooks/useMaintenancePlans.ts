import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VerificationSection } from "@/lib/maintenancePlanDefaults";

export interface MaintenancePlanPhoto {
  url: string;
  comment: string;
  order: number;
}

export interface MaintenancePlanData {
  id?: string;
  asset_id?: string | null;
  equipment_code?: string;
  equipment_name?: string;
  equipment_manufacturer?: string;
  equipment_model?: string;
  equipment_serial?: string;
  plan_type: "preventiva" | "corretiva";
  plan_date: string;
  current_hourmeter: number;
  next_revision_hourmeter?: number;
  company_name: string;
  company_cnpj: string;
  company_address: string;
  company_cep: string;
  company_phone: string;
  company_email: string;
  client_name?: string;
  client_company?: string;
  client_work_site?: string;
  observations_operational?: string;
  observations_technical?: string;
  observations_procedures?: string;
  supervisor_name?: string;
  supervisor_signature?: string;
  technician_name?: string;
  technician_signature?: string;
  client_signature?: string;
  verification_sections: VerificationSection[];
  photos: MaintenancePlanPhoto[];
}

export const useMaintenancePlans = (assetId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar planos de um equipamento específico
  const { data: plans, isLoading } = useQuery({
    queryKey: ["maintenance-plans", assetId],
    queryFn: async () => {
      let query = supabase
        .from("maintenance_plans")
        .select("*")
        .order("plan_date", { ascending: false });

      if (assetId) {
        query = query.eq("asset_id", assetId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Buscar um plano específico
  const usePlanById = (planId: string | undefined) => {
    return useQuery({
      queryKey: ["maintenance-plan", planId],
      queryFn: async () => {
        if (!planId) return null;
        
        const { data, error } = await supabase
          .from("maintenance_plans")
          .select("*")
          .eq("id", planId)
          .single();

        if (error) throw error;
        return data;
      },
      enabled: !!planId && !!user,
    });
  };

  // Criar novo plano
  const createPlan = useMutation({
    mutationFn: async (planData: MaintenancePlanData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("maintenance_plans")
        .insert({
          ...planData,
          verification_sections: planData.verification_sections as any,
          photos: planData.photos as any,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-plans"] });
      toast.success("Plano de manutenção criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar plano:", error);
      toast.error("Erro ao criar plano de manutenção");
    },
  });

  // Atualizar plano
  const updatePlan = useMutation({
    mutationFn: async ({ id, ...planData }: MaintenancePlanData & { id: string }) => {
      const { data, error } = await supabase
        .from("maintenance_plans")
        .update({
          ...planData,
          verification_sections: planData.verification_sections as any,
          photos: planData.photos as any,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-plans"] });
      toast.success("Plano de manutenção atualizado!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar plano:", error);
      toast.error("Erro ao atualizar plano");
    },
  });

  // Deletar plano
  const deletePlan = useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase
        .from("maintenance_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-plans"] });
      toast.success("Plano de manutenção excluído!");
    },
    onError: (error) => {
      console.error("Erro ao excluir plano:", error);
      toast.error("Erro ao excluir plano");
    },
  });

  return {
    plans,
    isLoading,
    usePlanById,
    createPlan,
    updatePlan,
    deletePlan,
  };
};

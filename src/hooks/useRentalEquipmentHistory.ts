import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export interface RentalEquipmentHistory {
  id: string;
  rental_company_id: string;
  rental_equipment_id: string | null;
  original_asset_id: string | null;
  original_asset_code: string;
  original_equipment_name: string;
  substitute_asset_id: string | null;
  substitute_asset_code: string | null;
  substitute_equipment_name: string | null;
  original_pickup_date: string;
  substitution_date: string | null;
  association_end_date: string | null;
  substitution_reason: string | null;
  work_site: string | null;
  current_status: string | null;
  event_type: 'ORIGINAL' | 'SUBSTITUTION' | 'RETURN';
  created_at: string;
  created_by: string | null;
  notes: string | null;
}

export interface CreateHistoryInput {
  rental_company_id: string;
  rental_equipment_id?: string;
  original_asset_id?: string;
  original_asset_code: string;
  original_equipment_name: string;
  substitute_asset_id?: string;
  substitute_asset_code?: string;
  substitute_equipment_name?: string;
  original_pickup_date: string;
  substitution_date?: string;
  association_end_date?: string;
  substitution_reason?: string;
  work_site?: string;
  current_status?: string;
  event_type: 'ORIGINAL' | 'SUBSTITUTION' | 'RETURN';
  notes?: string;
}

/**
 * Hook para buscar histórico de equipamentos de um contrato
 */
export const useRentalEquipmentHistory = (companyId: string) => {
  return useQuery({
    queryKey: ["rental-equipment-history", companyId],
    queryFn: async (): Promise<RentalEquipmentHistory[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("rental_equipment_history")
        .select("*")
        .eq("rental_company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rental equipment history:", error);
        throw error;
      }

      return (data || []) as RentalEquipmentHistory[];
    },
    enabled: !!companyId,
  });
};

/**
 * Hook para adicionar registro no histórico
 */
export const useAddRentalEquipmentHistory = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateHistoryInput) => {
      const { data, error } = await supabase
        .from("rental_equipment_history")
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment-history", variables.rental_company_id] });
    },
    onError: (error: any) => {
      console.error("Error adding rental equipment history:", error);
    },
  });
};

/**
 * Hook para atualizar registro no histórico (ex: quando equipamento volta ao depósito)
 */
export const useUpdateRentalEquipmentHistory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentalEquipmentHistory> & { id: string }) => {
      const { data, error } = await supabase
        .from("rental_equipment_history")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as RentalEquipmentHistory;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment-history", data.rental_company_id] });
    },
    onError: (error: any) => {
      console.error("Error updating rental equipment history:", error);
    },
  });
};

/**
 * Busca o registro de rental_equipment ativo para um asset
 */
export const findActiveRentalEquipment = async (assetId: string) => {
  const { data, error } = await supabase
    .from("rental_equipment")
    .select("*, rental_companies(*)")
    .eq("asset_id", assetId)
    .is("return_date", null)
    .maybeSingle();

  if (error) {
    console.error("Error finding active rental equipment:", error);
    return null;
  }

  return data;
};

/**
 * Busca histórico pendente (sem association_end_date) para um asset
 */
export const findPendingHistoryByAsset = async (assetId: string) => {
  const { data, error } = await supabase
    .from("rental_equipment_history")
    .select("*")
    .eq("original_asset_id", assetId)
    .is("association_end_date", null)
    .maybeSingle();

  if (error) {
    console.error("Error finding pending history:", error);
    return null;
  }

  return data as RentalEquipmentHistory | null;
};

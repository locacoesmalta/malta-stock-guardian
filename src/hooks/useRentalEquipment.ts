import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { differenceInDays } from "date-fns";

export interface RentalEquipment {
  id: string;
  rental_company_id: string;
  asset_id: string | null;
  asset_code: string;
  equipment_name: string;
  pickup_date: string;
  return_date: string | null;
  daily_rate: number | null;
  created_at: string;
  updated_at: string;
}

export interface RentalEquipmentInput {
  rental_company_id: string;
  asset_id?: string;
  asset_code: string;
  equipment_name: string;
  pickup_date: string;
  return_date?: string;
  daily_rate?: number;
}

/**
 * Calcula os dias de locação baseado na data de início do contrato
 */
export const calculateDaysRented = (
  contractStartDate: string,
  returnDate: string | null
): number => {
  const startDate = new Date(contractStartDate);
  const endDate = returnDate ? new Date(returnDate) : new Date();
  const days = differenceInDays(endDate, startDate);
  return Math.max(0, days + 1); // +1 para incluir o dia inicial
};

/**
 * Hook para buscar equipamentos de uma empresa de locação
 */
export const useRentalEquipment = (companyId: string) => {
  return useQuery({
    queryKey: ["rental-equipment", companyId],
    queryFn: async (): Promise<RentalEquipment[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from("rental_equipment")
        .select("*")
        .eq("rental_company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rental equipment:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!companyId,
  });
};

/**
 * Hook para adicionar equipamento
 */
export const useAddRentalEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (equipment: RentalEquipmentInput) => {
      const { data, error } = await supabase
        .from("rental_equipment")
        .insert(equipment)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment", variables.rental_company_id] });
      toast({
        title: "Equipamento adicionado",
        description: "O equipamento foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para atualizar equipamento (principalmente para marcar devolução)
 */
export const useUpdateRentalEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RentalEquipment> & { id: string }) => {
      const { data, error } = await supabase
        .from("rental_equipment")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment", data.rental_company_id] });
      toast({
        title: "Equipamento atualizado",
        description: "O equipamento foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para deletar equipamento
 */
export const useDeleteRentalEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, companyId }: { id: string; companyId: string }) => {
      const { error } = await supabase
        .from("rental_equipment")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, companyId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment", variables.companyId] });
      toast({
        title: "Equipamento removido",
        description: "O equipamento foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { differenceInDays, parseISO } from "date-fns";

export interface RentalEquipment {
  id: string;
  rental_company_id: string;
  asset_id: string | null;
  asset_code: string | null;
  equipment_name: string;
  pickup_date: string;
  return_date: string | null;
  daily_rate_15: number | null;
  daily_rate_30: number | null;
  rental_period: string | null;
  work_site: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalEquipmentInput {
  rental_company_id: string;
  asset_id?: string;
  asset_code?: string;
  equipment_name: string;
  pickup_date: string;
  return_date?: string;
  daily_rate_15?: number;
  daily_rate_30?: number;
  rental_period?: string;
  work_site?: string;
}

/**
 * Calcula os dias de locação baseado na data de RETIRADA do equipamento
 */
export const calculateDaysRented = (
  pickupDate: string,
  returnDate: string | null
): number => {
  const startDate = parseISO(pickupDate);
  const endDate = returnDate ? parseISO(returnDate) : new Date();
  const days = differenceInDays(endDate, startDate) + 1; // +1 para incluir o dia inicial
  return Math.max(0, days);
};

/**
 * Calcula o valor da locação com regras de cobrança mínima
 * - Até 15 dias: cobra 15 dias com diária de 15 dias (maior)
 * - Mais de 15 dias: cobra dias reais com diária de 30 dias (menor)
 */
export const calcularValorLocacao = (
  diasLocados: number,
  diaria15: number,
  diaria30: number
): { diasCobrados: number; valorDiaria: number; valorTotal: number } => {
  if (diasLocados <= 15) {
    return {
      diasCobrados: 15,
      valorDiaria: diaria15,
      valorTotal: 15 * diaria15
    };
  } else {
    return {
      diasCobrados: diasLocados,
      valorDiaria: diaria30,
      valorTotal: diasLocados * diaria30
    };
  }
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
 * Verifica se todos os equipamentos de uma empresa foram devolvidos
 * Se sim, atualiza a data de término do contrato automaticamente
 */
const checkAndUpdateContractEndDate = async (companyId: string, returnDate: string) => {
  // Buscar todos os equipamentos da empresa
  const { data: equipment, error: fetchError } = await supabase
    .from("rental_equipment")
    .select("id, return_date")
    .eq("rental_company_id", companyId);

  if (fetchError) {
    console.error("Error checking equipment:", fetchError);
    return;
  }

  // Verificar se TODOS os equipamentos têm return_date
  const allReturned = equipment && equipment.length > 0 && 
    equipment.every(eq => eq.return_date !== null);

  if (allReturned) {
    // Encontrar a última data de devolução
    const latestReturn = equipment
      .map(eq => eq.return_date)
      .filter(Boolean)
      .sort()
      .pop();

    // Atualizar a data de término do contrato
    const { error: updateError } = await supabase
      .from("rental_companies")
      .update({ contract_end_date: latestReturn || returnDate })
      .eq("id", companyId);

    if (updateError) {
      console.error("Error updating contract end date:", updateError);
    } else {
      toast({
        title: "Contrato finalizado",
        description: "Todos os equipamentos foram devolvidos. Data de término atualizada automaticamente.",
      });
    }
  }
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
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rental-equipment", data.rental_company_id] });
      queryClient.invalidateQueries({ queryKey: ["rental-companies"] });
      queryClient.invalidateQueries({ queryKey: ["rental-company", data.rental_company_id] });
      queryClient.invalidateQueries({ queryKey: ["rental-companies-with-equipment"] });
      
      // Se foi uma devolução (return_date foi atualizado), verificar se todos equipamentos foram devolvidos
      if ('return_date' in variables && variables.return_date) {
        await checkAndUpdateContractEndDate(data.rental_company_id, variables.return_date as string);
        // Re-invalidar após atualização do contrato
        queryClient.invalidateQueries({ queryKey: ["rental-company", data.rental_company_id] });
      }
      
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

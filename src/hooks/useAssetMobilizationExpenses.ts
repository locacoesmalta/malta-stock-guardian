import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MobilizationExpense {
  id: string;
  asset_id: string;
  expense_type: 'travel' | 'shipment';
  value: number;
  created_at: string;
  updated_at: string;
  registered_by: string;
  collaborator_name?: string | null;
  travel_date?: string | null;
  return_date?: string | null;
  sent_by?: string | null;
  shipment_date?: string | null;
  received_by?: string | null;
}

interface AddMobilizationExpenseData {
  asset_id: string;
  expense_type: 'travel' | 'shipment';
  value: number;
  collaborator_name?: string;
  travel_date?: string;
  return_date?: string;
  sent_by?: string;
  shipment_date?: string;
  received_by?: string;
}

export const useAssetMobilizationExpenses = (assetId: string) => {
  const queryClient = useQueryClient();

  // Buscar todas as despesas do ativo
  const {
    data: mobilizationExpenses = [],
    isLoading,
  } = useQuery({
    queryKey: ['asset-mobilization-expenses', assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_mobilization_expenses')
        .select('*')
        .eq('asset_id', assetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching mobilization expenses:', error);
        throw error;
      }

      return (data || []) as MobilizationExpense[];
    },
  });

  // Calcular custo total das despesas
  const totalExpensesCost = mobilizationExpenses.reduce((sum, expense) => {
    return sum + Number(expense.value);
  }, 0);

  // Mutation para adicionar despesa
  const { mutate: addMobilizationExpense, isPending: isAdding } = useMutation({
    mutationFn: async (data: AddMobilizationExpenseData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: result, error } = await supabase
        .from('asset_mobilization_expenses')
        .insert({
          ...data,
          registered_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-mobilization-expenses', assetId] });
      toast({
        title: "Despesa adicionada",
        description: "A despesa foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error adding mobilization expense:', error);
      toast({
        title: "Erro ao adicionar despesa",
        description: "Não foi possível adicionar a despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para remover despesa
  const { mutate: removeMobilizationExpense, isPending: isRemoving } = useMutation({
    mutationFn: async (expenseId: string) => {
      const { error } = await supabase
        .from('asset_mobilization_expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-mobilization-expenses', assetId] });
      toast({
        title: "Despesa removida",
        description: "A despesa foi removida com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Error removing mobilization expense:', error);
      toast({
        title: "Erro ao remover despesa",
        description: "Não foi possível remover a despesa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    mobilizationExpenses,
    totalExpensesCost,
    isLoading,
    addMobilizationExpense,
    removeMobilizationExpense,
    isAdding,
    isRemoving,
  };
};

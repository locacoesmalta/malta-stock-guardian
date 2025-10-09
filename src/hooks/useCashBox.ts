import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CashBox {
  id: string;
  opened_by: string;
  opened_at: string;
  closed_at: string | null;
  initial_value: number;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export interface CashBoxTransaction {
  id: string;
  cash_box_id: string;
  type: 'entrada' | 'saida' | 'devolucao';
  value: number;
  description: string | null;
  observations: string | null;
  attachment_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useCashBox = () => {
  const queryClient = useQueryClient();

  // Buscar caixa aberto
  const { data: openCashBox, isLoading: isLoadingCashBox } = useQuery({
    queryKey: ["open-cash-box"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as CashBox | null;
    },
  });

  // Buscar transações do caixa
  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["cash-box-transactions", openCashBox?.id],
    queryFn: async () => {
      if (!openCashBox?.id) return [];
      
      const { data, error } = await supabase
        .from("cash_box_transactions")
        .select("*")
        .eq("cash_box_id", openCashBox.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as CashBoxTransaction[];
    },
    enabled: !!openCashBox?.id,
  });

  // Abrir caixa
  const openCashBoxMutation = useMutation({
    mutationFn: async ({ openedAt, initialValue }: { openedAt: string; initialValue: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("cash_boxes")
        .insert({
          opened_by: user.id,
          opened_at: openedAt,
          initial_value: initialValue,
          status: "open",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-cash-box"] });
      toast.success("Caixa aberto com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao abrir caixa: " + error.message);
    },
  });

  // Fechar caixa
  const closeCashBoxMutation = useMutation({
    mutationFn: async (cashBoxId: string) => {
      const { data, error } = await supabase
        .from("cash_boxes")
        .update({
          closed_at: new Date().toISOString(),
          status: "closed",
        })
        .eq("id", cashBoxId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-cash-box"] });
      toast.success("Caixa fechado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao fechar caixa: " + error.message);
    },
  });

  // Adicionar transação
  const addTransactionMutation = useMutation({
    mutationFn: async ({
      type,
      value,
      description,
      observations,
      attachmentFile,
    }: {
      type: 'entrada' | 'saida' | 'devolucao';
      value: number;
      description?: string;
      observations?: string;
      attachmentFile?: File;
    }) => {
      if (!openCashBox) throw new Error("Nenhum caixa aberto");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      let attachmentUrl = null;

      // Upload do arquivo se existir
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("cash-box-attachments")
          .upload(fileName, attachmentFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("cash-box-attachments")
          .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
      }

      const { data, error } = await supabase
        .from("cash_box_transactions")
        .insert({
          cash_box_id: openCashBox.id,
          type,
          value,
          description,
          observations,
          attachment_url: attachmentUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-box-transactions"] });
      toast.success("Transação adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar transação: " + error.message);
    },
  });

  // Editar transação
  const updateTransactionMutation = useMutation({
    mutationFn: async ({
      id,
      description,
      observations,
    }: {
      id: string;
      description?: string;
      observations: string;
    }) => {
      const updateData: any = { observations };
      if (description !== undefined) {
        updateData.description = description;
      }
      
      const { data, error } = await supabase
        .from("cash_box_transactions")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-box-transactions"] });
      toast.success("Transação atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar transação: " + error.message);
    },
  });

  // Calcular saldo total
  const calculateBalance = () => {
    if (!openCashBox) return 0;
    
    let balance = openCashBox.initial_value;
    
    transactions.forEach((transaction) => {
      if (transaction.type === 'entrada') {
        balance += Number(transaction.value);
      } else if (transaction.type === 'saida') {
        balance -= Number(transaction.value);
      } else if (transaction.type === 'devolucao') {
        balance -= Number(transaction.value);
      }
    });
    
    return balance;
  };

  return {
    openCashBox,
    transactions,
    isLoadingCashBox,
    isLoadingTransactions,
    openCashBoxMutation,
    closeCashBoxMutation,
    addTransactionMutation,
    updateTransactionMutation,
    calculateBalance,
  };
};

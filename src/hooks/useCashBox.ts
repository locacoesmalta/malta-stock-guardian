import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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
  invoice_date: string | null;
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

  // Buscar histórico de caixas fechados
  const { data: closedCashBoxes = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["closed-cash-boxes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_boxes")
        .select("*")
        .eq("status", "closed")
        .order("closed_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CashBox[];
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

  // Buscar transações de um caixa específico (para histórico)
  const getTransactionsForCashBox = async (cashBoxId: string) => {
    const { data, error } = await supabase
      .from("cash_box_transactions")
      .select("*")
      .eq("cash_box_id", cashBoxId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as CashBoxTransaction[];
  };

  // Abrir caixa
  const openCashBoxMutation = useMutation({
    mutationFn: async ({ openedAt, initialValue }: { openedAt: string; initialValue: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("cash_boxes")
        .insert({
          opened_by: user.id,
          opened_at: format(new Date(openedAt), "yyyy-MM-dd'T'HH:mm:ssXXX"),
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

  // Reabrir caixa fechado
  const reopenCashBoxMutation = useMutation({
    mutationFn: async (cashBoxId: string) => {
      // Verificar se já existe um caixa aberto
      const { data: existingOpen } = await supabase
        .from("cash_boxes")
        .select("id")
        .eq("status", "open")
        .maybeSingle();

      if (existingOpen) {
        throw new Error("Já existe um caixa aberto. Feche-o antes de reabrir outro.");
      }

      const { data, error } = await supabase
        .from("cash_boxes")
        .update({
          closed_at: null,
          status: "open",
        })
        .eq("id", cashBoxId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-cash-box"] });
      queryClient.invalidateQueries({ queryKey: ["closed-cash-boxes"] });
      toast.success("Caixa reaberto com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao reabrir caixa: " + error.message);
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
      invoiceDate,
    }: {
      type: 'entrada' | 'saida' | 'devolucao';
      value: number;
      description?: string;
      observations?: string;
      attachmentFile?: File;
      invoiceDate?: string;
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
          invoice_date: invoiceDate 
            ? (() => {
                const [year, month, day] = invoiceDate.split('-').map(Number);
                return format(new Date(year, month - 1, day), "yyyy-MM-dd");
              })()
            : null,
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
      invoiceDate,
    }: {
      id: string;
      description?: string;
      observations: string;
      invoiceDate?: string;
    }) => {
      const updateData: any = { observations };
      if (description !== undefined) {
        updateData.description = description;
      }
      if (invoiceDate !== undefined) {
        // Parsear data como componentes locais para evitar problemas de timezone
        updateData.invoice_date = invoiceDate 
          ? (() => {
              const [year, month, day] = invoiceDate.split('-').map(Number);
              return format(new Date(year, month - 1, day), "yyyy-MM-dd");
            })()
          : null;
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

  // Deletar transação (qualquer usuário com permissão)
  const deleteTransactionMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("cash_box_transactions")
        .delete()
        .eq("id", transactionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-box-transactions"] });
      toast.success("Transação excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir transação: " + error.message);
    },
  });

  // Deletar caixa (somente admin)
  const deleteCashBoxMutation = useMutation({
    mutationFn: async (cashBoxId: string) => {
      // Primeiro deletar todas as transações do caixa
      const { error: transError } = await supabase
        .from("cash_box_transactions")
        .delete()
        .eq("cash_box_id", cashBoxId);

      if (transError) throw transError;

      // Depois deletar o caixa
      const { error } = await supabase
        .from("cash_boxes")
        .delete()
        .eq("id", cashBoxId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-cash-box"] });
      queryClient.invalidateQueries({ queryKey: ["closed-cash-boxes"] });
      toast.success("Caixa excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir caixa: " + error.message);
    },
  });

  // Calcular saldo total
  const calculateBalance = (cashBox?: CashBox, cashBoxTransactions?: CashBoxTransaction[]) => {
    const box = cashBox || openCashBox;
    const trans = cashBoxTransactions || transactions;
    
    if (!box) return 0;
    
    let balance = box.initial_value;
    
    trans.forEach((transaction) => {
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
    closedCashBoxes,
    isLoadingCashBox,
    isLoadingTransactions,
    isLoadingHistory,
    openCashBoxMutation,
    closeCashBoxMutation,
    reopenCashBoxMutation,
    addTransactionMutation,
    updateTransactionMutation,
    deleteTransactionMutation,
    deleteCashBoxMutation,
    calculateBalance,
    getTransactionsForCashBox,
  };
};

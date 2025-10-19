import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReceiptType = 'entrega' | 'devolucao';

export interface ReceiptItem {
  id?: string;
  quantity: number;
  specification: string;
  item_order: number;
}

export interface Receipt {
  id?: string;
  receipt_number: number;
  receipt_type: ReceiptType;
  client_name: string;
  work_site: string;
  receipt_date: string;
  operation_nature?: string;
  received_by: string;
  received_by_cpf: string;
  received_by_malta?: string;
  signature?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[];
}

export const useReceipts = () => {
  const queryClient = useQueryClient();

  const { data: receipts, isLoading } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Receipt[];
    },
  });

  const createReceipt = useMutation({
    mutationFn: async (receiptData: ReceiptWithItems) => {
      const { items, ...receipt } = receiptData;

      const { data: receiptResult, error: receiptError } = await supabase
        .from('equipment_receipts')
        .insert(receipt)
        .select()
        .single();

      if (receiptError) throw receiptError;

      const itemsToInsert = items.map((item, index) => ({
        receipt_id: receiptResult.id,
        quantity: item.quantity,
        specification: item.specification,
        item_order: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from('equipment_receipt_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return receiptResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Comprovante salvo com sucesso!');
    },
    onError: (error: any) => {
      if (import.meta.env.DEV) {
        console.error('Error creating receipt:', error);
      }
      toast.error('Erro ao salvar comprovante: ' + error.message);
    },
  });

  const deleteReceipt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('equipment_receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast.success('Comprovante excluído com sucesso!');
    },
    onError: (error: any) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting receipt:', error);
      }
      toast.error('Erro ao excluir comprovante: ' + error.message);
    },
  });

  return {
    receipts,
    isLoading,
    createReceipt,
    deleteReceipt,
  };
};

export const useReceiptDetails = (id?: string) => {
  return useQuery({
    queryKey: ['receipt', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: receipt, error: receiptError } = await supabase
        .from('equipment_receipts')
        .select('*')
        .eq('id', id)
        .single();

      if (receiptError) throw receiptError;

      const { data: items, error: itemsError } = await supabase
        .from('equipment_receipt_items')
        .select('*')
        .eq('receipt_id', id)
        .order('item_order');

      if (itemsError) throw itemsError;

      return {
        ...receipt,
        items,
      } as ReceiptWithItems;
    },
    enabled: !!id,
  });
};

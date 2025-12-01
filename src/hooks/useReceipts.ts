import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendReceiptToWebhook, generateReceiptPDF } from "@/utils/receiptWebhook";

export type ReceiptType = 'entrega' | 'devolucao';

export interface ReceiptItem {
  id?: string;
  quantity: number;
  specification: string;
  item_order: number;
  pat_code?: string;
  equipment_comments?: string;
  photos?: string[];
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
  received_by_malta?: string;
  signature?: string;
  pdf_url?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[];
  whatsapp?: string;
  malta_operator?: string;
  shouldSendWebhook?: boolean;
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
      const { items, shouldSendWebhook, whatsapp, malta_operator, ...receiptBase } = receiptData;

      const receipt = {
        ...receiptBase,
        whatsapp: whatsapp || null,
        malta_operator: malta_operator || null,
      };

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
        pat_code: item.pat_code || null,
        item_order: index + 1,
        photos: item.photos || [],
      }));

      const { error: itemsError } = await supabase
        .from('equipment_receipt_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Gerar e salvar o PDF no Supabase Storage
      try {
        const pdfBlob = await generateReceiptPDF({
          receipt_number: receiptData.receipt_number,
          receipt_type: receiptData.receipt_type,
          client_name: receiptData.client_name,
          work_site: receiptData.work_site,
          receipt_date: receiptData.receipt_date,
          operation_nature: receiptData.operation_nature,
          received_by: receiptData.received_by,
          whatsapp: whatsapp,
          malta_operator: malta_operator || '',
          received_by_malta: receiptData.received_by_malta,
          items: items.map(item => ({
            pat_code: item.pat_code,
            specification: item.specification,
            quantity: item.quantity
          }))
        });

        const fileName = `receipt-${receiptResult.id}-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(fileName, pdfBlob, {
            contentType: 'application/pdf',
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erro ao fazer upload do PDF:', uploadError);
          toast.warning('Recibo salvo, mas houve erro ao armazenar o PDF');
        } else {
          const { data: urlData } = supabase.storage
            .from('receipts')
            .getPublicUrl(fileName);

          const { error: updateError } = await supabase
            .from('equipment_receipts')
            .update({ pdf_url: urlData.publicUrl })
            .eq('id', receiptResult.id);

          if (updateError) {
            console.error('Erro ao atualizar URL do PDF:', updateError);
          }
        }
      } catch (error) {
        console.error('Erro ao gerar/salvar PDF:', error);
        toast.warning('Recibo salvo, mas houve erro ao gerar o PDF');
      }

      // Enviar para o webhook após salvamento bem-sucedido
      if (shouldSendWebhook) {
        try {
          toast.info('Enviando comprovante via webhook...');
          
          await sendReceiptToWebhook({
            receipt_number: receiptData.receipt_number,
            receipt_type: receiptData.receipt_type,
            client_name: receiptData.client_name,
            work_site: receiptData.work_site,
            receipt_date: receiptData.receipt_date,
            operation_nature: receiptData.operation_nature,
            received_by: receiptData.received_by,
            whatsapp: whatsapp,
            malta_operator: malta_operator || '',
            received_by_malta: receiptData.received_by_malta,
            items: items.map(item => ({
              pat_code: item.pat_code,
              specification: item.specification,
              quantity: item.quantity
            }))
          });
          
          toast.success('Comprovante enviado via webhook com sucesso!');
        } catch (error) {
          console.error('Erro ao enviar webhook:', error);
          toast.warning('Comprovante salvo, mas houve erro ao enviar via webhook');
          // Não falha o fluxo - o recibo já foi salvo
        }
      }

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

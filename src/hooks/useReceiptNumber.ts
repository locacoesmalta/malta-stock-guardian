import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReceiptType } from "./useReceipts";

export const useReceiptNumber = (type: ReceiptType) => {
  return useQuery({
    queryKey: ['receiptNumber', type],
    queryFn: async () => {
      // Buscar o último número usado para este tipo
      const { data: lastReceipt } = await supabase
        .from('equipment_receipts')
        .select('receipt_number')
        .eq('receipt_type', type)
        .order('receipt_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Se não encontrar nenhum, usar o número inicial baseado no tipo
      const nextNumber = lastReceipt 
        ? lastReceipt.receipt_number + 1 
        : (type === 'entrega' ? 14000 : 1596);

      return nextNumber;
    },
    staleTime: 0,
    refetchOnMount: true,
  });
};

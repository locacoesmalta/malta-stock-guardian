import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NormalizationResult {
  table_name: string;
  field_name: string;
  records_updated: number;
}

export const useBatchNormalization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('normalize_all_data');
      
      if (error) {
        console.error('Erro na normalização em lote:', error);
        throw error;
      }
      
      return data as NormalizationResult[];
    },
    onSuccess: (data) => {
      const totalUpdated = data.reduce((sum, item) => sum + item.records_updated, 0);
      
      console.log('Normalização concluída:', data);
      
      toast.success(
        `✅ Normalização em lote concluída! ${totalUpdated} registros atualizados`,
        {
          description: data
            .filter(item => item.records_updated > 0)
            .map(item => `${item.table_name}.${item.field_name}: ${item.records_updated}`)
            .join(', '),
          duration: 5000,
        }
      );
      
      // Invalidar queries para atualizar dados na tela
      queryClient.invalidateQueries({ queryKey: ['duplicate-detection'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      console.error('Erro na normalização:', error);
      toast.error('❌ Erro ao executar normalização em lote', {
        description: error.message,
      });
    },
  });
};

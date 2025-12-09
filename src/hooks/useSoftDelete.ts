import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getISOStringInBelem } from "@/lib/dateUtils";

interface SoftDeleteParams {
  table: "assets" | "products" | "reports" | "equipment_receipts";
  id: string;
  queryKey: string[];
}

interface RestoreParams {
  table: "assets" | "products" | "reports" | "equipment_receipts";
  id: string;
  queryKey: string[];
}

export const useSoftDelete = () => {
  const queryClient = useQueryClient();

  const softDelete = useMutation({
    mutationFn: async ({ table, id }: SoftDeleteParams) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: getISOStringInBelem() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });
      toast.success("Item removido com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item");
    },
  });

  const restore = useMutation({
    mutationFn: async ({ table, id }: RestoreParams) => {
      const { error } = await supabase
        .from(table)
        .update({ deleted_at: null })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: variables.queryKey });
      toast.success("Item restaurado com sucesso");
    },
    onError: (error) => {
      console.error("Erro ao restaurar item:", error);
      toast.error("Erro ao restaurar item");
    },
  });

  return {
    softDelete: softDelete.mutate,
    softDeleteAsync: softDelete.mutateAsync,
    restore: restore.mutate,
    restoreAsync: restore.mutateAsync,
    isDeleting: softDelete.isPending,
    isRestoring: restore.isPending,
  };
};

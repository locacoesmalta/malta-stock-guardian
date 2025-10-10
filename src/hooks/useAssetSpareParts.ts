import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SparePart {
  id: string;
  asset_id: string;
  product_id: string;
  quantity: number;
  notes: string | null;
  registered_by: string;
  registered_at: string;
  products: {
    id: string;
    code: string;
    name: string;
  };
  profiles: {
    full_name: string | null;
  };
}

interface AddSparePartData {
  asset_id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}

export const useAssetSpareParts = (assetId: string) => {
  const queryClient = useQueryClient();

  const { data: spareParts = [], isLoading } = useQuery({
    queryKey: ["asset-spare-parts", assetId],
    queryFn: async (): Promise<SparePart[]> => {
      const { data, error } = await supabase
        .from("asset_spare_parts")
        .select(`
          *,
          products!inner (id, code, name)
        `)
        .eq("asset_id", assetId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      
      if (!data) return [];

      // Buscar profiles separadamente
      const userIds = [...new Set(data.map(item => item.registered_by))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      return data.map(item => ({
        ...item,
        profiles: {
          full_name: profileMap.get(item.registered_by) || null
        }
      }));
    },
  });

  const addSparePart = useMutation({
    mutationFn: async (data: AddSparePartData) => {
      const { data: result, error } = await supabase
        .from("asset_spare_parts")
        .insert({
          asset_id: data.asset_id,
          product_id: data.product_id,
          quantity: data.quantity,
          notes: data.notes || null,
          registered_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-spare-parts", assetId] });
      toast.success("Peça de reposição adicionada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar peça de reposição");
      console.error(error);
    },
  });

  const removeSparePart = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("asset_spare_parts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-spare-parts", assetId] });
      toast.success("Peça de reposição removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover peça de reposição");
      console.error(error);
    },
  });

  return {
    spareParts,
    isLoading,
    addSparePart: addSparePart.mutate,
    removeSparePart: removeSparePart.mutate,
    isAdding: addSparePart.isPending,
    isRemoving: removeSparePart.isPending,
  };
};

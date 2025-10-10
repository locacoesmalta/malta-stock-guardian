import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MobilizationPart {
  id: string;
  asset_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
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

interface AddMobilizationPartData {
  asset_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  purchase_date: string;
  notes?: string;
}

export const useAssetMobilizationParts = (assetId: string) => {
  const queryClient = useQueryClient();

  const { data: mobilizationParts = [], isLoading } = useQuery({
    queryKey: ["asset-mobilization-parts", assetId],
    queryFn: async (): Promise<MobilizationPart[]> => {
      const { data, error } = await supabase
        .from("asset_mobilization_parts")
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

  const totalMobilizationCost = mobilizationParts.reduce(
    (sum, part) => sum + Number(part.total_cost),
    0
  );

  const addMobilizationPart = useMutation({
    mutationFn: async (data: AddMobilizationPartData) => {
      const { data: result, error } = await supabase
        .from("asset_mobilization_parts")
        .insert({
          asset_id: data.asset_id,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          purchase_date: data.purchase_date,
          notes: data.notes || null,
          registered_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-mobilization-parts", assetId] });
      toast.success("Peça de mobilização adicionada com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao adicionar peça de mobilização");
      console.error(error);
    },
  });

  const removeMobilizationPart = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("asset_mobilization_parts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-mobilization-parts", assetId] });
      toast.success("Peça de mobilização removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover peça de mobilização");
      console.error(error);
    },
  });

  return {
    mobilizationParts,
    totalMobilizationCost,
    isLoading,
    addMobilizationPart: addMobilizationPart.mutate,
    removeMobilizationPart: removeMobilizationPart.mutate,
    isAdding: addMobilizationPart.isPending,
    isRemoving: removeMobilizationPart.isPending,
  };
};

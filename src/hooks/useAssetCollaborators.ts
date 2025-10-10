import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AssetCollaborator {
  id: string;
  asset_id: string;
  collaborator_name: string;
  assignment_date: string;
  created_at: string;
}

export const useAssetCollaborators = (assetId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collaborators, isLoading } = useQuery({
    queryKey: ["asset-collaborators", assetId],
    queryFn: async () => {
      if (!assetId) return [];
      
      const { data, error } = await supabase
        .from("asset_collaborators")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as AssetCollaborator[];
    },
    enabled: !!assetId,
  });

  const addCollaborator = useMutation({
    mutationFn: async ({
      assetId,
      collaboratorName,
    }: {
      assetId: string;
      collaboratorName: string;
    }) => {
      const { data, error } = await supabase
        .from("asset_collaborators")
        .insert({
          asset_id: assetId,
          collaborator_name: collaboratorName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-collaborators", assetId] });
      toast({
        title: "Colaborador adicionado",
        description: "O colaborador foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeCollaborator = useMutation({
    mutationFn: async (collaboratorId: string) => {
      const { error } = await supabase
        .from("asset_collaborators")
        .delete()
        .eq("id", collaboratorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-collaborators", assetId] });
      toast({
        title: "Colaborador removido",
        description: "O colaborador foi removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    collaborators: collaborators || [],
    isLoading,
    addCollaborator,
    removeCollaborator,
  };
};

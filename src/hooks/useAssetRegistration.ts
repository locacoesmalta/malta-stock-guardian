import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatPAT } from "@/lib/patUtils";

interface AssetVerification {
  exists: boolean;
  asset?: {
    id: string;
    asset_code: string;
    equipment_name: string;
    manufacturer: string;
    model?: string | null;
  };
}

/**
 * Hook para verificar se um PAT já existe no banco de dados
 */
export const useVerifyPAT = (pat: string | null) => {
  return useQuery({
    queryKey: ["verify-pat", pat],
    queryFn: async (): Promise<AssetVerification> => {
      if (!pat) {
        return { exists: false };
      }

      const formattedPAT = formatPAT(pat);
      if (!formattedPAT) {
        return { exists: false };
      }

      const { data, error } = await supabase
        .from("assets")
        .select("id, asset_code, equipment_name, manufacturer, model")
        .eq("asset_code", formattedPAT)
        .maybeSingle();

      if (error) {
        console.error("Error verifying PAT:", error);
        return { exists: false };
      }

      return {
        exists: !!data,
        asset: data || undefined,
      };
    },
    enabled: !!pat,
    staleTime: 0, // Always fetch fresh data
  });
};

/**
 * Hook para buscar sugestões de equipamentos baseado no nome
 */
export const useEquipmentSuggestions = (searchTerm: string) => {
  return useQuery({
    queryKey: ["equipment-suggestions", searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from("assets")
        .select("equipment_name, manufacturer, model")
        .ilike("equipment_name", `%${searchTerm}%`)
        .limit(10);

      if (error) {
        console.error("Error fetching suggestions:", error);
        return [];
      }

      // Remover duplicatas baseado no equipment_name
      const unique = data.reduce((acc, curr) => {
        if (!acc.find((item) => item.equipment_name === curr.equipment_name)) {
          acc.push(curr);
        }
        return acc;
      }, [] as typeof data);

      return unique;
    },
    enabled: searchTerm.length >= 2,
  });
};

/**
 * Hook para fazer upload de arquivos para o bucket de anexos
 */
export const useUploadAttachment = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("equipment-attachments")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("equipment-attachments")
        .getPublicUrl(filePath);

      return { path: filePath, url: publicUrl };
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível fazer upload do arquivo. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

/**
 * Hook para criar um novo asset
 */
export const useCreateAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assetData: any) => {
      const { error } = await supabase
        .from("assets")
        .insert(assetData)
        .select()
        .single();

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast({
        title: "Sucesso",
        description: "Equipamento cadastrado com sucesso!",
      });
    },
    onError: (error: any) => {
      console.error("Error creating asset:", error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar o equipamento.",
        variant: "destructive",
      });
    },
  });
};

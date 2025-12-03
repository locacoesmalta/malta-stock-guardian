import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { VerificationSection, getDefaultSections } from "@/lib/maintenancePlanDefaults";

export interface VerificationTemplate {
  id: string;
  name: string;
  equipment_type: string;
  manufacturer: string | null;
  model: string | null;
  verification_sections: VerificationSection[];
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useVerificationTemplates = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar todos os templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["verification-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_verification_templates")
        .select("*")
        .order("equipment_type", { ascending: true });

      if (error) throw error;
      return (data || []).map(item => ({
        ...item,
        verification_sections: item.verification_sections as unknown as VerificationSection[],
      })) as VerificationTemplate[];
    },
    enabled: !!user,
  });

  // Buscar template hierárquico para equipamento específico
  const getTemplateByEquipment = async (
    equipmentType: string,
    manufacturer?: string | null,
    model?: string | null
  ): Promise<{ sections: VerificationSection[]; source: string } | null> => {
    // 1. Buscar template exato (tipo + fabricante + modelo)
    if (equipmentType && manufacturer && model) {
      const { data: exactMatch } = await supabase
        .from("maintenance_verification_templates")
        .select("verification_sections, name")
        .eq("equipment_type", equipmentType)
        .eq("manufacturer", manufacturer)
        .eq("model", model)
        .limit(1)
        .maybeSingle();

      if (exactMatch) {
        return {
          sections: exactMatch.verification_sections as unknown as VerificationSection[],
          source: `Template: ${exactMatch.name} (${equipmentType} ${manufacturer} ${model})`,
        };
      }
    }

    // 2. Buscar template tipo + fabricante
    if (equipmentType && manufacturer) {
      const { data: manufacturerMatch } = await supabase
        .from("maintenance_verification_templates")
        .select("verification_sections, name")
        .eq("equipment_type", equipmentType)
        .eq("manufacturer", manufacturer)
        .is("model", null)
        .limit(1)
        .maybeSingle();

      if (manufacturerMatch) {
        return {
          sections: manufacturerMatch.verification_sections as unknown as VerificationSection[],
          source: `Template: ${manufacturerMatch.name} (${equipmentType} ${manufacturer})`,
        };
      }
    }

    // 3. Buscar template apenas tipo
    if (equipmentType) {
      const { data: typeMatch } = await supabase
        .from("maintenance_verification_templates")
        .select("verification_sections, name")
        .eq("equipment_type", equipmentType)
        .is("manufacturer", null)
        .is("model", null)
        .limit(1)
        .maybeSingle();

      if (typeMatch) {
        return {
          sections: typeMatch.verification_sections as unknown as VerificationSection[],
          source: `Template: ${typeMatch.name} (${equipmentType})`,
        };
      }
    }

    // 4. Retornar template padrão do código
    const defaultSections = getDefaultSections(equipmentType);
    const isGenerator = equipmentType?.toLowerCase().includes("gerador");
    
    return {
      sections: defaultSections,
      source: isGenerator ? "Template padrão: Geradores" : "Template padrão: Genérico",
    };
  };

  // Salvar como template
  const saveAsTemplate = useMutation({
    mutationFn: async ({
      name,
      equipmentType,
      manufacturer,
      model,
      sections,
    }: {
      name: string;
      equipmentType: string;
      manufacturer?: string | null;
      model?: string | null;
      sections: VerificationSection[];
    }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Verificar se já existe template para esta combinação
      let query = supabase
        .from("maintenance_verification_templates")
        .select("id")
        .eq("equipment_type", equipmentType);

      if (manufacturer) {
        query = query.eq("manufacturer", manufacturer);
      } else {
        query = query.is("manufacturer", null);
      }

      if (model) {
        query = query.eq("model", model);
      } else {
        query = query.is("model", null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        // Atualizar existente
        const { data, error } = await supabase
          .from("maintenance_verification_templates")
          .update({
            name,
            verification_sections: sections as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return { data, isUpdate: true };
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from("maintenance_verification_templates")
          .insert({
            name,
            equipment_type: equipmentType,
            manufacturer: manufacturer || null,
            model: model || null,
            verification_sections: sections as any,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return { data, isUpdate: false };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["verification-templates"] });
      toast.success(
        result.isUpdate
          ? "Template atualizado com sucesso!"
          : "Template salvo com sucesso!"
      );
    },
    onError: (error) => {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    },
  });

  // Deletar template
  const deleteTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from("maintenance_verification_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verification-templates"] });
      toast.success("Template excluído!");
    },
    onError: (error) => {
      console.error("Erro ao excluir template:", error);
      toast.error("Erro ao excluir template");
    },
  });

  return {
    templates,
    isLoading,
    getTemplateByEquipment,
    saveAsTemplate,
    deleteTemplate,
  };
};

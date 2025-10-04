import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface RegistrarEventoParams {
  patId: string;
  codigoPat: string;
  tipoEvento: string;
  detalhesEvento: string;
  campoAlterado?: string;
  valorAntigo?: string;
  valorNovo?: string;
}

export const useAssetHistory = () => {
  const { user } = useAuth();

  const registrarEvento = async ({
    patId,
    codigoPat,
    tipoEvento,
    detalhesEvento,
    campoAlterado,
    valorAntigo,
    valorNovo,
  }: RegistrarEventoParams) => {
    if (!user) {
      console.error("Usuário não autenticado");
      return;
    }

    try {
      const { data, error } = await supabase.rpc("registrar_evento_patrimonio", {
        p_pat_id: patId,
        p_codigo_pat: codigoPat,
        p_tipo_evento: tipoEvento,
        p_detalhes_evento: detalhesEvento,
        p_campo_alterado: campoAlterado ?? undefined,
        p_valor_antigo: valorAntigo ?? undefined,
        p_valor_novo: valorNovo ?? undefined,
      });

      if (error) {
        console.error("Erro ao registrar evento no histórico:", error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Erro ao registrar evento:", error);
      throw error;
    }
  };

  return { registrarEvento };
};

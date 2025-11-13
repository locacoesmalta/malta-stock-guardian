import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRegistrarEventoPatrimonio } from "./useRegistrarEventoPatrimonio";

interface MoveAssetParams {
  assetId: string;
  assetCode: string;
  fromStatus: string;
  toStatus: string;
  movementData: {
    rental_company?: string;
    rental_work_site?: string;
    rental_start_date?: string;
    maintenance_company?: string;
    maintenance_work_site?: string;
    maintenance_arrival_date?: string;
    maintenance_description?: string;
    deposito_description?: string;
    notes?: string;
  };
}

export const useAssetMovement = () => {
  const queryClient = useQueryClient();
  const { registrarEvento } = useRegistrarEventoPatrimonio();

  const mutation = useMutation({
    mutationFn: async ({ assetId, assetCode, fromStatus, toStatus, movementData }: MoveAssetParams) => {
      // Preparar dados de atualização
      const updateData: any = {
        location_type: toStatus,
        updated_at: new Date().toISOString(),
      };

      // Limpar dados do status anterior
      if (fromStatus === "locacao") {
        updateData.rental_company = null;
        updateData.rental_work_site = null;
        updateData.rental_start_date = null;
        updateData.rental_end_date = null;
      } else if (fromStatus === "em_manutencao") {
        updateData.maintenance_company = null;
        updateData.maintenance_work_site = null;
        updateData.maintenance_description = null;
        updateData.maintenance_arrival_date = null;
        updateData.maintenance_departure_date = null;
      } else if (fromStatus === "deposito_malta") {
        updateData.deposito_description = null;
      }

      // Adicionar dados do novo status
      if (toStatus === "locacao") {
        updateData.rental_company = movementData.rental_company;
        updateData.rental_work_site = movementData.rental_work_site;
        updateData.rental_start_date = movementData.rental_start_date;
        updateData.available_for_rental = true;
      } else if (toStatus === "em_manutencao") {
        updateData.maintenance_company = movementData.maintenance_company;
        updateData.maintenance_work_site = movementData.maintenance_work_site;
        updateData.maintenance_description = movementData.maintenance_description;
        updateData.maintenance_arrival_date = movementData.maintenance_arrival_date;
      } else if (toStatus === "deposito_malta") {
        updateData.deposito_description = movementData.deposito_description;
        updateData.available_for_rental = false;
      } else if (toStatus === "aguardando_laudo") {
        updateData.inspection_start_date = new Date().toISOString();
      }

      // Atualizar no banco
      const { error } = await supabase
        .from("assets")
        .update(updateData)
        .eq("id", assetId);

      if (error) throw error;

      // Registrar evento no histórico
      const getStatusLabel = (status: string) => {
        switch (status) {
          case "deposito_malta": return "Depósito Malta";
          case "em_manutencao": return "Em Manutenção";
          case "locacao": return "Locação";
          case "aguardando_laudo": return "Aguardando Laudo";
          default: return status;
        }
      };

      let detalhes = `Movido de ${getStatusLabel(fromStatus)} para ${getStatusLabel(toStatus)} em ${format(new Date(), "dd/MM/yyyy")}`;
      
      if (toStatus === "locacao") {
        detalhes += `. Empresa: ${movementData.rental_company}, Obra: ${movementData.rental_work_site}`;
      } else if (toStatus === "em_manutencao") {
        detalhes += `. Empresa: ${movementData.maintenance_company}, Local: ${movementData.maintenance_work_site}`;
        if (movementData.maintenance_description) {
          detalhes += `. Motivo: ${movementData.maintenance_description}`;
        }
      } else if (movementData.notes) {
        detalhes += `. Obs: ${movementData.notes}`;
      }

      await registrarEvento({
        patId: assetId,
        codigoPat: assetCode,
        tipoEvento: "MOVIMENTAÇÃO",
        campoAlterado: "location_type",
        valorAntigo: fromStatus,
        valorNovo: toStatus,
        detalhesEvento: detalhes,
      });

      return { assetId, fromStatus, toStatus };
    },
    onSuccess: ({ fromStatus, toStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-stats"] });
      
      const getStatusLabel = (status: string) => {
        switch (status) {
          case "deposito_malta": return "Depósito Malta";
          case "em_manutencao": return "Em Manutenção";
          case "locacao": return "Locação";
          case "aguardando_laudo": return "Aguardando Laudo";
          default: return status;
        }
      };

      toast.success(
        `Equipamento movido de ${getStatusLabel(fromStatus)} para ${getStatusLabel(toStatus)}`
      );
    },
    onError: (error) => {
      console.error("Erro ao mover equipamento:", error);
      toast.error("Erro ao mover equipamento. Tente novamente.");
    },
  });

  return {
    moveAsset: mutation.mutate,
    isMoving: mutation.isPending,
  };
};

import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssetCardHeader } from "@/components/AssetCard";
import { DeadlineStatusBadge } from "@/components/DeadlineStatusBadge";
import { Building2, MapPin } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer?: string;
  location_type: string;
  malta_collaborator?: string;
  deposito_description?: string;
  available_for_rental?: boolean;
  rental_company?: string;
  rental_work_site?: string;
  rental_start_date?: string;
  rental_end_date?: string;
  maintenance_company?: string;
  maintenance_work_site?: string;
  maintenance_description?: string;
  maintenance_arrival_date?: string;
  is_new_equipment?: boolean;
  inspection_start_date?: string;
  created_at: string;
  effective_registration_date?: string;
  retroactive_registration_notes?: string;
}

interface AssetGridViewProps {
  assets: Asset[];
}

export const AssetGridView = ({ assets }: AssetGridViewProps) => {
  const navigate = useNavigate();

  const getLocationLabel = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta":
        return "Depósito Malta";
      case "liberado_locacao":
        return "Liberado para Locação";
      case "em_manutencao":
        return "Em Manutenção";
      case "locacao":
        return "Locação";
      case "aguardando_laudo":
        return "Aguardando Laudo";
      default:
        return locationType;
    }
  };

  const getLocationVariant = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta":
        return "secondary" as const;
      case "liberado_locacao":
        return "outline" as const;
      case "em_manutencao":
        return "destructive" as const;
      case "locacao":
        return "default" as const;
      case "aguardando_laudo":
        return "warning" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assets.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">Nenhum patrimônio encontrado</p>
        </div>
      ) : (
        assets.map((asset) => (
          <Card
            key={asset.id}
            className="p-3 sm:p-4 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] animate-fade-in"
            onClick={() => navigate(`/assets/view/${asset.id}`)}
          >
            <AssetCardHeader
              assetCode={asset.asset_code}
              equipmentName={asset.equipment_name}
              maltaCollaborator={asset.malta_collaborator}
              locationLabel={getLocationLabel(asset.location_type)}
              locationVariant={getLocationVariant(asset.location_type)}
              effectiveRegistrationDate={asset.effective_registration_date}
              createdAt={asset.created_at}
              retroactiveRegistrationNotes={asset.retroactive_registration_notes}
            />

            {asset.location_type === "deposito_malta" && asset.deposito_description && (
              <div className="text-sm text-muted-foreground">
                <p>{asset.deposito_description}</p>
              </div>
            )}

            {asset.location_type === "liberado_locacao" && (
              <div className="text-sm text-muted-foreground">
                <p>{asset.available_for_rental ? "Disponível para locação" : "Indisponível"}</p>
              </div>
            )}

            {asset.location_type === "em_manutencao" && (
              <div className="space-y-2 text-xs sm:text-sm">
                {asset.maintenance_arrival_date && (
                  <div className="mb-2 sm:mb-3">
                    <Badge variant="destructive" className="text-xs sm:text-sm font-semibold">
                      ⏱️ {(() => {
                        const arrival = parseISO(asset.maintenance_arrival_date + "T00:00:00");
                        const today = new Date();
                        const diffTime = today.getTime() - arrival.getTime();
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} ${diffDays === 1 ? "dia" : "dias"} em manutenção`;
                      })()}
                    </Badge>
                  </div>
                )}
                {asset.maintenance_company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{asset.maintenance_company}</span>
                  </div>
                )}
                {asset.maintenance_work_site && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{asset.maintenance_work_site}</span>
                  </div>
                )}
                {asset.maintenance_description && (
                  <p className="text-xs text-muted-foreground mt-2 break-words">{asset.maintenance_description}</p>
                )}
                {asset.is_new_equipment !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {asset.is_new_equipment ? "Novo" : "Usado"}
                  </Badge>
                )}
              </div>
            )}

            {asset.location_type === "locacao" && (
              <div className="space-y-2 text-xs sm:text-sm">
                {asset.rental_company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{asset.rental_company}</span>
                  </div>
                )}
                {asset.rental_work_site && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="break-words">{asset.rental_work_site}</span>
                  </div>
                )}
                {asset.rental_start_date && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-xs mt-2 pt-2 border-t">
                    <span className="whitespace-nowrap">Início: {format(parseISO(asset.rental_start_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>
                    {asset.rental_end_date && (
                      <span className="whitespace-nowrap">Fim: {format(parseISO(asset.rental_end_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {asset.location_type === "aguardando_laudo" && asset.inspection_start_date && (
              <div className="text-sm">
                <DeadlineStatusBadge inspectionStartDate={asset.inspection_start_date} />
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
};

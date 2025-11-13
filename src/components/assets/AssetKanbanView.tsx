import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssetCardHeader } from "@/components/AssetCard";
import { DeadlineStatusBadge } from "@/components/DeadlineStatusBadge";
import { Building2, MapPin } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface AssetKanbanViewProps {
  assets: Asset[];
}

export const AssetKanbanView = ({ assets }: AssetKanbanViewProps) => {
  const navigate = useNavigate();

  const columns = [
    {
      id: "deposito_malta",
      title: "Depósito Malta",
      variant: "secondary" as const,
      assets: assets.filter((a) => a.location_type === "deposito_malta"),
    },
    {
      id: "em_manutencao",
      title: "Em Manutenção",
      variant: "destructive" as const,
      assets: assets.filter((a) => a.location_type === "em_manutencao"),
    },
    {
      id: "locacao",
      title: "Locação",
      variant: "default" as const,
      assets: assets.filter((a) => a.location_type === "locacao"),
    },
    {
      id: "aguardando_laudo",
      title: "Aguardando Laudo",
      variant: "warning" as const,
      assets: assets.filter((a) => a.location_type === "aguardando_laudo"),
    },
  ];

  const getLocationLabel = (locationType: string) => {
    switch (locationType) {
      case "deposito_malta":
        return "Depósito Malta";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => (
        <div key={column.id} className="space-y-3">
          <div className="sticky top-0 z-10 bg-background pb-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{column.title}</h3>
              <Badge variant={column.variant}>{column.assets.length}</Badge>
            </div>
            <div className="h-1 bg-muted rounded-full mt-2">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min((column.assets.length / assets.length) * 100, 100)}%` }}
              />
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {column.assets.length === 0 ? (
                <Card className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum equipamento
                </Card>
              ) : (
                column.assets.map((asset) => (
                  <Card
                    key={asset.id}
                    className="p-3 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] animate-fade-in"
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
                      <p className="text-xs text-muted-foreground mt-2">{asset.deposito_description}</p>
                    )}

                    {asset.location_type === "em_manutencao" && (
                      <div className="space-y-2 text-xs mt-2">
                        {asset.maintenance_arrival_date && (
                          <Badge variant="destructive" className="text-xs">
                            ⏱️ {differenceInDays(new Date(), parseISO(asset.maintenance_arrival_date + "T00:00:00"))} dias
                          </Badge>
                        )}
                        {asset.maintenance_company && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{asset.maintenance_company}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {asset.location_type === "locacao" && (
                      <div className="space-y-1 text-xs mt-2">
                        {asset.rental_company && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate">{asset.rental_company}</span>
                          </div>
                        )}
                        {asset.rental_work_site && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{asset.rental_work_site}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {asset.location_type === "aguardando_laudo" && asset.inspection_start_date && (
                      <div className="mt-2">
                        <DeadlineStatusBadge inspectionStartDate={asset.inspection_start_date} />
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ))}
    </div>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAssetsStats } from "@/hooks/useAssetsStats";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { Package, Wrench, Building2, BarChart3, Clock, FileText, AlertCircle } from "lucide-react";
import { parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function AssetsControlDashboard() {
  const { data: stats, isLoading } = useAssetsStats();
  const { data: assets = [] } = useAssetsQuery();
  const [detailsView, setDetailsView] = useState<'em_manutencao' | 'aguardando_laudo'>('em_manutencao');
  
  // Filtrar equipamentos em manutenção
  const assetsInMaintenance = assets.filter(
    (asset) => asset.location_type === "em_manutencao"
  );

  // Filtrar equipamentos aguardando laudo
  const assetsAwaitingReport = assets.filter(
    (asset) => asset.location_type === "aguardando_laudo"
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <p>Carregando...</p>
      </div>
    );
  }

  const cards = [
    {
      title: "Liberados para Locação",
      value: stats?.liberadosLocacao || 0,
      description: "Depósito Malta",
      icon: Package,
      variant: "default" as const,
    },
    {
      title: "Locados",
      value: stats?.locados || 0,
      description: "Em locação",
      icon: Building2,
      variant: "success" as const,
    },
    {
      title: "Em Manutenção",
      value: stats?.emManutencao || 0,
      description: "Em manutenção",
      icon: Wrench,
      variant: "warning" as const,
    },
    {
      title: "Total de Equipamentos",
      value: stats?.total || 0,
      description: "Total cadastrado",
      icon: BarChart3,
      variant: "secondary" as const,
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Controle de Patrimônio</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral dos equipamentos e seu status
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Seção de Equipamentos em Manutenção e Aguardando Laudo */}
      {(assetsInMaintenance.length > 0 || assetsAwaitingReport.length > 0) && (
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-destructive" />
                <CardTitle>
                  {detailsView === 'em_manutencao' 
                    ? 'Equipamentos em Manutenção - Detalhes'
                    : 'Equipamentos Aguardando Laudo - Detalhes'
                  }
                </CardTitle>
              </div>
              
              {/* Toggle para escolher visualização */}
              <div className="flex gap-2">
                <Button
                  variant={detailsView === 'em_manutencao' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDetailsView('em_manutencao')}
                  className="text-xs"
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  Manutenção ({assetsInMaintenance.length})
                </Button>
                <Button
                  variant={detailsView === 'aguardando_laudo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDetailsView('aguardando_laudo')}
                  className="text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  Aguardando Laudo ({assetsAwaitingReport.length})
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Lista de Equipamentos em Manutenção */}
            {detailsView === 'em_manutencao' && (
              assetsInMaintenance.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum equipamento em manutenção no momento
                </p>
              ) : (
                <div className="grid gap-3">
                  {assetsInMaintenance.map((asset) => {
                    let diffDays = 0;
                    let hasArrivalDate = false;
                    
                    if (asset.maintenance_arrival_date) {
                      const arrival = parseISO(asset.maintenance_arrival_date + "T00:00:00");
                      const today = new Date();
                      const diffTime = today.getTime() - arrival.getTime();
                      diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      hasArrivalDate = true;
                    }
                    
                    return (
                      <div
                        key={asset.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{asset.asset_code}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{asset.equipment_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {asset.maintenance_company || "Empresa não informada"} - {asset.maintenance_work_site || "Obra não informada"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Responsável: {asset.malta_collaborator || "Não informado"}
                          </div>
                        </div>
                        
                        {hasArrivalDate ? (
                          <Badge variant="destructive" className="font-semibold whitespace-nowrap">
                            ⏱️ {diffDays} {diffDays === 1 ? "dia" : "dias"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-semibold whitespace-nowrap flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            📅 Sem data de chegada
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              )
            )}
            
            {/* Lista de Equipamentos Aguardando Laudo */}
            {detailsView === 'aguardando_laudo' && (
              assetsAwaitingReport.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum equipamento aguardando laudo no momento
                </p>
              ) : (
                <div className="grid gap-3">
                  {assetsAwaitingReport.map((asset) => {
                    const BELEM_TIMEZONE = "America/Belem";
                    let diffDays = 0;
                    let isOverdue = false;
                    let hasInspectionDate = false;
                    
                    if (asset.inspection_start_date) {
                      // Converter para o timezone de Belém - PA
                      const inspection = toZonedTime(parseISO(asset.inspection_start_date), BELEM_TIMEZONE);
                      const today = toZonedTime(new Date(), BELEM_TIMEZONE);
                      const diffTime = today.getTime() - inspection.getTime();
                      diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                      // Prazo de 6 dias para devolução do laudo
                      isOverdue = diffDays > 6;
                      hasInspectionDate = true;
                    }
                    
                    return (
                      <div
                        key={asset.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{asset.asset_code}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{asset.equipment_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {asset.maintenance_company || "Empresa não informada"} - {asset.maintenance_work_site || "Obra não informada"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Responsável: {asset.malta_collaborator || "Não informado"}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {hasInspectionDate ? (
                            <>
                              <Badge 
                                variant={isOverdue ? "destructive" : "default"} 
                                className="font-semibold whitespace-nowrap flex items-center gap-1"
                              >
                                {isOverdue ? (
                                  <>
                                    <AlertCircle className="h-3 w-3" />
                                    ATRASADO
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3" />
                                    NO PRAZO
                                  </>
                                )}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {diffDays} {diffDays === 1 ? "dia" : "dias"} aguardando
                              </span>
                            </>
                          ) : (
                            <Badge variant="secondary" className="font-semibold whitespace-nowrap">
                              📋 Aguardando registro
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

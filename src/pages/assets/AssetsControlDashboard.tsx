import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAssetsStats } from "@/hooks/useAssetsStats";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { Package, Wrench, Building2, BarChart3, Clock } from "lucide-react";
import { parseISO } from "date-fns";

export default function AssetsControlDashboard() {
  const { data: stats, isLoading } = useAssetsStats();
  const { data: assets = [] } = useAssetsQuery();
  
  // Filtrar equipamentos em manutenção
  const assetsInMaintenance = assets.filter(
    (asset) => asset.location_type === "em_manutencao" && asset.maintenance_arrival_date
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

      {/* Seção de Equipamentos em Manutenção com Dias */}
      {assetsInMaintenance.length > 0 && (
        <Card className="mt-6 border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-destructive" />
              <CardTitle>Equipamentos em Manutenção - Detalhes</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {assetsInMaintenance.map((asset) => {
                const arrival = parseISO(asset.maintenance_arrival_date + "T00:00:00");
                const today = new Date();
                const diffTime = today.getTime() - arrival.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                
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
                        {asset.maintenance_company} - {asset.maintenance_work_site}
                      </div>
                    </div>
                    <Badge variant="destructive" className="font-semibold whitespace-nowrap">
                      ⏱️ {diffDays} {diffDays === 1 ? "dia" : "dias"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

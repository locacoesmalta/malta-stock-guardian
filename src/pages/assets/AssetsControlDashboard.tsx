import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssetsStats } from "@/hooks/useAssetsStats";
import { Package, Wrench, Building2, BarChart3 } from "lucide-react";

export default function AssetsControlDashboard() {
  const { data: stats, isLoading } = useAssetsStats();

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
    </div>
  );
}

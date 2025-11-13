import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Package, Wrench, Building2, FileText } from "lucide-react";

interface AssetStatusBarProps {
  statusCounts: {
    deposito_malta: number;
    em_manutencao: number;
    locacao: number;
    aguardando_laudo: number;
  };
  activeFilter: string | null;
  onFilterChange: (status: string | null) => void;
}

export const AssetStatusBar = ({
  statusCounts,
  activeFilter,
  onFilterChange,
}: AssetStatusBarProps) => {
  const statusOptions = [
    {
      key: "deposito_malta",
      label: "Depósito Malta",
      icon: Package,
      count: statusCounts.deposito_malta,
      variant: "secondary" as const,
      color: "bg-secondary/10 hover:bg-secondary/20 border-secondary",
    },
    {
      key: "em_manutencao",
      label: "Em Manutenção",
      icon: Wrench,
      count: statusCounts.em_manutencao,
      variant: "destructive" as const,
      color: "bg-destructive/10 hover:bg-destructive/20 border-destructive",
    },
    {
      key: "locacao",
      label: "Locação",
      icon: Building2,
      count: statusCounts.locacao,
      variant: "default" as const,
      color: "bg-primary/10 hover:bg-primary/20 border-primary",
    },
    {
      key: "aguardando_laudo",
      label: "Aguardando Laudo",
      icon: FileText,
      count: statusCounts.aguardando_laudo,
      variant: "warning" as const,
      color: "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500",
    },
  ];

  const totalAssets = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Status dos Equipamentos ({totalAssets} total)
        </h2>
        {activeFilter && (
          <button
            onClick={() => onFilterChange(null)}
            className="text-xs text-primary hover:underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statusOptions.map(({ key, label, icon: Icon, count, variant, color }) => (
          <Card
            key={key}
            className={cn(
              "p-4 cursor-pointer transition-all duration-200 border-2",
              color,
              activeFilter === key && "ring-2 ring-primary shadow-lg scale-105"
            )}
            onClick={() => onFilterChange(activeFilter === key ? null : key)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <Badge variant={variant} className="mt-2 text-xs">
                  {((count / totalAssets) * 100).toFixed(0)}% do total
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

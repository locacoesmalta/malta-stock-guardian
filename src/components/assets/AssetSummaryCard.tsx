import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, Wrench, Building2, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

interface AssetSummaryCardProps {
  statusCounts: {
    deposito_malta: number;
    em_manutencao: number;
    locacao: number;
    aguardando_laudo: number;
  };
  urgentCount: number;
  averageMaintenanceDays: number;
  rentalPercentage: number;
}

export const AssetSummaryCard = ({
  statusCounts,
  urgentCount,
  averageMaintenanceDays,
  rentalPercentage,
}: AssetSummaryCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalAssets = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="mb-6">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                📊 Resumo Rápido
                <Badge variant="outline">{totalAssets} equipamentos</Badge>
              </CardTitle>
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-200 ${
                  isOpen ? "transform rotate-180" : ""
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/10">
                <Package className="h-5 w-5 text-secondary-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{statusCounts.deposito_malta}</p>
                  <p className="text-xs text-muted-foreground">no Depósito Malta</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10">
                <Wrench className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{statusCounts.em_manutencao}</p>
                  <p className="text-xs text-muted-foreground">
                    Em Manutenção (média {averageMaintenanceDays} dias)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{statusCounts.locacao}</p>
                  <p className="text-xs text-muted-foreground">
                    Locados ({rentalPercentage.toFixed(0)}% da frota ativa)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10">
                <FileText className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{statusCounts.aguardando_laudo}</p>
                  <p className="text-xs text-muted-foreground">
                    Aguardando Laudo {urgentCount > 0 && `(${urgentCount} atrasados)`}
                  </p>
                </div>
              </div>
            </div>

            {urgentCount > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <p className="text-sm font-medium text-destructive">
                    {urgentCount} equipamento{urgentCount > 1 ? "s" : ""} necessitando atenção
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

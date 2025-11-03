import { useAssetMaintenances } from "@/hooks/useAssetMaintenances";
import { AssetMaintenanceForm } from "./AssetMaintenanceForm";
import { MaintenanceCard } from "./MaintenanceCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, TrendingUp } from "lucide-react";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssetMaintenanceSectionProps {
  assetId: string;
  assetCode: string;
}

export function AssetMaintenanceSection({
  assetId,
  assetCode,
}: AssetMaintenanceSectionProps) {
  const {
    maintenances,
    isLoading,
    createMaintenance,
    deleteMaintenance,
    totalHourmeter,
  } = useAssetMaintenances(assetId);

  const lastMaintenance = maintenances[0];
  const lastHourmeter = lastMaintenance?.current_hourmeter || 0;

  const preventiveCount = maintenances.filter(
    (m) => m.maintenance_type === "preventiva"
  ).length;
  const correctiveCount = maintenances.filter(
    (m) => m.maintenance_type === "corretiva"
  ).length;

  const totalCost = maintenances.reduce((sum, m) => sum + (m.total_cost || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Carregando manutenções...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Manutenções
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{maintenances.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Horímetro Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatHourmeter(totalHourmeter)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preventivas / Corretivas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {preventiveCount} / {correctiveCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Custo Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Botão de nova manutenção */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Histórico de Manutenções
        </h3>
        <AssetMaintenanceForm
          assetId={assetId}
          lastHourmeter={lastHourmeter}
          onSubmit={(data) => createMaintenance.mutate(data)}
          isLoading={createMaintenance.isPending}
        />
      </div>

      {/* Lista de manutenções */}
      {maintenances.length === 0 ? (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            Nenhuma manutenção registrada para este equipamento. Clique em "Nova
            Manutenção" para começar.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {maintenances.map((maintenance) => (
            <MaintenanceCard
              key={maintenance.id}
              maintenance={maintenance}
              onDelete={(id) => deleteMaintenance.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

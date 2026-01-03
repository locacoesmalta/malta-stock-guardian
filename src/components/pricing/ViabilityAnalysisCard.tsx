import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PATSearchInput, AssetForPricing } from "./PATSearchInput";
import { useMaintenanceHistoryByPAT } from "@/hooks/usePricingByPAT";
import { AlertTriangle, CheckCircle, XCircle, Wrench, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Limiares configuráveis para análise de viabilidade
const VIABILITY_THRESHOLDS = {
  attention: 30,  // Acima de 30% = Atenção
  critical: 50,   // Acima de 50% = Crítico
};

type ViabilityStatus = 'saudavel' | 'atencao' | 'critico';

export const ViabilityAnalysisCard = () => {
  const [selectedAsset, setSelectedAsset] = useState<AssetForPricing | null>(null);
  const { data: maintenanceHistory, isLoading } = useMaintenanceHistoryByPAT(
    selectedAsset?.asset_code || ""
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Estado inicial - sem equipamento selecionado
  if (!selectedAsset) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Viabilidade de Equipamento</CardTitle>
          <CardDescription>
            Busque um equipamento pelo PAT para analisar se vale a pena reparar ou substituir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PATSearchInput onAssetSelect={setSelectedAsset} />
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Viabilidade de Equipamento</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando histórico de manutenções...</span>
        </CardContent>
      </Card>
    );
  }

  // Calcular estatísticas
  const totalMaintenanceCost = maintenanceHistory?.reduce(
    (sum, m) => sum + (m.total_cost || 0), 0
  ) || 0;
  const assetValue = selectedAsset.unit_value || 0;
  const maintenancePercentage = assetValue > 0 
    ? (totalMaintenanceCost / assetValue) * 100 
    : 0;
  
  const recurringProblems = maintenanceHistory?.filter(m => m.is_recurring_problem).length || 0;
  const correctiveMaintenances = maintenanceHistory?.filter(m => m.maintenance_type === 'corretiva').length || 0;
  const totalMaintenances = maintenanceHistory?.length || 0;
  const averageCost = totalMaintenances > 0 ? totalMaintenanceCost / totalMaintenances : 0;

  // Determinar status
  let status: ViabilityStatus = 'saudavel';
  let statusColor = 'text-green-600';
  let statusIcon = <CheckCircle className="h-5 w-5" />;
  let recommendation = '';
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  if (maintenancePercentage >= VIABILITY_THRESHOLDS.critical) {
    status = 'critico';
    statusColor = 'text-destructive';
    statusIcon = <XCircle className="h-5 w-5" />;
    badgeVariant = 'destructive';
    recommendation = 'RECOMENDAÇÃO: Considere SUBSTITUIR o equipamento. O custo de manutenção já ultrapassou 50% do valor de aquisição.';
  } else if (maintenancePercentage >= VIABILITY_THRESHOLDS.attention) {
    status = 'atencao';
    statusColor = 'text-yellow-600';
    statusIcon = <AlertTriangle className="h-5 w-5" />;
    badgeVariant = 'outline';
    recommendation = 'ATENÇÃO: Monitore de perto. O custo de manutenção está se aproximando do limite recomendado.';
  } else {
    recommendation = 'Equipamento saudável. Continue com a manutenção preventiva regular.';
  }

  return (
    <div className="space-y-6">
      {/* Busca por PAT */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Viabilidade de Equipamento</CardTitle>
          <CardDescription>
            Busque outro equipamento ou visualize a análise abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PATSearchInput 
            onAssetSelect={setSelectedAsset} 
            initialValue={selectedAsset.asset_code}
          />
        </CardContent>
      </Card>

      {/* Header do Equipamento */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{selectedAsset.equipment_name}</CardTitle>
              <CardDescription>
                PAT: {selectedAsset.asset_code} | {selectedAsset.manufacturer} {selectedAsset.model && `• ${selectedAsset.model}`}
              </CardDescription>
            </div>
            <Badge 
              variant={badgeVariant}
              className={status === 'atencao' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
            >
              {status === 'critico' ? 'Crítico' : status === 'atencao' ? 'Atenção' : 'Saudável'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Valores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor de Aquisição</p>
              <p className="text-2xl font-bold">{formatCurrency(assetValue)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total em Manutenções</p>
              <p className={`text-2xl font-bold ${statusColor}`}>{formatCurrency(totalMaintenanceCost)}</p>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Custo de Manutenção vs. Valor do Equipamento</span>
              <span className={`text-sm font-bold ${statusColor}`}>
                {maintenancePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(maintenancePercentage, 100)} 
              className={`h-3 ${status === 'critico' ? '[&>div]:bg-destructive' : status === 'atencao' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-green-500'}`}
            />
            <p className="text-xs text-muted-foreground">
              Limite recomendado: {VIABILITY_THRESHOLDS.critical}% | Atenção a partir de {VIABILITY_THRESHOLDS.attention}%
            </p>
          </div>

          {/* Recomendação */}
          <Alert variant={status === 'critico' ? 'destructive' : 'default'} className={status === 'atencao' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}>
            <div className={`flex items-start gap-2 ${statusColor}`}>
              {statusIcon}
              <AlertDescription className={statusColor}>
                {recommendation}
              </AlertDescription>
            </div>
          </Alert>
        </CardContent>
      </Card>

      {/* Estatísticas de Manutenção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Estatísticas de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total de Manutenções</p>
              <p className="text-2xl font-bold">{totalMaintenances}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Manutenções Corretivas</p>
              <p className="text-2xl font-bold text-orange-600">{correctiveMaintenances}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Problemas Recorrentes</p>
              <p className="text-2xl font-bold text-red-600">{recurringProblems}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Custo Médio</p>
              <p className="text-xl font-bold">{formatCurrency(averageCost)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Manutenções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Histórico de Manutenções
          </CardTitle>
        </CardHeader>
        <CardContent>
          {maintenanceHistory && maintenanceHistory.length > 0 ? (
            <div className="space-y-4">
              {maintenanceHistory.map((maintenance, index) => (
                <div key={maintenance.id || index}>
                  <div className="p-4 border rounded-lg space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={maintenance.maintenance_type === 'corretiva' ? 'destructive' : 'default'}>
                          {maintenance.maintenance_type}
                        </Badge>
                        {maintenance.is_recurring_problem && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Problema Recorrente ({maintenance.recurrence_count}x)
                          </Badge>
                        )}
                        {maintenance.is_client_misuse && (
                          <Badge variant="outline" className="text-red-600 border-red-300">
                            Mal uso do cliente
                          </Badge>
                        )}
                      </div>
                      <span className="font-bold">{formatCurrency(maintenance.total_cost || 0)}</span>
                    </div>
                    
                    {maintenance.problem_description && (
                      <p className="text-sm">{maintenance.problem_description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Data: {new Date(maintenance.maintenance_date).toLocaleDateString('pt-BR')}</span>
                      <span>Peças: {formatCurrency(maintenance.parts_cost || 0)}</span>
                      <span>Mão de obra: {formatCurrency(maintenance.labor_cost || 0)}</span>
                    </div>
                    
                    {maintenance.observations && (
                      <p className="text-xs text-muted-foreground italic">Obs: {maintenance.observations}</p>
                    )}
                  </div>
                  {index < maintenanceHistory.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma manutenção registrada para este equipamento
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

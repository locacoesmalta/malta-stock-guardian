import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRentalEquipmentHistory, type RentalEquipmentHistory } from "@/hooks/useRentalEquipmentHistory";
import { useRentalEquipment, type RentalEquipment } from "@/hooks/useRentalEquipment";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RefreshCw, Package, PackageCheck, AlertCircle, ArrowRight, Calendar, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ContractHistoryTabProps {
  companyId: string;
}

const statusLabels: Record<string, string> = {
  aguardando_laudo: "Aguardando Laudo",
  em_manutencao: "Em Manutenção",
  deposito_malta: "Depósito Malta",
  locacao: "Em Locação",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  aguardando_laudo: "secondary",
  em_manutencao: "destructive",
  deposito_malta: "default",
  locacao: "outline",
};

export function ContractHistoryTab({ companyId }: ContractHistoryTabProps) {
  const { data: history = [], isLoading: historyLoading } = useRentalEquipmentHistory(companyId);
  const { data: currentEquipment = [], isLoading: equipmentLoading } = useRentalEquipment(companyId);

  if (historyLoading || equipmentLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Equipamentos ativos (sem return_date)
  const activeEquipment = currentEquipment.filter(eq => !eq.return_date);
  
  // Equipamentos devolvidos
  const returnedEquipment = currentEquipment.filter(eq => eq.return_date);
  
  // Substituições do histórico
  const substitutions = history.filter(h => h.event_type === 'SUBSTITUTION');
  
  // Equipamentos antigos ainda em processo (sem association_end_date)
  const pendingOldEquipment = history.filter(
    h => h.event_type === 'SUBSTITUTION' && !h.association_end_date
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(parseISO(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const calculateDaysInContract = (startDate: string, endDate: string | null) => {
    const start = parseISO(startDate);
    const end = endDate ? parseISO(endDate) : new Date();
    return differenceInDays(end, start) + 1;
  };

  return (
    <div className="space-y-6">
      {/* Equipamentos Ativos */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Equipamentos Ativos
            <Badge variant="outline" className="ml-2">{activeEquipment.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeEquipment.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum equipamento ativo no momento.</p>
          ) : (
            <div className="space-y-3">
              {activeEquipment.map((eq) => {
                // Verificar se este equipamento é um substituto
                const isSubstitute = history.find(
                  h => h.substitute_asset_code === eq.asset_code && h.event_type === 'SUBSTITUTION'
                );
                
                return (
                  <div key={eq.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{eq.asset_code || "S/PAT"}</Badge>
                          <span className="font-medium">{eq.equipment_name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Locação: {formatDate(eq.pickup_date)}
                          </span>
                          {eq.work_site && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {eq.work_site}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-600">Ativo</Badge>
                    </div>
                    
                    {isSubstitute && (
                      <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950 rounded border border-amber-200 dark:border-amber-800">
                        <span className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-300">
                          <RefreshCw className="h-3.5 w-3.5" />
                          Substituiu PAT {isSubstitute.original_asset_code} em {formatDate(isSubstitute.substitution_date)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Substituições Realizadas */}
      {substitutions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <RefreshCw className="h-5 w-5 text-amber-500" />
              Substituições Realizadas
              <Badge variant="secondary" className="ml-2">{substitutions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {substitutions.map((sub) => {
                const daysInContract = calculateDaysInContract(
                  sub.original_pickup_date,
                  sub.substitution_date
                );
                
                return (
                  <div key={sub.id} className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{sub.original_asset_code}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                        {sub.substitute_asset_code}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        em {formatDate(sub.substitution_date)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Equipamento antigo:</span>
                        <p className="font-medium">{sub.original_equipment_name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Novo equipamento:</span>
                        <p className="font-medium">{sub.substitute_equipment_name}</p>
                      </div>
                    </div>
                    
                    {sub.substitution_reason && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Motivo:</span>
                        <p>{sub.substitution_reason}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-3 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        📅 Período no contrato: {formatDate(sub.original_pickup_date)} - {formatDate(sub.substitution_date)} ({daysInContract} dias)
                      </span>
                      <Badge variant={statusVariants[sub.current_status || 'aguardando_laudo']}>
                        {statusLabels[sub.current_status || 'aguardando_laudo']}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipamentos Antigos em Processo */}
      {pendingOldEquipment.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Equipamentos Substituídos em Processo
              <Badge variant="secondary" className="ml-2">{pendingOldEquipment.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Equipamentos que foram substituídos mas ainda não retornaram ao Depósito Malta.
            </p>
            <div className="space-y-3">
              {pendingOldEquipment.map((eq) => (
                <div key={eq.id} className="p-3 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{eq.original_asset_code}</Badge>
                        <span className="font-medium">{eq.original_equipment_name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Substituído por {eq.substitute_asset_code} em {formatDate(eq.substitution_date)}
                      </p>
                    </div>
                    <Badge variant={statusVariants[eq.current_status || 'aguardando_laudo']}>
                      {statusLabels[eq.current_status || 'aguardando_laudo']}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipamentos Devolvidos */}
      {returnedEquipment.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PackageCheck className="h-5 w-5 text-muted-foreground" />
              Equipamentos Devolvidos
              <Badge variant="outline" className="ml-2">{returnedEquipment.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {returnedEquipment.map((eq) => {
                const daysInContract = calculateDaysInContract(eq.pickup_date, eq.return_date);
                
                return (
                  <div key={eq.id} className="p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{eq.asset_code || "S/PAT"}</Badge>
                          <span className="font-medium text-muted-foreground">{eq.equipment_name}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            📅 {formatDate(eq.pickup_date)} - {formatDate(eq.return_date)} ({daysInContract} dias)
                          </span>
                          {eq.work_site && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {eq.work_site}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary">Devolvido</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo do Contrato */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📊 Resumo do Contrato</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-primary">{activeEquipment.length}</p>
              <p className="text-sm text-muted-foreground">Ativos</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-amber-500">{substitutions.length}</p>
              <p className="text-sm text-muted-foreground">Substituições</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold text-muted-foreground">{returnedEquipment.length}</p>
              <p className="text-sm text-muted-foreground">Devolvidos</p>
            </div>
            <div className="text-center p-3 bg-background rounded-lg">
              <p className="text-2xl font-bold">
                {activeEquipment.length + returnedEquipment.length + substitutions.length}
              </p>
              <p className="text-sm text-muted-foreground">Total Histórico</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePatrimonioHistorico } from "@/hooks/usePatrimonioHistorico";
import { useAssetLifecycle } from "@/hooks/useAssetLifecycle";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, Clock, MapPin, Calendar, Database } from "lucide-react";

interface AssetLifeCyclesSectionProps {
  assetId: string;
}

interface LifeCycle {
  cycleNumber: number;
  startDate: string;
  endDate: string | null;
  location: string;
  company?: string;
  workSite?: string;
  events: any[];
  totalDays: number;
  reason?: string;
  isArchived?: boolean;
  archivedWithdrawalsCount?: number;
}

export const AssetLifeCyclesSection = ({ assetId }: AssetLifeCyclesSectionProps) => {
  const { data: historico, isLoading: historicoLoading } = usePatrimonioHistorico(assetId);
  const { getAssetLifecycles } = useAssetLifecycle();
  const [savedCycles, setSavedCycles] = useState<any[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);

  // Buscar ciclos salvos na tabela asset_lifecycle_history
  useEffect(() => {
    const fetchSavedCycles = async () => {
      setCyclesLoading(true);
      const cycles = await getAssetLifecycles(assetId);
      setSavedCycles(cycles);
      setCyclesLoading(false);
    };

    if (assetId) {
      fetchSavedCycles();
    }
  }, [assetId]);

  // Agrupar eventos por ciclos de vida (método legado para dados antigos)
  const lifeCycles: LifeCycle[] = [];
  let currentCycle: Partial<LifeCycle> | null = null;
  let cycleCounter = 0;

  // 1️⃣ PRIORIZAR CICLOS SALVOS (novos dados)
  if (savedCycles.length > 0) {
    savedCycles.forEach((savedCycle) => {
      // Filtrar eventos do histórico que pertencem a este ciclo
      const cycleEvents = historico?.filter((event) => {
        const eventDate = new Date(event.data_modificacao);
        const cycleStart = new Date(savedCycle.cycle_started_at);
        const cycleEnd = savedCycle.cycle_closed_at ? new Date(savedCycle.cycle_closed_at) : new Date();
        
        return eventDate >= cycleStart && eventDate <= cycleEnd;
      }) || [];

      // Extrair informações do reason (empresa, obra, etc.)
      const reasonMatch = savedCycle.reason?.match(/Cliente: ([^,]+), Obra: ([^,]+)/);
      const company = reasonMatch?.[1] || savedCycle.reason?.match(/Empresa: ([^|]+)/)?.[1]?.trim();
      const workSite = reasonMatch?.[2] || savedCycle.reason?.match(/Obra: ([^|]+)/)?.[1]?.trim();

      lifeCycles.push({
        cycleNumber: savedCycle.cycle_number,
        startDate: savedCycle.cycle_started_at,
        endDate: savedCycle.cycle_closed_at,
        location: "archived",
        company,
        workSite,
        events: cycleEvents,
        totalDays: differenceInDays(
          savedCycle.cycle_closed_at ? new Date(savedCycle.cycle_closed_at) : new Date(),
          new Date(savedCycle.cycle_started_at)
        ),
        reason: savedCycle.reason,
        isArchived: true,
        archivedWithdrawalsCount: savedCycle.archived_withdrawals_count || 0,
      });
    });

    // Encontrar o maior cycle_number dos ciclos salvos
    const maxSavedCycle = Math.max(...savedCycles.map(c => c.cycle_number), 0);
    cycleCounter = maxSavedCycle;
  }

  // 2️⃣ PROCESSAR EVENTOS LEGADOS (dados antigos sem registros na tabela de ciclos)
  historico?.forEach((event) => {
    // Detectar INÍCIO de ciclo: saída do depósito
    if (
      event.tipo_evento === "ALTERAÇÃO DE DADO" &&
      event.campo_alterado === "Local do Equipamento" &&
      event.valor_antigo === "deposito_malta" &&
      event.valor_novo !== "deposito_malta"
    ) {
      // Finalizar ciclo anterior se houver
      if (currentCycle && currentCycle.events && currentCycle.events.length > 0) {
        lifeCycles.push(currentCycle as LifeCycle);
      }

      // Iniciar novo ciclo
      cycleCounter++;
      currentCycle = {
        cycleNumber: cycleCounter,
        startDate: event.data_modificacao,
        endDate: null,
        location: event.valor_novo || "",
        events: [event],
        totalDays: 0,
      };
    }
    // Detectar FIM de ciclo: retorno ao depósito
    else if (
      event.tipo_evento === "ALTERAÇÃO DE DADO" &&
      event.campo_alterado === "Local do Equipamento" &&
      event.valor_novo === "deposito_malta" &&
      currentCycle
    ) {
      currentCycle.endDate = event.data_modificacao;
      currentCycle.totalDays = differenceInDays(
        new Date(event.data_modificacao),
        new Date(currentCycle.startDate!)
      );
      currentCycle.events!.push(event);
      lifeCycles.push(currentCycle as LifeCycle);
      currentCycle = null;
    }
    // Adicionar evento ao ciclo atual
    else if (currentCycle) {
      currentCycle.events!.push(event);

      // Extrair empresa e obra do evento
      if (event.campo_alterado === "Empresa de Locação") {
        currentCycle.company = event.valor_novo || undefined;
      }
      if (event.campo_alterado === "Obra de Locação") {
        currentCycle.workSite = event.valor_novo || undefined;
      }
    }
  });

  // Se há ciclo aberto, adicionar como último
  if (currentCycle && currentCycle.events && currentCycle.events.length > 0) {
    currentCycle.totalDays = differenceInDays(
      new Date(),
      new Date(currentCycle.startDate!)
    );
    lifeCycles.push(currentCycle as LifeCycle);
  }

  const isLoading = historicoLoading || cyclesLoading;

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5 animate-pulse" />
          <p>Carregando ciclos de vida...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Ciclos de Vida do Equipamento
      </h2>

      {lifeCycles.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm sm:text-base">
            Nenhum ciclo de locação registrado para este equipamento.
          </p>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            Os ciclos são criados quando o equipamento sai do Depósito Malta.
          </p>
        </div>
      ) : (
        <Tabs defaultValue={`cycle-${lifeCycles.length}`} className="w-full">
          <TabsList className="w-full grid grid-flow-col auto-cols-fr overflow-x-auto">
            {lifeCycles.reverse().map((cycle) => (
              <TabsTrigger 
                key={cycle.cycleNumber} 
                value={`cycle-${cycle.cycleNumber}`}
                className="flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap"
              >
                Ciclo {cycle.cycleNumber}
                {!cycle.endDate && (
                  <Badge variant="default" className="ml-1 text-[10px] sm:text-xs px-1 py-0">
                    ATIVO
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {lifeCycles.map((cycle) => (
            <TabsContent key={cycle.cycleNumber} value={`cycle-${cycle.cycleNumber}`}>
              <div className="space-y-4">
                {/* Cabeçalho do Ciclo */}
                <div className="space-y-3">
                  {cycle.isArchived && (
                    <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-md">
                      <Database className="h-4 w-4 text-blue-500" />
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                        Ciclo arquivado automaticamente pelo sistema
                      </p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 bg-muted/50 rounded-lg border">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Período
                      </p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {format(new Date(cycle.startDate), "dd/MM/yyyy", { locale: ptBR })}
                        {" → "}
                        {cycle.endDate
                          ? format(new Date(cycle.endDate), "dd/MM/yyyy", { locale: ptBR })
                          : "Em andamento"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Duração
                      </p>
                      <p className="font-medium text-sm sm:text-base mt-1">
                        {cycle.totalDays} dia{cycle.totalDays !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {cycle.company && (
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Empresa / Obra
                        </p>
                        <p className="font-medium text-sm sm:text-base mt-1">
                          {cycle.company}
                          {cycle.workSite && ` - ${cycle.workSite}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {cycle.reason && (
                    <div className="p-3 bg-muted/30 rounded-md border">
                      <p className="text-xs text-muted-foreground mb-1">Detalhes do Encerramento</p>
                      <p className="text-sm">{cycle.reason}</p>
                    </div>
                  )}
                </div>

                {/* Linha do Tempo do Ciclo */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">
                    Histórico de Eventos ({cycle.events.length})
                  </h3>
                  {cycle.events.map((event, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <div className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                        {format(new Date(event.data_modificacao), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">
                            {event.tipo_evento}
                          </Badge>
                          {event.tipo_evento === "RETIRADA DE MATERIAL" && (
                            <Badge variant="secondary" className="text-[10px] sm:text-xs">
                              Material
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm mt-1">
                          {event.detalhes_evento || (
                            event.campo_alterado && (
                              <>
                                <span className="font-medium">{event.campo_alterado}:</span>{" "}
                                <span className="text-muted-foreground">{event.valor_antigo || "-"}</span>
                                {" → "}
                                <span>{event.valor_novo || "-"}</span>
                              </>
                            )
                          )}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs whitespace-nowrap">
                        {event.usuario_nome || "Sistema"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePatrimonioHistorico } from "@/hooks/usePatrimonioHistorico";
import { History, Loader2, Clock, User } from "lucide-react";
import { 
  groupHistoryEvents, 
  formatDateBR, 
  formatDateOnlyBR,
  shouldHideField,
  translateFieldName,
  translateLocation
} from "@/lib/historyTranslation";

interface AssetHistorySectionProps {
  assetId: string;
}

export const AssetHistorySection = ({ assetId }: AssetHistorySectionProps) => {
  const { data: historico, isLoading } = usePatrimonioHistorico(assetId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma alteração registrada para este patrimônio
          </p>
        </div>
      </Card>
    );
  }

  const groupedEvents = groupHistoryEvents(historico);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        Linha do Tempo do Ativo
      </h2>
      
      <div className="space-y-4">
        {groupedEvents.map((event) => (
          <div 
            key={event.id} 
            className="relative pl-8 pb-4 border-l-2 border-muted last:border-l-0 last:pb-0"
          >
            {/* Indicador na timeline */}
            <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-xs">
              <span className="text-primary-foreground">{event.emoji}</span>
            </div>

            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-2">
                {/* Cabeçalho com descrição principal */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-lg flex items-center gap-2">
                      <span>{event.emoji}</span>
                      <span>{event.friendlyDescription}</span>
                    </p>
                    
                    {/* Detalhes de empresa/obra se disponíveis */}
                    {(event.details.company || event.details.workSite) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.details.company}
                        {event.details.company && event.details.workSite && " - "}
                        {event.details.workSite}
                      </p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1">
                    {event.isRetroactive && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700 text-xs">
                        Retroativo
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      {event.type}
                    </Badge>
                  </div>
                </div>

                {/* Informações de data e usuário */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateBR(event.timestamp)}</span>
                  </div>
                  
                  {event.realDate && event.realDate !== event.timestamp.split('T')[0] && (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Data real: {formatDateOnlyBR(event.realDate)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    <span>{event.user}</span>
                  </div>
                </div>

                {/* Detalhes expandidos (apenas campos relevantes) */}
                {event.rawEvents.length > 1 && (
                  <details className="mt-3">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      Ver detalhes ({event.rawEvents.length} alterações)
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-muted space-y-1">
                      {event.rawEvents
                        .filter(e => !shouldHideField(e.campo_alterado))
                        .map((rawEvent) => (
                          <div key={rawEvent.historico_id} className="text-sm">
                            {rawEvent.campo_alterado && (
                              <span className="text-muted-foreground">
                                <strong>{translateFieldName(rawEvent.campo_alterado)}:</strong>{" "}
                                {rawEvent.campo_alterado?.includes("location") || rawEvent.campo_alterado === "Local do Equipamento" ? (
                                  <>
                                    <span className="line-through">{translateLocation(rawEvent.valor_antigo)}</span>
                                    {" → "}
                                    <span className="font-medium text-foreground">{translateLocation(rawEvent.valor_novo)}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="line-through">{rawEvent.valor_antigo || "-"}</span>
                                    {" → "}
                                    <span className="font-medium text-foreground">{rawEvent.valor_novo || "-"}</span>
                                  </>
                                )}
                              </span>
                            )}
                            {rawEvent.detalhes_evento && !rawEvent.campo_alterado && (
                              <span className="text-muted-foreground">{rawEvent.detalhes_evento}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </details>
                )}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Card>
  );
};

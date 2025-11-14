import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RLSError {
  log_count: number;
  error_type: string;
  last_occurrence: string;
}

export const RLSHealthMonitor = () => {
  // Query para buscar erros de RLS nas últimas 24h
  const { data: rlsErrors, isLoading } = useQuery({
    queryKey: ["rls-health-check"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("error_type, error_message, created_at")
        .or("error_message.ilike.%row-level security%,error_message.ilike.%RLS%,error_message.ilike.%permission denied%")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Agrupar erros por tipo
      const grouped = data.reduce((acc: Record<string, RLSError>, log) => {
        const key = log.error_type || "unknown";
        if (!acc[key]) {
          acc[key] = {
            log_count: 0,
            error_type: key,
            last_occurrence: log.created_at,
          };
        }
        acc[key].log_count++;
        return acc;
      }, {});

      return Object.values(grouped);
    },
    refetchInterval: 60000, // Atualizar a cada minuto
  });

  const totalErrors = rlsErrors?.reduce((sum, e) => sum + e.log_count, 0) || 0;
  const isHealthy = totalErrors < 10; // Threshold: menos de 10 erros/24h é saudável

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Monitoramento de Segurança RLS
          </CardTitle>
          <CardDescription>Carregando dados de saúde...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-20 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isHealthy ? (
            <ShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-destructive" />
          )}
          Monitoramento de Segurança RLS
        </CardTitle>
        <CardDescription>
          Erros de Row Level Security nas últimas 24 horas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Status do Sistema</p>
            <p className="text-2xl font-bold">
              {isHealthy ? "Saudável" : "Atenção Necessária"}
            </p>
          </div>
          <Badge variant={isHealthy ? "default" : "destructive"}>
            {totalErrors} erros/24h
          </Badge>
        </div>

        {/* Alertas */}
        {!isHealthy && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alto volume de erros RLS detectado</AlertTitle>
            <AlertDescription>
              O sistema detectou {totalErrors} erros de Row Level Security nas últimas 24 horas.
              Isso pode indicar problemas de permissões ou configuração incorreta de políticas RLS.
            </AlertDescription>
          </Alert>
        )}

        {/* Lista de Erros por Tipo */}
        {rlsErrors && rlsErrors.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Erros por Tipo:</p>
            {rlsErrors.map((error, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium text-sm">{error.error_type}</p>
                  <p className="text-xs text-muted-foreground">
                    Última ocorrência: {new Date(error.last_occurrence).toLocaleString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline">{error.log_count}x</Badge>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Nenhum erro detectado</AlertTitle>
            <AlertDescription>
              Não foram encontrados erros de RLS nas últimas 24 horas. Sistema operando normalmente.
            </AlertDescription>
          </Alert>
        )}

        {/* Recomendações */}
        <div className="p-4 border rounded-lg bg-muted/30">
          <p className="text-sm font-medium mb-2">💡 Recomendações:</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
            <li>Erros RLS indicam tentativas de acesso não autorizado</li>
            <li>Revise as permissões de usuários com erros recorrentes</li>
            <li>Verifique se as políticas RLS estão configuradas corretamente</li>
            <li>Considere ajustar permissões em user_permissions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

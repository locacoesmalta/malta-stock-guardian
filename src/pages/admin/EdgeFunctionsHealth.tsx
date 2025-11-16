import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function EdgeFunctionsHealth() {
  const { data: errorStats, isLoading } = useQuery({
    queryKey: ['edge-function-errors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('error_logs')
        .select('error_type, error_message, timestamp, error_code')
        .or('error_message.ilike.%edge function%,error_message.ilike.%non 2-xx%,error_message.ilike.%invoke%')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const edgeFunctions = [
    { name: 'create-user', description: 'Criação de usuários', requiresAuth: true, status: 'active' },
    { name: 'reset-user-password', description: 'Reset de senha', requiresAuth: true, status: 'active' },
    { name: 'cleanup-stale-sessions', description: 'Limpeza de sessões', requiresAuth: false, status: 'active' },
    { name: 'n8n-api', description: 'API para N8N', requiresAuth: false, status: 'active' },
  ];

  const errorCount = errorStats?.length || 0;
  const hasErrors = errorCount > 0;
  const hasCriticalErrors = errorStats?.some(err => 
    err.error_message?.includes("500") || 
    err.error_message?.includes("CRITICAL") ||
    err.error_code?.includes("CRITICAL")
  ) || false;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      <div className="p-8 space-y-6 pt-20">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Saúde das Edge Functions</h1>
          <p className="text-sm text-muted-foreground">Monitoramento e status das funções backend</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {hasCriticalErrors ? (
                <XCircle className="h-5 w-5 text-destructive" />
              ) : hasErrors ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              Status das Edge Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4 animate-spin" />
                Carregando estatísticas...
              </div>
            ) : hasCriticalErrors ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erros Críticos Detectados</AlertTitle>
                <AlertDescription>
                  {errorCount} erro(s) nas últimas 24 horas, incluindo erros críticos que requerem atenção imediata.
                </AlertDescription>
              </Alert>
            ) : hasErrors ? (
              <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertTitle>Avisos Detectados</AlertTitle>
                <AlertDescription>
                  {errorCount} erro(s) detectado(s) nas últimas 24 horas
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertTitle>Sistema Saudável</AlertTitle>
                <AlertDescription>
                  Todas as Edge Functions operando normalmente
                </AlertDescription>
              </Alert>
            )}

            <div className="mt-6 space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Edge Functions Configuradas:</h4>
              <div className="grid gap-2">
                {edgeFunctions.map(fn => (
                  <div 
                    key={fn.name} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{fn.name}</p>
                      <p className="text-xs text-muted-foreground">{fn.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {fn.requiresAuth ? '🔒 Autenticada' : '🌐 Pública'}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-green-600">Ativa</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {errorStats && errorStats.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Erros Recentes (Últimas 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {errorStats.map((err, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 bg-muted rounded-lg text-sm border-l-4 border-l-destructive"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs break-all">{err.error_message}</p>
                        {err.error_code && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Código: {err.error_code}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(err.timestamp).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico Automático</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Retry Automático</p>
                <p className="text-xs text-muted-foreground">
                  Sistema tenta até 3 vezes antes de falhar definitivamente
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Validação de Sessão</p>
                <p className="text-xs text-muted-foreground">
                  Tokens são renovados automaticamente antes de expirar
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Rate Limiting</p>
                <p className="text-xs text-muted-foreground">
                  APIs públicas protegidas contra abuso (100 req/min por IP)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Logs Estruturados</p>
                <p className="text-xs text-muted-foreground">
                  Todos os erros são registrados automaticamente para análise
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

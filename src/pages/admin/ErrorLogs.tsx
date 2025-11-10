import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const ErrorLogs = () => {
  const { data: errorLogs, isLoading } = useQuery({
    queryKey: ["error-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case "AUTH_ERROR":
        return "destructive";
      case "API_ERROR":
        return "destructive";
      case "RUNTIME_ERROR":
        return "destructive";
      case "VALIDATION_ERROR":
        return "default";
      default:
        return "secondary";
    }
  };

  const errorStats = errorLogs
    ? {
        total: errorLogs.length,
        withWebhook: errorLogs.filter((e) => e.webhook_sent).length,
        byType: errorLogs.reduce((acc, log) => {
          acc[log.error_type] = (acc[log.error_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      }
    : null;

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <BackButton />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackButton />

      <div>
        <h1 className="text-3xl font-bold mb-2">Central de Erros</h1>
        <p className="text-muted-foreground">
          Monitoramento e rastreamento de erros do sistema
        </p>
      </div>

      {errorStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Erros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Webhook Enviados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.withWebhook}</div>
              <p className="text-xs text-muted-foreground">
                {((errorStats.withWebhook / errorStats.total) * 100).toFixed(0)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tipos de Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(errorStats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Erros</CardTitle>
          <CardDescription>
            Últimos 100 erros registrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Página</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Webhook</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {errorLogs && errorLogs.length > 0 ? (
                  errorLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {log.error_code}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getErrorTypeColor(log.error_type)}>
                          {log.error_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.error_message}
                      </TableCell>
                      <TableCell>
                        {log.user_name || log.user_email || (
                          <span className="text-muted-foreground">Anônimo</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.page_route}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {log.webhook_sent ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum erro registrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorLogs;

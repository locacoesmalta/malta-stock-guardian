import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BackButton } from "@/components/BackButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

const ErrorLogs = () => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

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

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getCategoryBadge = (additionalData: any) => {
    const categoria = additionalData?.categoria;
    if (!categoria) return null;

    const colors: Record<string, string> = {
      MOVIMENTACAO: "bg-blue-500 text-white",
      ESTOQUE: "bg-green-500 text-white",
      RELATORIO: "bg-purple-500 text-white",
      ADMIN: "bg-red-500 text-white",
      AUTH: "bg-yellow-500 text-white",
      SISTEMA: "bg-gray-500 text-white",
    };

    return (
      <Badge className={colors[categoria] || "bg-gray-500 text-white"}>
        {categoria}
      </Badge>
    );
  };

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

  const filteredLogs = errorLogs?.filter((log) => {
    if (categoryFilter === "all") return true;
    return (log.additional_data as any)?.categoria === categoryFilter;
  });

  const errorStats = errorLogs
    ? {
        total: errorLogs.length,
        withWebhook: errorLogs.filter((e) => e.webhook_sent).length,
        withContext: errorLogs.filter((e) => (e.additional_data as any)?.categoria).length,
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Central de Erros</h1>
          <p className="text-muted-foreground">
            Monitoramento e rastreamento de erros do sistema
          </p>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="MOVIMENTACAO">Movimentação</SelectItem>
            <SelectItem value="ESTOQUE">Estoque</SelectItem>
            <SelectItem value="RELATORIO">Relatório</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
            <SelectItem value="AUTH">Autenticação</SelectItem>
            <SelectItem value="SISTEMA">Sistema</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {errorStats && (
        <div className="grid gap-4 md:grid-cols-4">
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
                {errorStats.total > 0 ? ((errorStats.withWebhook / errorStats.total) * 100).toFixed(0) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Com Contexto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{errorStats.withContext}</div>
              <p className="text-xs text-muted-foreground">
                {errorStats.total > 0 ? ((errorStats.withContext / errorStats.total) * 100).toFixed(0) : 0}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Tipos de Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(errorStats.byType).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-muted-foreground truncate">{type}:</span>
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
            Últimos 100 erros registrados - Clique para expandir detalhes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contexto</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Webhook</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const isExpanded = expandedRows.has(log.id);
                    const additionalData = log.additional_data as any;
                    const hasContext = additionalData?.categoria;

                    return (
                      <>
                        <TableRow 
                          key={log.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleRow(log.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {log.error_code}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getErrorTypeColor(log.error_type)}>
                              {log.error_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasContext ? (
                              <div className="flex flex-col gap-1">
                                {getCategoryBadge(additionalData)}
                                {additionalData?.entidade_codigo && (
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {additionalData.entidade_tipo}: {additionalData.entidade_codigo}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Sem contexto</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="truncate">
                              {additionalData?.descricao_amigavel || log.error_message}
                            </div>
                          </TableCell>
                          <TableCell>
                            {log.user_name || log.user_email || (
                              <span className="text-muted-foreground">Anônimo</span>
                            )}
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
                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-muted/30">
                              <div className="p-4 space-y-3 text-sm">
                                {additionalData?.contexto_acao && (
                                  <div>
                                    <span className="font-semibold">Ação: </span>
                                    {additionalData.contexto_acao}
                                  </div>
                                )}
                                {additionalData?.descricao_amigavel && (
                                  <div>
                                    <span className="font-semibold">Descrição: </span>
                                    {additionalData.descricao_amigavel}
                                  </div>
                                )}
                                <div>
                                  <span className="font-semibold">Mensagem técnica: </span>
                                  {log.error_message}
                                </div>
                                <div>
                                  <span className="font-semibold">Página: </span>
                                  <code className="text-xs bg-background px-1 py-0.5 rounded">{log.page_route}</code>
                                </div>
                                {additionalData?.dado_problematico && (
                                  <div>
                                    <span className="font-semibold">Dado problemático: </span>
                                    <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto">
                                      {JSON.stringify(additionalData.dado_problematico, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.error_stack && (
                                  <div>
                                    <span className="font-semibold">Stack trace: </span>
                                    <pre className="text-xs mt-1 p-2 bg-background rounded overflow-x-auto max-h-40">
                                      {log.error_stack}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      {categoryFilter === "all" 
                        ? "Nenhum erro registrado" 
                        : "Nenhum erro encontrado com este filtro"}
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
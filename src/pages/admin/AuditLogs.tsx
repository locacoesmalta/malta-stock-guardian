import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Shield, Search, ChevronLeft, ChevronRight, FileText, Download } from "lucide-react";
import { useAuditLogsQuery } from "@/hooks/useAuditLogsQuery";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BackButton } from "@/components/BackButton";

const LOGS_PER_PAGE = 50;

const AuditLogs = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading, error } = useAuditLogsQuery({
    page: currentPage,
    pageSize: LOGS_PER_PAGE,
    action: actionFilter !== "all" ? actionFilter : undefined,
    tableName: tableFilter !== "all" ? tableFilter : undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const logs = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / LOGS_PER_PAGE);

  if (error) {
    toast.error("Erro ao carregar logs de auditoria");
  }

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    return logs.filter(
      (log) =>
        log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  const getActionColor = (action: string) => {
    switch (action) {
      case "INSERT":
        return "bg-green-600";
      case "UPDATE":
        return "bg-blue-600";
      case "DELETE":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "INSERT":
        return "Criação";
      case "UPDATE":
        return "Atualização";
      case "DELETE":
        return "Exclusão";
      default:
        return action;
    }
  };

  const getTableLabel = (tableName: string | null) => {
    if (!tableName) return "-";
    const labels: Record<string, string> = {
      products: "Produtos",
      material_withdrawals: "Retiradas",
      reports: "Relatórios",
      assets: "Patrimônio",
      user_permissions: "Permissões",
    };
    return labels[tableName] || tableName;
  };

  const handleExport = () => {
    const csvContent = [
      ["Data/Hora", "Usuário", "Email", "Ação", "Tabela", "ID do Registro"],
      ...filteredLogs.map((log) => [
        format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        log.user_name || "-",
        log.user_email,
        getActionLabel(log.action),
        getTableLabel(log.table_name),
        log.record_id || "-",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-logs-${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();
    toast.success("Logs exportados com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <BackButton />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Logs de Auditoria
            </h1>
            <p className="text-muted-foreground">
              Histórico completo de todas as ações realizadas no sistema
            </p>
          </div>
          <Button onClick={handleExport} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Usuário, ação, tabela..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action">Ação</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="INSERT">Criação</SelectItem>
                  <SelectItem value="UPDATE">Atualização</SelectItem>
                  <SelectItem value="DELETE">Exclusão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table">Tabela</Label>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as tabelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="material_withdrawals">Retiradas</SelectItem>
                  <SelectItem value="reports">Relatórios</SelectItem>
                  <SelectItem value="assets">Patrimônio</SelectItem>
                  <SelectItem value="user_permissions">Permissões</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage + 1} de {totalPages} ({totalCount} registros)
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros ({filteredLogs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando logs...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getActionColor(log.action)} text-white`}>
                        {getActionLabel(log.action)}
                      </Badge>
                      <span className="font-medium">{getTableLabel(log.table_name)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {log.user_name || "Sem nome"} ({log.user_email})
                    </div>
                    {log.record_id && (
                      <div className="text-xs text-muted-foreground">
                        ID: {log.record_id.substring(0, 8)}...
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="text-sm font-medium">
                      {format(new Date(log.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(log.created_at), "HH:mm:ss", { locale: ptBR })}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <FileText className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Data/Hora</Label>
                  <p className="font-medium">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Ação</Label>
                  <p>
                    <Badge className={`${getActionColor(selectedLog.action)} text-white`}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Usuário</Label>
                  <p className="font-medium">{selectedLog.user_name || "Sem nome"}</p>
                  <p className="text-sm text-muted-foreground">{selectedLog.user_email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tabela</Label>
                  <p className="font-medium">{getTableLabel(selectedLog.table_name)}</p>
                </div>
                {selectedLog.record_id && (
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">ID do Registro</Label>
                    <p className="font-mono text-sm">{selectedLog.record_id}</p>
                  </div>
                )}
              </div>

              {selectedLog.old_data && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Dados Anteriores</Label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_data && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2">Novos Dados</Label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogs;

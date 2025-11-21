import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSystemIntegrity } from "@/hooks/useSystemIntegrity";
import { RLSHealthMonitor } from "@/components/admin/RLSHealthMonitor";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Package, 
  Users, 
  Shield,
  RefreshCw,
  Download,
  Wrench,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRFromYYYYMMDD } from "@/lib/dateUtils";

export default function SystemIntegrity() {
  const [isFixing, setIsFixing] = useState(false);
  const {
    productsIntegrity,
    sessionsIntegrity,
    auditLogsIntegrity,
    assetsIntegrity,
    withdrawalsIntegrity,
    reportsIntegrity,
    productsStockIntegrity,
    productsOrphanIntegrity,
    fixStaleSessions,
    fixDuplicateSessions,
    refetchAll,
    isLoading,
  } = useSystemIntegrity();

  const totalIssues =
    productsIntegrity.count +
    sessionsIntegrity.count +
    auditLogsIntegrity.count +
    assetsIntegrity.count +
    withdrawalsIntegrity.count +
    reportsIntegrity.count +
    productsStockIntegrity.count +
    productsOrphanIntegrity.count;

  const handleFixSessions = async () => {
    setIsFixing(true);
    try {
      await fixStaleSessions();
      await fixDuplicateSessions();
      toast.success("Sessões corrigidas com sucesso!");
    } catch (error) {
      console.error("Erro ao corrigir sessões:", error);
      toast.error("Erro ao corrigir sessões");
    } finally {
      setIsFixing(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetchAll();
      toast.success("Dados atualizados!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast.error("Erro ao atualizar dados");
    }
  };

  const handleExportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      total_issues: totalIssues,
      products: productsIntegrity.data,
      sessions: sessionsIntegrity.data,
      audit_logs: auditLogsIntegrity.data,
      assets: assetsIntegrity.data,
      withdrawals: withdrawalsIntegrity.data,
      reports: reportsIntegrity.data,
      products_stock: productsStockIntegrity.data,
      products_orphan: productsOrphanIntegrity.data,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `integrity-report-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Verificando integridade do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Integridade do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Verificação e correção de inconsistências
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* FASE 6: Monitoramento de Segurança RLS */}
      <RLSHealthMonitor />

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {totalIssues === 0 ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Sistema Íntegro
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                {totalIssues} Problema{totalIssues !== 1 ? "s" : ""} Detectado{totalIssues !== 1 ? "s" : ""}
              </>
            )}
          </CardTitle>
          <CardDescription>
            Verificação automática de dados, sessões e auditoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Produtos</p>
                  <p className="text-2xl font-bold">
                    {productsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={productsIntegrity.count === 0 ? "default" : "destructive"}>
                {productsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sessões</p>
                  <p className="text-2xl font-bold">
                    {sessionsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={sessionsIntegrity.count === 0 ? "default" : "destructive"}>
                {sessionsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Auditoria</p>
                  <p className="text-2xl font-bold">
                    {auditLogsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={auditLogsIntegrity.count === 0 ? "default" : "destructive"}>
                {auditLogsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Equipamentos</p>
                  <p className="text-2xl font-bold">
                    {assetsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={assetsIntegrity.count === 0 ? "default" : "destructive"}>
                {assetsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Retiradas</p>
                  <p className="text-2xl font-bold">
                    {withdrawalsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={withdrawalsIntegrity.count === 0 ? "default" : "destructive"}>
                {withdrawalsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Relatórios</p>
                  <p className="text-2xl font-bold">
                    {reportsIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={reportsIntegrity.count === 0 ? "default" : "destructive"}>
                {reportsIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium">Estoque</p>
                  <p className="text-2xl font-bold">
                    {productsStockIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={productsStockIntegrity.count === 0 ? "default" : "destructive"}>
                {productsStockIntegrity.count === 0 ? "OK" : "ATENÇÃO"}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm font-medium">Órfãos</p>
                  <p className="text-2xl font-bold">
                    {productsOrphanIntegrity.count}
                  </p>
                </div>
              </div>
              <Badge variant={productsOrphanIntegrity.count === 0 ? "default" : "destructive"}>
                {productsOrphanIntegrity.count === 0 ? "OK" : "CRÍTICO"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Produtos com Problemas */}
      {productsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Produtos com Inconsistências
            </CardTitle>
            <CardDescription>
              {productsIntegrity.count} produto{productsIntegrity.count !== 1 ? "s" : ""} necessitam atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {productsIntegrity.data.map((product) => (
                  <Alert key={product.product_id}>
                    <AlertDescription className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{product.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Código: {product.product_code} • Qtd: {product.current_quantity}
                        </p>
                        <Badge variant="outline" className="mt-1">
                          {product.issue_type}
                        </Badge>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Sessões com Problemas */}
      {sessionsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Sessões Anômalas
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>{sessionsIntegrity.count} sessão{sessionsIntegrity.count !== 1 ? "ões" : ""} com problemas</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFixSessions}
                disabled={isFixing}
              >
                {isFixing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wrench className="h-4 w-4 mr-2" />
                )}
                Corrigir Automaticamente
              </Button>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {sessionsIntegrity.data.map((session) => (
                  <Alert key={session.session_id}>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{session.user_name || session.user_email}</p>
                          <p className="text-sm text-muted-foreground">
                            Última atividade: {format(new Date(session.last_activity), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{session.issue_type}</Badge>
                            {session.session_count > 1 && (
                              <Badge variant="secondary">
                                {session.session_count} sessões ativas
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Logs de Auditoria com Problemas */}
      {auditLogsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Logs de Auditoria com Problemas
            </CardTitle>
            <CardDescription>
              {auditLogsIntegrity.count} log{auditLogsIntegrity.count !== 1 ? "s" : ""} com problemas de integridade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Logs sem hash ou órfãos podem indicar problemas de segurança ou migração incompleta.
                Entre em contato com o administrador do sistema.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {auditLogsIntegrity.data.map((log) => (
                  <Alert key={log.log_id}>
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">
                            {log.action} em {log.table_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Usuário: {log.user_email} • {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </p>
                          <Badge variant="destructive" className="mt-1">
                            {log.issue_type}
                          </Badge>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Equipamentos com Inconsistências */}
      {assetsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              Equipamentos com Inconsistências ({assetsIntegrity.count})
            </CardTitle>
            <CardDescription>
              Equipamentos com problemas de location_type ou dados faltantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {assetsIntegrity.data.map((asset: any) => (
                  <Alert key={asset.asset_id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            PAT {asset.asset_code} - {asset.equipment_name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {asset.details}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{asset.location_type}</Badge>
                            <Badge variant="destructive">{asset.issue_type}</Badge>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Retiradas com Problemas */}
      {withdrawalsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Retiradas com Problemas ({withdrawalsIntegrity.count})
            </CardTitle>
            <CardDescription>
              Retiradas de material com produtos órfãos ou quantidades inválidas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {withdrawalsIntegrity.data.map((withdrawal: any) => (
                  <Alert key={withdrawal.withdrawal_id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            {withdrawal.product_code} - {withdrawal.product_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PAT {withdrawal.equipment_code} • Qtd: {withdrawal.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Data: {formatBRFromYYYYMMDD(withdrawal.withdrawal_date)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {withdrawal.details}
                          </p>
                          <Badge variant="destructive" className="mt-2">
                            {withdrawal.issue_type}
                          </Badge>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Relatórios com Problemas */}
      {reportsIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Relatórios com Problemas ({reportsIntegrity.count})
            </CardTitle>
            <CardDescription>
              Relatórios sem peças ou com peças órfãs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {reportsIntegrity.data.map((report: any) => (
                  <Alert key={report.report_id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            PAT {report.equipment_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {report.company} • {report.work_site}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Data: {formatBRFromYYYYMMDD(report.report_date)}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {report.details}
                          </p>
                          <Badge variant="destructive" className="mt-2">
                            {report.issue_type}
                          </Badge>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Produtos com Problemas de Estoque */}
      {productsStockIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Produtos com Problemas de Estoque ({productsStockIntegrity.count})
            </CardTitle>
            <CardDescription>
              Produtos com estoque negativo ou abaixo do mínimo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {productsStockIntegrity.data.map((product: any) => (
                  <Alert key={product.product_id}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            {product.product_code} - {product.product_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Estoque Atual: {product.current_quantity} • Mínimo: {product.min_quantity}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {product.details}
                          </p>
                          <Badge variant={product.issue_type === 'negative_stock' ? 'destructive' : 'secondary'} className="mt-2">
                            {product.issue_type === 'negative_stock' ? 'ESTOQUE NEGATIVO' : 'ABAIXO DO MÍNIMO'}
                          </Badge>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* FASE 1: Referências Órfãs de Produtos */}
      {productsOrphanIntegrity.count > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Referências Órfãs de Produtos ({productsOrphanIntegrity.count})
            </CardTitle>
            <CardDescription>
              Produtos deletados ainda referenciados em retiradas, relatórios e manutenções
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>CRÍTICO:</strong> Referências órfãs comprometem a rastreabilidade do sistema e podem causar erros graves.
                Contate o administrador imediatamente para resolver estas inconsistências.
              </AlertDescription>
            </Alert>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {productsOrphanIntegrity.data.map((item: any) => (
                  <Alert key={item.reference_id} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">
                            {item.product_code} - {item.product_name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.details}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {item.reference_type === 'material_withdrawal' && 'Retirada'}
                              {item.reference_type === 'report_part' && 'Relatório'}
                              {item.reference_type === 'asset_mobilization_part' && 'Mobilização'}
                              {item.reference_type === 'asset_maintenance_part' && 'Manutenção'}
                              {item.reference_type === 'asset_spare_part' && 'Peça Reserva'}
                            </Badge>
                            <Badge variant="destructive">{item.issue_type}</Badge>
                          </div>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando tudo está OK */}
      {totalIssues === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sistema Íntegro</h3>
              <p className="text-muted-foreground">
                Nenhum problema de integridade foi detectado. Todas as verificações passaram com sucesso.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

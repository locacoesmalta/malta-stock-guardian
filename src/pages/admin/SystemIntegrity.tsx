import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSystemIntegrity } from "@/hooks/useSystemIntegrity";
import { IntegrityProblemCard } from "@/components/admin/IntegrityProblemCard";
import { IntegrityDetailModal } from "@/components/admin/IntegrityDetailModal";
import { IntegrityResolutionHistory } from "@/components/admin/IntegrityResolutionHistory";
import { RLSHealthMonitor } from "@/components/admin/RLSHealthMonitor";
import { ManualDataMigration } from "@/components/admin/ManualDataMigration";
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Users,
  Shield,
  RefreshCw,
  Download,
  Loader2,
  TrendingUp,
  AlertCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

export default function SystemIntegrity() {
  const [selectedTab, setSelectedTab] = useState<"pendentes" | "historico">("pendentes");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<any>(null);
  const [selectedProblemType, setSelectedProblemType] = useState<string>("");

  const {
    productsIntegrity,
    sessionsIntegrity,
    auditLogsIntegrity,
    assetsIntegrity,
    withdrawalsIntegrity,
    reportsIntegrity,
    productsStockIntegrity,
    productsOrphanIntegrity,
    resolutions,
    refetchAll,
    resolveProblem,
    ignoreProblem,
    reopenProblem,
    isLoading,
  } = useSystemIntegrity();

  const totalPending =
    productsIntegrity.count +
    sessionsIntegrity.count +
    auditLogsIntegrity.count +
    assetsIntegrity.count +
    withdrawalsIntegrity.count +
    reportsIntegrity.count +
    productsStockIntegrity.count +
    productsOrphanIntegrity.count;

  const totalResolved = resolutions.filter((r) => r.status === "resolved").length;
  const totalIgnored = resolutions.filter((r) => r.status === "ignored").length;

  // Helper para verificar status de resolução
  const getResolutionStatus = (problemType: string, problemId: string): "pending" | "resolved" | "ignored" => {
    const resolution = resolutions.find(
      (r) => r.problem_type === problemType && r.problem_identifier === problemId
    );
    return (resolution?.status as "pending" | "resolved" | "ignored") || "pending";
  };

  const handleViewDetails = (problem: any, problemType: string) => {
    setSelectedProblem(problem);
    setSelectedProblemType(problemType);
    setDetailModalOpen(true);
  };

  const handleResolve = async (problemId: string, notes?: string) => {
    try {
      await resolveProblem({ problemType: selectedProblemType || "products", problemId, notes });
    } catch (error) {
      console.error("Erro ao resolver:", error);
    }
  };

  const handleIgnore = async (problemId: string, notes?: string) => {
    try {
      await ignoreProblem({ problemType: selectedProblemType || "products", problemId, notes });
    } catch (error) {
      console.error("Erro ao ignorar:", error);
    }
  };

  const handleReopen = async (problemType: string, problemId: string) => {
    try {
      await reopenProblem({ problemType, problemId });
    } catch (error) {
      console.error("Erro ao reabrir:", error);
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
      total_pending: totalPending,
      total_resolved: totalResolved,
      total_ignored: totalIgnored,
      products: productsIntegrity.data,
      sessions: sessionsIntegrity.data,
      audit_logs: auditLogsIntegrity.data,
      assets: assetsIntegrity.data,
      withdrawals: withdrawalsIntegrity.data,
      reports: reportsIntegrity.data,
      products_stock: productsStockIntegrity.data,
      products_orphan: productsOrphanIntegrity.data,
      resolutions: resolutions,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🎯 Central de Comando - Integridade</h1>
          <p className="text-muted-foreground mt-1">
            Gestão interativa de problemas do sistema
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

      {/* Dashboard de Prioridades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Crítico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{totalPending}</p>
            <p className="text-sm text-muted-foreground mt-1">Problemas pendentes</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Resolvido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-500">{totalResolved}</p>
            <p className="text-sm text-muted-foreground mt-1">Problemas corrigidos</p>
          </CardContent>
        </Card>

        <Card className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Ignorado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-muted-foreground">{totalIgnored}</p>
            <p className="text-sm text-muted-foreground mt-1">Problemas ignorados</p>
          </CardContent>
        </Card>
      </div>

      {/* Monitoramento de Segurança RLS */}
      <RLSHealthMonitor />

      {/* Correção Manual de Dados */}
      <ManualDataMigration />

      <Separator />

      {/* Abas: Pendentes vs Histórico */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pendentes">
            Problemas Pendentes ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="historico">
            Histórico de Resoluções ({totalResolved + totalIgnored})
          </TabsTrigger>
        </TabsList>

        {/* Aba: Problemas Pendentes */}
        <TabsContent value="pendentes" className="space-y-6 mt-6">
          {totalPending === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">✅ Sistema Íntegro</h3>
                <p className="text-muted-foreground">
                  Nenhum problema detectado. Todos os sistemas operando normalmente.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Produtos */}
              {productsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Produtos ({productsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Produtos com estoque negativo ou sem histórico de ajustes
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {productsIntegrity.data.map((product: any) => (
                      <IntegrityProblemCard
                        key={product.product_id}
                        problem={product}
                        problemType="products"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("products", product.product_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Sessões */}
              {sessionsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Sessões ({sessionsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Sessões duplicadas ou obsoletas detectadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sessionsIntegrity.data.map((session: any) => (
                      <IntegrityProblemCard
                        key={session.session_id}
                        problem={session}
                        problemType="sessions"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus(
                          "sessions",
                          `${session.user_email}_${session.last_activity}`
                        )}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Logs de Auditoria */}
              {auditLogsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Logs de Auditoria ({auditLogsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Logs com problemas de integridade ou assinatura
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {auditLogsIntegrity.data.map((log: any) => (
                      <IntegrityProblemCard
                        key={log.log_id}
                        problem={log}
                        problemType="audit"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("audit", log.log_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Equipamentos */}
              {assetsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      Equipamentos ({assetsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Equipamentos com inconsistências de localização ou dados
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assetsIntegrity.data.map((asset: any) => (
                      <IntegrityProblemCard
                        key={asset.asset_id}
                        problem={asset}
                        problemType="assets"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("assets", asset.asset_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Retiradas */}
              {withdrawalsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                      Retiradas ({withdrawalsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Retiradas de material com inconsistências
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {withdrawalsIntegrity.data.map((withdrawal: any) => (
                      <IntegrityProblemCard
                        key={withdrawal.withdrawal_id}
                        problem={withdrawal}
                        problemType="withdrawals"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("withdrawals", withdrawal.withdrawal_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Relatórios */}
              {reportsIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-purple-500" />
                      Relatórios ({reportsIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Relatórios com inconsistências detectadas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {reportsIntegrity.data.map((report: any) => (
                      <IntegrityProblemCard
                        key={report.report_id}
                        problem={report}
                        problemType="reports"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("reports", report.report_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Estoque */}
              {productsStockIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      Estoque ({productsStockIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Produtos com estoque abaixo do mínimo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {productsStockIntegrity.data.map((stock: any) => (
                      <IntegrityProblemCard
                        key={stock.product_id}
                        problem={stock}
                        problemType="stock"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("stock", stock.product_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Órfãos */}
              {productsOrphanIntegrity.count > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Referências Órfãs ({productsOrphanIntegrity.count})
                    </CardTitle>
                    <CardDescription>
                      Produtos referenciados que não existem mais
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {productsOrphanIntegrity.data.map((orphan: any) => (
                      <IntegrityProblemCard
                        key={orphan.reference_id}
                        problem={orphan}
                        problemType="orphans"
                        onResolve={handleResolve}
                        onIgnore={handleIgnore}
                        onViewDetails={handleViewDetails}
                        resolutionStatus={getResolutionStatus("orphans", orphan.reference_id)}
                      />
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Aba: Histórico de Resoluções */}
        <TabsContent value="historico" className="mt-6">
          <IntegrityResolutionHistory resolutions={resolutions} onReopen={handleReopen} />
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <IntegrityDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        problem={selectedProblem}
        problemType={selectedProblemType}
      />
    </div>
  );
}

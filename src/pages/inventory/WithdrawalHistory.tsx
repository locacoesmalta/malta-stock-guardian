import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, FileText, FileEdit } from "lucide-react";
import { useWithdrawalsQuery } from "@/hooks/useWithdrawalsQuery";
import { formatPAT } from "@/lib/patUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { BackButton } from "@/components/BackButton";

const WithdrawalHistory = () => {
  const navigate = useNavigate();
  const { data: withdrawals = [], isLoading, error } = useWithdrawalsQuery();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [workSiteFilter, setWorkSiteFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [equipmentCodeFilter, setEquipmentCodeFilter] = useState("");
  const [showOnlyMaintenance, setShowOnlyMaintenance] = useState(false);
  const [showOnlySales, setShowOnlySales] = useState(false);

  if (error) {
    toast.error("Erro ao carregar histórico");
  }

  const filteredWithdrawals = useMemo(() => {
    let filtered = [...withdrawals];

    if (startDate) {
      filtered = filtered.filter((w) => w.withdrawal_date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter((w) => w.withdrawal_date <= endDate);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (w) =>
          w.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.products?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    if (workSiteFilter) {
      filtered = filtered.filter((w) =>
        w.work_site.toLowerCase().includes(workSiteFilter.toLowerCase())
      );
    }

    if (companyFilter) {
      filtered = filtered.filter((w) =>
        w.company.toLowerCase().includes(companyFilter.toLowerCase())
      );
    }

    if (equipmentCodeFilter) {
      filtered = filtered.filter((w) =>
        w.equipment_code.toLowerCase().includes(equipmentCodeFilter.toLowerCase())
      );
    }

    if (showOnlyMaintenance) {
      filtered = filtered.filter((w) => w.company === "Manutenção Interna");
    }

    if (showOnlySales) {
      filtered = filtered.filter((w) => 
        w.equipment_code === "VENDA" || 
        w.withdrawal_reason === "VENDA" ||
        w.company.toLowerCase().includes("venda")
      );
    }

    return filtered;
  }, [withdrawals, startDate, endDate, searchTerm, workSiteFilter, companyFilter, equipmentCodeFilter, showOnlyMaintenance]);

  const handleExport = () => {
    const csvContent = [
      ["Data", "Tipo", "Produto", "Código", "Quantidade", "Custo Unit.", "Custo Total", "Motivo", "Responsável", "PAT/Venda", "Obra", "Empresa"],
      ...filteredWithdrawals.map((w) => {
        const isSale = w.equipment_code === "VENDA" || w.withdrawal_reason === "VENDA";
        const unitCost = (w.products as any)?.purchase_price || 0;
        const totalCost = unitCost * w.quantity;
        return [
          format(new Date(w.withdrawal_date), "dd/MM/yyyy", { locale: ptBR }),
          isSale ? "VENDA" : "RETIRADA",
          w.products?.name || "Sem permissão",
          w.products?.code || "-",
          w.quantity.toString(),
          unitCost.toFixed(2),
          totalCost.toFixed(2),
          w.withdrawal_reason || "-",
          w.profiles?.full_name || w.profiles?.email || "-",
          isSale ? "VENDA" : w.equipment_code,
          w.work_site,
          w.company,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historico-retiradas-${format(new Date(), "dd-MM-yyyy")}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <BackButton />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Histórico de Retiradas</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Visualize todas as retiradas de material registradas
            </p>
          </div>
          <Button 
            onClick={handleExport} 
            disabled={filteredWithdrawals.length === 0}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Produto, código ou responsável..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
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

            <div className="space-y-2">
              <Label htmlFor="equipmentCode">PAT do Equipamento</Label>
              <Input
                id="equipmentCode"
                type="text"
                maxLength={6}
                placeholder="000000"
                value={equipmentCodeFilter}
                onChange={(e) => setEquipmentCodeFilter(e.target.value.replace(/\D/g, ''))}
                onBlur={(e) => {
                  const formatted = formatPAT(e.target.value);
                  if (formatted) {
                    setEquipmentCodeFilter(formatted);
                  }
                }}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workSite">Obra</Label>
              <Input
                id="workSite"
                placeholder="Filtrar por obra..."
                value={workSiteFilter}
                onChange={(e) => setWorkSiteFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                placeholder="Filtrar por empresa..."
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintenanceOnly"
                checked={showOnlyMaintenance}
                onCheckedChange={(checked) => setShowOnlyMaintenance(checked as boolean)}
              />
              <Label
                htmlFor="maintenanceOnly"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar apenas Manutenção Interna
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="salesOnly"
                checked={showOnlySales}
                onCheckedChange={(checked) => setShowOnlySales(checked as boolean)}
              />
              <Label
                htmlFor="salesOnly"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Mostrar apenas Vendas de Material
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Retiradas ({filteredWithdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando histórico...
            </div>
          ) : filteredWithdrawals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma retirada encontrada
            </div>
          ) : (
            <div className="space-y-2">
              {filteredWithdrawals.map((withdrawal) => {
                const unitCost = (withdrawal.products as any)?.purchase_price || 0;
                const totalCost = unitCost * withdrawal.quantity;
                const isMaintenance = withdrawal.company === "Manutenção Interna";
                const isSale = withdrawal.equipment_code === "VENDA" || withdrawal.withdrawal_reason === "VENDA";
                
                return (
                  <div
                    key={withdrawal.id}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 ${
                      isMaintenance ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20' : ''
                    } ${
                      isSale ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : ''
                    }`}
                  >
                    <div className="flex-1 space-y-1.5 sm:space-y-1 min-w-0">
                      <div className="font-medium text-sm sm:text-base break-words">
                        {withdrawal.products?.name || "Produto (sem permissão para visualizar)"}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {isMaintenance && (
                            <span className="text-xs px-2 py-0.5 rounded bg-blue-500 text-white whitespace-nowrap">
                              Manutenção Interna
                            </span>
                          )}
                          {isSale && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500 text-white whitespace-nowrap">
                              Venda de Material
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        Código: {withdrawal.products?.code || "-"}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground break-words">
                        {isSale 
                          ? <>
                              <span className="font-medium">Tipo:</span> Venda de Material<br className="sm:hidden" />
                              <span className="hidden sm:inline"> | </span>
                              <span className="font-medium">Obra:</span> {withdrawal.work_site}<br className="sm:hidden" />
                              <span className="hidden sm:inline"> | </span>
                              <span className="font-medium">Empresa:</span> {withdrawal.company}
                            </>
                          : <>
                              <span className="font-medium">PAT:</span> {withdrawal.equipment_code}<br className="sm:hidden" />
                              <span className="hidden sm:inline"> | </span>
                              <span className="font-medium">Obra:</span> {withdrawal.work_site}<br className="sm:hidden" />
                              <span className="hidden sm:inline"> | </span>
                              <span className="font-medium">Empresa:</span> {withdrawal.company}
                            </>
                        }
                      </div>
                      {withdrawal.withdrawal_reason && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          <span className="font-medium">Motivo:</span> {withdrawal.withdrawal_reason}
                        </div>
                      )}
                      {unitCost > 0 && (
                        <div className="text-xs sm:text-sm font-medium text-primary">
                          Custo Total: {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(totalCost)}
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start sm:text-right space-y-0 sm:space-y-1 border-t sm:border-t-0 pt-2 sm:pt-0 flex-shrink-0 gap-2">
                      <div className="flex flex-col items-end gap-1 flex-1">
                        <div className="font-semibold text-sm sm:text-base">
                          Qtd: {withdrawal.quantity}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(withdrawal.withdrawal_date), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-[150px] sm:max-w-none">
                          {withdrawal.profiles?.full_name || withdrawal.profiles?.email || "-"}
                        </div>
                      </div>
                      {!isSale && withdrawal.equipment_code && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-2 text-xs whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/reports/new?pat=${withdrawal.equipment_code}`);
                          }}
                        >
                          <FileEdit className="h-3 w-3 mr-1" />
                          Criar Relatório
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalHistory;

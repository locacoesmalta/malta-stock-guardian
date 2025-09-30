import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, FileText } from "lucide-react";
import { useWithdrawalsQuery } from "@/hooks/useWithdrawalsQuery";

const WithdrawalHistory = () => {
  const { data: withdrawals = [], isLoading, error } = useWithdrawalsQuery();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [workSiteFilter, setWorkSiteFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [equipmentCodeFilter, setEquipmentCodeFilter] = useState("");

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
          w.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          w.products.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (w.profiles.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
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

    return filtered;
  }, [withdrawals, startDate, endDate, searchTerm, workSiteFilter, companyFilter, equipmentCodeFilter]);

  const handleExport = () => {
    const csvContent = [
      ["Data", "Produto", "Código", "Quantidade", "Motivo", "Responsável", "PAT", "Obra", "Empresa"],
      ...filteredWithdrawals.map((w) => [
        format(new Date(w.withdrawal_date), "dd/MM/yyyy", { locale: ptBR }),
        w.products.name,
        w.products.code,
        w.quantity.toString(),
        w.withdrawal_reason || "-",
        w.profiles.full_name || w.profiles.email,
        w.equipment_code,
        w.work_site,
        w.company,
      ]),
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Histórico de Retiradas</h1>
          <p className="text-muted-foreground">
            Visualize todas as retiradas de material registradas
          </p>
        </div>
        <Button onClick={handleExport} disabled={filteredWithdrawals.length === 0}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Filtrar por PAT..."
                value={equipmentCodeFilter}
                onChange={(e) => setEquipmentCodeFilter(e.target.value)}
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
              {filteredWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{withdrawal.products.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Código: {withdrawal.products.code}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      PAT: {withdrawal.equipment_code} | Obra: {withdrawal.work_site} | Empresa: {withdrawal.company}
                    </div>
                    {withdrawal.withdrawal_reason && (
                      <div className="text-sm text-muted-foreground">
                        Motivo: {withdrawal.withdrawal_reason}
                      </div>
                    )}
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-semibold">
                      Qtd: {withdrawal.quantity}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(withdrawal.withdrawal_date), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {withdrawal.profiles.full_name || withdrawal.profiles.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WithdrawalHistory;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePatrimonioHistoricoFiltered } from "@/hooks/usePatrimonioHistorico";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";
import { ArrowLeft, Search, FileText, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatLocationLabel = (value: string) => {
  const labels: Record<string, string> = {
    deposito_malta: "Depósito Malta",
    em_manutencao: "Em Manutenção",
    locacao: "Locação",
    aguardando_laudo: "Aguardando Laudo",
    liberado_locacao: "Liberado para Locação",
  };
  return labels[value] || value;
};

export default function AssetTraceability() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    codigo_pat: "",
    data_inicio: "",
    data_fim: "",
    usuario: "",
    campo: "all",
    tipo_evento: "all",
  });

  const [searchFilters, setSearchFilters] = useState({
    codigo_pat: "",
    data_inicio: "",
    data_fim: "",
    usuario: "",
    campo: "",
    tipo_evento: "",
  });

  const { data: historico, isLoading } = usePatrimonioHistoricoFiltered(searchFilters);
  const { data: assets = [] } = useAssetsQuery();
  
  // Filtrar equipamentos em manutenção
  const assetsInMaintenance = assets.filter(
    (asset) => asset.location_type === "em_manutencao" && asset.maintenance_arrival_date
  );

  // Busca automática quando o código PAT é digitado
  useEffect(() => {
    if (filters.codigo_pat.trim().length >= 3) {
      const timeoutId = setTimeout(() => {
        setSearchFilters({
          ...filters,
          campo: filters.campo === "all" ? "" : filters.campo,
          tipo_evento: filters.tipo_evento === "all" ? "" : filters.tipo_evento,
        });
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [filters.codigo_pat]);

  const handleSearch = () => {
    setSearchFilters({
      ...filters,
      campo: filters.campo === "all" ? "" : filters.campo,
      tipo_evento: filters.tipo_evento === "all" ? "" : filters.tipo_evento,
    });
  };

  const handleClear = () => {
    const emptyFilters = {
      codigo_pat: "",
      data_inicio: "",
      data_fim: "",
      usuario: "",
      campo: "all",
      tipo_evento: "all",
    };
    setFilters(emptyFilters);
    setSearchFilters({ ...emptyFilters, campo: "", tipo_evento: "" });
  };

  const renderEventDetails = (item: any) => {
    if (item.tipo_evento === "ALTERAÇÃO DE DADO" && item.campo_alterado) {
      const valorAntigo = item.campo_alterado === "Local do Equipamento" && item.valor_antigo
        ? formatLocationLabel(item.valor_antigo)
        : item.valor_antigo || "-";
      
      const valorNovo = item.campo_alterado === "Local do Equipamento" && item.valor_novo
        ? formatLocationLabel(item.valor_novo)
        : item.valor_novo || "-";

      return (
        <div className="text-sm space-y-1">
          <div>
            <span className="font-medium">{item.campo_alterado}:</span>{" "}
            <span className="text-muted-foreground">{valorAntigo}</span>
            {" → "}
            <span>{valorNovo}</span>
          </div>
          
          {/* Mostrar aviso de dias em manutenção quando alterar para "em_manutencao" */}
          {item.campo_alterado === "Local do Equipamento" && item.valor_novo === "em_manutencao" && (
            <div className="mt-2 inline-block">
              <span className="text-xs bg-destructive text-destructive-foreground px-2 py-1 rounded font-medium">
                ⏱️ Equipamento entrou em manutenção
              </span>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-sm">
        {item.detalhes_evento || "Sem detalhes"}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/assets")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Rastreabilidade Integrada de Patrimônio
        </h1>
        <p className="text-muted-foreground mt-2">
          Consulte a linha do tempo completa de todos os eventos relacionados aos patrimônios
        </p>
      </div>

      {/* Seção de Equipamentos em Manutenção */}
      {assetsInMaintenance.length > 0 && (
        <Card className="p-6 mb-6 border-destructive/50">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-destructive" />
            <h2 className="text-xl font-semibold">
              Equipamentos em Manutenção ({assetsInMaintenance.length})
            </h2>
          </div>
          <div className="grid gap-3">
            {assetsInMaintenance.map((asset) => {
              const arrival = parseISO(asset.maintenance_arrival_date + "T00:00:00");
              const today = new Date();
              const diffTime = today.getTime() - arrival.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              return (
                <div
                  key={asset.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{asset.asset_code}</span>
                      <span className="text-muted-foreground">•</span>
                      <span>{asset.equipment_name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {asset.maintenance_company} - {asset.maintenance_work_site}
                    </div>
                  </div>
                  <Badge variant="destructive" className="font-semibold whitespace-nowrap">
                    ⏱️ {diffDays} {diffDays === 1 ? "dia" : "dias"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Filtros de Busca</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div className="space-y-2">
            <Label htmlFor="codigo_pat">Código do Patrimônio (PAT)</Label>
            <Input
              id="codigo_pat"
              placeholder="Ex: PAT001"
              value={filters.codigo_pat}
              onChange={(e) =>
                setFilters({ ...filters, codigo_pat: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data Inicial</Label>
            <Input
              id="data_inicio"
              type="date"
              value={filters.data_inicio}
              onChange={(e) =>
                setFilters({ ...filters, data_inicio: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_fim">Data Final</Label>
            <Input
              id="data_fim"
              type="date"
              value={filters.data_fim}
              onChange={(e) =>
                setFilters({ ...filters, data_fim: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_evento">Tipo de Evento</Label>
            <Select
              value={filters.tipo_evento}
              onValueChange={(value) =>
                setFilters({ ...filters, tipo_evento: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os eventos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                <SelectItem value="ALTERAÇÃO DE DADO">Alteração de Dado</SelectItem>
                <SelectItem value="ABERTURA DE ORDEM DE SERVIÇO">Abertura de OS</SelectItem>
                <SelectItem value="CONCLUSÃO DE ORDEM DE SERVIÇO">Conclusão de OS</SelectItem>
                <SelectItem value="TROCA DE COMPONENTE">Troca de Componente</SelectItem>
                <SelectItem value="INÍCIO DE LOCAÇÃO">Início de Locação</SelectItem>
                <SelectItem value="DEVOLUÇÃO DE LOCAÇÃO">Devolução de Locação</SelectItem>
                <SelectItem value="SAÍDA PARA CLIENTE">Saída para Cliente</SelectItem>
                <SelectItem value="TRANSFERÊNCIA INTERNA">Transferência Interna</SelectItem>
                <SelectItem value="ANEXO DE LAUDO">Anexo de Laudo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="campo">Campo Alterado (apenas para Alteração de Dado)</Label>
            <Select
              value={filters.campo}
              onValueChange={(value) =>
                setFilters({ ...filters, campo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os campos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os campos</SelectItem>
                <SelectItem value="Local do Equipamento">
                  Local do Equipamento
                </SelectItem>
                <SelectItem value="Nome do Equipamento">
                  Nome do Equipamento
                </SelectItem>
                <SelectItem value="Empresa de Locação">
                  Empresa de Locação
                </SelectItem>
                <SelectItem value="Obra de Locação">Obra de Locação</SelectItem>
                <SelectItem value="Empresa de Manutenção">
                  Empresa de Manutenção
                </SelectItem>
                <SelectItem value="Obra de Manutenção">
                  Obra de Manutenção
                </SelectItem>
                <SelectItem value="Observações">Observações</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex-1 md:flex-none">
            <Search className="h-4 w-4 mr-2" />
            Buscar
          </Button>
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex-1 md:flex-none"
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        ) : !historico || historico.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum registro encontrado com os filtros aplicados
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código PAT</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Tipo de Evento</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead>Usuário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((item) => (
                  <TableRow key={item.historico_id}>
                    <TableCell className="font-medium">
                      {item.codigo_pat}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(
                        new Date(item.data_modificacao),
                        "dd/MM/yyyy HH:mm",
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.tipo_evento}
                    </TableCell>
                    <TableCell>
                      {renderEventDetails(item)}
                    </TableCell>
                    <TableCell>{item.usuario_nome || "Sistema"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

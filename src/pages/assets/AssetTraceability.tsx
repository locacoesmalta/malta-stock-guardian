import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { ArrowLeft, Search, FileText } from "lucide-react";
import { format } from "date-fns";
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
  });

  const [searchFilters, setSearchFilters] = useState({
    codigo_pat: "",
    data_inicio: "",
    data_fim: "",
    usuario: "",
    campo: "",
  });

  const { data: historico, isLoading } = usePatrimonioHistoricoFiltered(searchFilters);

  const handleSearch = () => {
    setSearchFilters({
      ...filters,
      campo: filters.campo === "all" ? "" : filters.campo,
    });
  };

  const handleClear = () => {
    const emptyFilters = {
      codigo_pat: "",
      data_inicio: "",
      data_fim: "",
      usuario: "",
      campo: "all",
    };
    setFilters(emptyFilters);
    setSearchFilters({ ...emptyFilters, campo: "" });
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
          Rastreabilidade de Patrimônio
        </h1>
        <p className="text-muted-foreground mt-2">
          Consulte o histórico completo de alterações dos patrimônios
        </p>
      </div>

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
            <Label htmlFor="campo">Campo Alterado</Label>
            <Select
              value={filters.campo}
              onValueChange={(value) =>
                setFilters({ ...filters, campo: value === "all" ? "" : value })
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
                  <TableHead>Campo</TableHead>
                  <TableHead>Informação Anterior</TableHead>
                  <TableHead>Nova Informação</TableHead>
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
                    <TableCell>{item.campo_alterado}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.campo_alterado === "Local do Equipamento" &&
                      item.valor_antigo
                        ? formatLocationLabel(item.valor_antigo)
                        : item.valor_antigo || "-"}
                    </TableCell>
                    <TableCell>
                      {item.campo_alterado === "Local do Equipamento" &&
                      item.valor_novo
                        ? formatLocationLabel(item.valor_novo)
                        : item.valor_novo || "-"}
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

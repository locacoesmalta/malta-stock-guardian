import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePatrimonioHistorico } from "@/hooks/usePatrimonioHistorico";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { History, Loader2 } from "lucide-react";

interface AssetHistorySectionProps {
  assetId: string;
}

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

export const AssetHistorySection = React.memo(({ assetId }: AssetHistorySectionProps) => {
  const { data: historico, isLoading } = usePatrimonioHistorico(assetId);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (!historico || historico.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma alteração registrada para este patrimônio
          </p>
        </div>
      </Card>
    );
  }

  const renderEventDetails = (item: any) => {
    // Se tem detalhes_evento, mostrar ele (eventos novos)
    if (item.detalhes_evento) {
      return <span className="text-sm">{item.detalhes_evento}</span>;
    }

    // Senão, mostrar no formato antigo (campo_alterado com valores)
    if (item.campo_alterado) {
      const valorAntigo = item.campo_alterado === "Local do Equipamento" && item.valor_antigo
        ? formatLocationLabel(item.valor_antigo)
        : item.valor_antigo || "-";
      
      const valorNovo = item.campo_alterado === "Local do Equipamento" && item.valor_novo
        ? formatLocationLabel(item.valor_novo)
        : item.valor_novo || "-";

      return (
        <span className="text-sm">
          <span className="font-medium">{item.campo_alterado}:</span>{" "}
          <span className="text-muted-foreground">{valorAntigo}</span>
          {" → "}
          <span>{valorNovo}</span>
        </span>
      );
    }

    return <span className="text-muted-foreground text-sm">-</span>;
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <History className="h-5 w-5" />
        Linha do Tempo do Ativo
      </h2>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tipo de Evento</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Usuário</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historico.map((item) => (
              <TableRow key={item.historico_id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(item.data_modificacao), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="font-medium">{item.tipo_evento}</TableCell>
                <TableCell>{renderEventDetails(item)}</TableCell>
                <TableCell>{item.usuario_nome || "Sistema"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
});

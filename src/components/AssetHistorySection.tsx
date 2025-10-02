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

const renderEventDetails = (item: any) => {
  // Se for uma alteração de dado, mostra valor antigo -> valor novo
  if (item.tipo_evento === "ALTERAÇÃO DE DADO" && item.campo_alterado) {
    const valorAntigo = item.campo_alterado === "Local do Equipamento" && item.valor_antigo
      ? formatLocationLabel(item.valor_antigo)
      : item.valor_antigo || "-";
    
    const valorNovo = item.campo_alterado === "Local do Equipamento" && item.valor_novo
      ? formatLocationLabel(item.valor_novo)
      : item.valor_novo || "-";

    return (
      <div className="text-sm">
        <span className="font-medium">{item.campo_alterado}:</span>{" "}
        <span className="text-muted-foreground">{valorAntigo}</span>
        {" → "}
        <span>{valorNovo}</span>
      </div>
    );
  }

  // Para outros eventos, mostra os detalhes
  return (
    <div className="text-sm">
      {item.detalhes_evento || "Sem detalhes"}
    </div>
  );
};

export const AssetHistorySection = ({ assetId }: AssetHistorySectionProps) => {
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
            Nenhum evento registrado para este patrimônio
          </p>
        </div>
      </Card>
    );
  }

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
    </Card>
  );
};

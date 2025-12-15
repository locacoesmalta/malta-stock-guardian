import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus, Archive } from "lucide-react";
import { formatBRFromYYYYMMDD } from "@/lib/dateUtils";

interface PendingWithdrawal {
  id: string;
  product_id: string;
  quantity: number;
  withdrawal_date: string;
  products: {
    code: string;
    name: string;
  };
}

interface PendingWithdrawalsAlertProps {
  withdrawals: PendingWithdrawal[];
  equipmentCode: string;
  onKeepHistory: () => void;
  onNewCycle: () => void;
}

export const PendingWithdrawalsAlert = ({
  withdrawals,
  equipmentCode,
  onKeepHistory,
  onNewCycle
}: PendingWithdrawalsAlertProps) => {
  if (withdrawals.length === 0) return null;

  return (
    <Card className="border-amber-500 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <AlertTriangle className="h-5 w-5" />
          Peças Pendentes Detectadas - PAT {equipmentCode}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-600 bg-amber-100">
          <AlertDescription className="text-sm text-amber-900">
            <strong>Atenção!</strong> Este equipamento possui <strong>{withdrawals.length} peça(s)</strong> retirada(s) anteriormente que ainda não foram usadas em nenhum relatório.
          </AlertDescription>
        </Alert>

        {/* Lista de peças pendentes */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {withdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <div className="font-medium text-sm">{w.products.name}</div>
                <div className="text-xs text-muted-foreground">
                  Código: {w.products.code} • Retirada em {formatBRFromYYYYMMDD(w.withdrawal_date)}
                </div>
              </div>
              <Badge variant="outline" className="ml-2">
                {w.quantity} un
              </Badge>
            </div>
          ))}
        </div>

        {/* Opções */}
        <div className="space-y-3 pt-3 border-t">
          <p className="text-sm font-medium">O que deseja fazer?</p>
          
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start border-green-600 text-green-700 hover:bg-green-50"
            onClick={onKeepHistory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Manter Histórico Anterior e Adicionar Novas Peças
            <span className="ml-auto text-xs">(Recomendado)</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full justify-start border-blue-600 text-blue-700 hover:bg-blue-50"
            onClick={onNewCycle}
          >
            <Archive className="h-4 w-4 mr-2" />
            Arquivar Peças Antigas e Iniciar Novo Ciclo
            <span className="ml-auto text-xs">(Nova manutenção)</span>
          </Button>
        </div>

        {/* Explicação */}
        <Alert className="border-blue-500 bg-blue-50">
          <AlertDescription className="text-xs text-blue-900">
            <strong>Manter histórico:</strong> As peças antigas continuam disponíveis para uso em relatórios futuros.<br/>
            <strong>Novo ciclo:</strong> As peças antigas serão arquivadas (não poderão mais ser usadas) e você começará um novo registro limpo.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

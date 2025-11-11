import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Calendar, MapPin, Building2, AlertCircle, CheckCircle2, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportPart {
  id: string;
  product_id: string;
  quantity_used: number;
  withdrawal_id: string | null;
  products: {
    code: string;
    name: string;
    purchase_price: number | null;
  };
  material_withdrawals: {
    id: string;
    withdrawal_date: string;
    withdrawal_reason: string | null;
    work_site: string;
    company: string;
  } | null;
}

interface ReportPartsTraceabilityProps {
  parts: ReportPart[];
}

export const ReportPartsTraceability = ({ parts }: ReportPartsTraceabilityProps) => {
  if (parts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma peça registrada neste relatório.
        </AlertDescription>
      </Alert>
    );
  }

  const totalCost = parts.reduce((sum, part) => {
    const price = part.products.purchase_price || 0;
    return sum + (price * part.quantity_used);
  }, 0);

  const partsWithTraceability = parts.filter(p => p.withdrawal_id && p.material_withdrawals);
  const partsWithoutTraceability = parts.filter(p => !p.withdrawal_id || !p.material_withdrawals);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Peças Utilizadas ({parts.length})
          </span>
          <Badge variant="outline" className="font-mono text-base">
            Custo Total: R$ {totalCost.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Peças com rastreabilidade */}
        {partsWithTraceability.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              Peças Rastreáveis ({partsWithTraceability.length})
            </div>
            {partsWithTraceability.map((part) => {
              const unitPrice = part.products.purchase_price || 0;
              const lineCost = unitPrice * part.quantity_used;
              const withdrawal = part.material_withdrawals!;

              return (
                <div key={part.id} className="border rounded-lg p-4 bg-green-50/50">
                  {/* Informações do Produto */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="font-semibold text-base">
                        {part.products.code} - {part.products.name}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>Quantidade: {part.quantity_used} un</span>
                        <span>R$ {unitPrice.toFixed(2)} × {part.quantity_used}</span>
                        <span className="font-medium text-foreground">= R$ {lineCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vínculo de Rastreabilidade */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 mb-2">
                      <LinkIcon className="h-3 w-3" />
                      Rastreabilidade - Retirada de Material
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Data Retirada:</span>
                        <span className="font-medium">
                          {format(new Date(withdrawal.withdrawal_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Obra:</span>
                        <span className="font-medium">{withdrawal.work_site}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Empresa:</span>
                        <span className="font-medium">{withdrawal.company}</span>
                      </div>
                      {withdrawal.withdrawal_reason && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Motivo: </span>
                          <span className="italic">{withdrawal.withdrawal_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Peças sem rastreabilidade (legado) */}
        {partsWithoutTraceability.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <AlertCircle className="h-4 w-4" />
              Peças sem Rastreabilidade ({partsWithoutTraceability.length})
            </div>
            {partsWithoutTraceability.map((part) => {
              const unitPrice = part.products.purchase_price || 0;
              const lineCost = unitPrice * part.quantity_used;

              return (
                <div key={part.id} className="border rounded-lg p-4 bg-amber-50/50">
                  <div className="font-semibold text-base">
                    {part.products.code} - {part.products.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>Quantidade: {part.quantity_used} un</span>
                    <span>R$ {unitPrice.toFixed(2)} × {part.quantity_used}</span>
                    <span className="font-medium text-foreground">= R$ {lineCost.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-sm text-amber-700">
                    ⚠️ Peça adicionada antes da implementação do sistema de rastreabilidade
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Total */}
        <div className="border-t pt-3 flex justify-between items-center font-semibold">
          <span>CUSTO TOTAL DAS PEÇAS:</span>
          <span className="text-lg">R$ {totalCost.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

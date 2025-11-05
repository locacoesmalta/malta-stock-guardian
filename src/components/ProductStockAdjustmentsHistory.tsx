import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockAdjustments } from "@/hooks/useStockAdjustments";
import { format } from "date-fns";
import { ArrowUp, ArrowDown, User } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
}

export const ProductStockAdjustmentsHistory = ({ productId, productName }: Props) => {
  const { data: adjustments, isLoading } = useStockAdjustments(productId);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando histórico...</div>;
  
  if (!adjustments || adjustments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ajustes Manuais de Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum ajuste manual registrado para este produto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Histórico de Ajustes Manuais</CardTitle>
        <p className="text-xs text-muted-foreground">
          Alterações diretas na quantidade realizadas por SUPERUSERS
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {adjustments.map((adj) => (
            <div
              key={adj.id}
              className="flex items-start gap-3 p-3 border rounded-lg"
            >
              <div className={`p-2 rounded-full ${adj.quantity_change > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {adj.quantity_change > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {adj.previous_quantity} → {adj.new_quantity}
                  </span>
                  <span className={`text-xs font-semibold ${adj.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {adj.quantity_change > 0 ? '+' : ''}{adj.quantity_change}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(adj.adjustment_date), "dd/MM/yyyy HH:mm")}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{adj.profiles?.full_name || adj.profiles?.email}</span>
                </div>
                {adj.reason && (
                  <p className="text-xs italic text-muted-foreground">{adj.reason}</p>
                )}
                {adj.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{adj.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

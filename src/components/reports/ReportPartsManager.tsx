import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Minus, AlertCircle, Package } from "lucide-react";

interface ReportPart {
  withdrawal_id: string;
  product_id: string;
  quantity_used: number;
  quantity_withdrawn: number;
  productName: string;
  productCode: string;
  purchasePrice: number | null;
}

interface ReportPartsManagerProps {
  parts: ReportPart[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  loadingWithdrawals: boolean;
}

export const ReportPartsManager = ({
  parts,
  onUpdateQuantity,
  loadingWithdrawals,
}: ReportPartsManagerProps) => {
  if (loadingWithdrawals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Peças Utilizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Peças Utilizadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {parts.length === 0 ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Nenhuma peça retirada encontrada para este equipamento. 
              Registre a retirada de material antes de criar o relatório.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {parts.map((part, index) => (
              <div
                key={part.withdrawal_id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{part.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    Código: {part.productCode}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quantidade retirada: {part.quantity_withdrawn}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(index, part.quantity_used - 1)}
                    disabled={part.quantity_used <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Badge variant="secondary" className="min-w-[60px] justify-center">
                    {part.quantity_used} / {part.quantity_withdrawn}
                  </Badge>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onUpdateQuantity(index, part.quantity_used + 1)}
                    disabled={part.quantity_used >= part.quantity_withdrawn}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {parts.length > 0 && (
          <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              Ajuste a quantidade de peças usadas neste relatório. A quantidade não pode exceder o total retirado.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

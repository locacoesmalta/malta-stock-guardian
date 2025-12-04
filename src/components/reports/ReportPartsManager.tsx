import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Minus, AlertCircle, Package, Trash2 } from "lucide-react";

interface ReportPart {
  withdrawal_id: string;
  product_id: string;
  quantity_used: number;
  quantity_withdrawn: number;
  productName: string;
  productCode: string;
  purchasePrice: number | null;
  customDescription?: string;
  isNonCataloged?: boolean;
  isRemoved?: boolean;
}

interface ReportPartsManagerProps {
  parts: ReportPart[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemovePart?: (index: number) => void;
  loadingWithdrawals: boolean;
}

export const ReportPartsManager = ({
  parts,
  onUpdateQuantity,
  onRemovePart,
  loadingWithdrawals,
}: ReportPartsManagerProps) => {
  // Filter out removed parts for display
  const visibleParts = parts.filter(p => !p.isRemoved);
  const selectedCount = visibleParts.filter(p => p.quantity_used > 0).length;

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
        <div className="flex items-center justify-between">
          <CardTitle>Peças Utilizadas</CardTitle>
          {visibleParts.length > 0 && (
            <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
              {selectedCount} de {visibleParts.length} selecionadas
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleParts.length === 0 ? (
          <Alert>
            <Package className="h-4 w-4" />
            <AlertDescription>
              Nenhuma peça retirada encontrada para este equipamento. 
              Registre a retirada de material antes de criar o relatório.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {parts.map((part, index) => {
              if (part.isRemoved) return null;
              
              const isZeroQuantity = part.quantity_used === 0;
              
              return (
                <div
                  key={`${part.withdrawal_id}-${index}`}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg transition-colors ${
                    isZeroQuantity 
                      ? "bg-muted/20 border-dashed opacity-60" 
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium text-sm truncate">{part.productName}</div>
                      {part.isNonCataloged && (
                        <Badge variant="outline" className="text-xs">
                          Não Catalogado
                        </Badge>
                      )}
                      {isZeroQuantity && (
                        <Badge variant="secondary" className="text-xs">
                          Não selecionada
                        </Badge>
                      )}
                    </div>
                    {part.isNonCataloged ? (
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Descrição:</span> {part.customDescription}
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-muted-foreground">
                          Código: {part.productCode}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Quantidade disponível: {part.quantity_withdrawn}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onUpdateQuantity(index, part.quantity_used - 1)}
                      disabled={part.quantity_used <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    
                    <Badge 
                      variant={isZeroQuantity ? "secondary" : "default"} 
                      className="min-w-[60px] justify-center"
                    >
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

                    {onRemovePart && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onRemovePart(index)}
                        title="Remover peça da lista"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {visibleParts.length > 0 && (
          <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              Ajuste a quantidade de peças usadas neste relatório. Peças com quantidade 0 não serão incluídas.
              {onRemovePart && " Use o botão de lixeira para remover peças adicionadas por engano."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

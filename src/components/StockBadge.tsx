import React from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface StockBadgeProps {
  quantity: number;
  minQuantity: number;
}

export const StockBadge = React.memo(({ quantity, minQuantity }: StockBadgeProps) => {
  const percentage = (quantity / minQuantity) * 100;

  if (quantity <= 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Sem estoque
      </Badge>
    );
  }

  if (quantity <= minQuantity) {
    return (
      <Badge className="gap-1 bg-[hsl(var(--warning))] text-white hover:bg-[hsl(var(--warning))]/90">
        <AlertTriangle className="h-3 w-3" />
        Estoque baixo
      </Badge>
    );
  }

  return (
    <Badge className="gap-1 bg-[hsl(var(--success))] text-white hover:bg-[hsl(var(--success))]/90">
      <CheckCircle className="h-3 w-3" />
      Estoque OK
    </Badge>
  );
});

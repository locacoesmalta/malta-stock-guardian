import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface NegativeStockBadgeProps {
  currentStock: number;
  afterWithdrawal: number;
}

export const NegativeStockBadge = ({ 
  currentStock, 
  afterWithdrawal 
}: NegativeStockBadgeProps) => {
  if (afterWithdrawal >= 0) return null;

  return (
    <Badge variant="destructive" className="gap-1 animate-pulse">
      <AlertTriangle className="h-3 w-3" />
      Estoque Negativo ({afterWithdrawal})
    </Badge>
  );
};

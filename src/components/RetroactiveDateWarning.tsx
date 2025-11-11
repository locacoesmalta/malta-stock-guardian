import { AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface RetroactiveDateWarningProps {
  selectedDate: string;
}

export function RetroactiveDateWarning({ selectedDate }: RetroactiveDateWarningProps) {
  const movementDate = new Date(selectedDate);
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - movementDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) return null;

  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="flex items-center gap-2">
        <Badge variant="outline" className="bg-amber-500/20 text-amber-700 border-amber-500/50">
          <Calendar className="h-3 w-3 mr-1" />
          Movimentação Retroativa
        </Badge>
        <span className="text-sm text-amber-700">
          {daysDiff === 1 
            ? "Data é de 1 dia atrás" 
            : `Data é de ${daysDiff} dias atrás`}
        </span>
      </AlertDescription>
    </Alert>
  );
}

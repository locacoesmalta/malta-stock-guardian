import { AlertCircle, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { getNowInBelem, parseLocalDate, getDaysDifference } from "@/lib/dateUtils";

interface RetroactiveDateWarningProps {
  selectedDate: string;
}

export function RetroactiveDateWarning({ selectedDate }: RetroactiveDateWarningProps) {
  const movementDate = parseLocalDate(selectedDate);
  const today = getNowInBelem();
  const daysDiff = getDaysDifference(today, movementDate);

  if (daysDiff <= 0) return null;

  // Alerta mais severo para datas > 90 dias (limite do trigger SQL)
  const isVerySevere = daysDiff > 90;
  const isSevere = daysDiff > 30;

  return (
    <Alert className={
      isVerySevere 
        ? "border-red-500/50 bg-red-500/10" 
        : isSevere 
        ? "border-orange-500/50 bg-orange-500/10"
        : "border-amber-500/50 bg-amber-500/10"
    }>
      <AlertCircle className={`h-4 w-4 ${
        isVerySevere ? "text-red-500" : isSevere ? "text-orange-500" : "text-amber-500"
      }`} />
      <AlertDescription className="flex items-center gap-2">
        <Badge variant="outline" className={
          isVerySevere
            ? "bg-red-500/20 text-red-700 border-red-500/50"
            : isSevere
            ? "bg-orange-500/20 text-orange-700 border-orange-500/50"
            : "bg-amber-500/20 text-amber-700 border-amber-500/50"
        }>
          <Calendar className="h-3 w-3 mr-1" />
          {isVerySevere ? "⚠️ Data Muito Antiga" : "Movimentação Retroativa"}
        </Badge>
        <span className={`text-sm ${
          isVerySevere ? "text-red-700 font-medium" : isSevere ? "text-orange-700" : "text-amber-700"
        }`}>
          {daysDiff === 1 
            ? "Data é de 1 dia atrás" 
            : `Data é de ${daysDiff} dias atrás`}
          {isVerySevere && " - Requer justificativa detalhada!"}
        </span>
      </AlertDescription>
    </Alert>
  );
}

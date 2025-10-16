import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Clock, AlertCircle } from "lucide-react";

interface DeadlineStatusBadgeProps {
  inspectionStartDate: string;
}

export function DeadlineStatusBadge({ inspectionStartDate }: DeadlineStatusBadgeProps) {
  const BELEM_TIMEZONE = "America/Belem";
  
  // Converter para o timezone de Belém - PA
  const inspectionStart = toZonedTime(parseISO(inspectionStartDate), BELEM_TIMEZONE);
  const today = toZonedTime(new Date(), BELEM_TIMEZONE);
  const daysSinceInspection = differenceInDays(today, inspectionStart);

  // Prazo de 6 dias para devolução do laudo
  const isOverdue = daysSinceInspection > 6;

  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t">
      <Badge
        variant={isOverdue ? "destructive" : "default"}
        className="flex items-center gap-1"
      >
        {isOverdue ? (
          <>
            <AlertCircle className="h-3 w-3" />
            ATRASADO
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            NO PRAZO
          </>
        )}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {daysSinceInspection} {daysSinceInspection === 1 ? "dia" : "dias"} aguardando laudo
      </span>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { getNowInBelem, parseLocalDate, getDaysDifference } from "@/lib/dateUtils";

interface DeadlineStatusBadgeProps {
  inspectionStartDate: string;
}

export function DeadlineStatusBadge({ inspectionStartDate }: DeadlineStatusBadgeProps) {
  // Usar funções centralizadas do dateUtils
  const inspectionStart = parseLocalDate(inspectionStartDate);
  const today = getNowInBelem();
  const daysSinceInspection = getDaysDifference(today, inspectionStart);

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

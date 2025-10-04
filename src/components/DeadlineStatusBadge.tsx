import React from "react";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";

interface DeadlineStatusBadgeProps {
  inspectionStartDate: string;
}

export const DeadlineStatusBadge = React.memo(({ inspectionStartDate }: DeadlineStatusBadgeProps) => {
  const inspectionStart = parseISO(inspectionStartDate);
  const today = new Date();
  const daysSinceInspection = differenceInDays(today, inspectionStart);

  const isOverdue = daysSinceInspection > 5;

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
});

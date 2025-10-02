import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";

interface DeadlineStatusBadgeProps {
  createdAt: string;
}

export function DeadlineStatusBadge({ createdAt }: DeadlineStatusBadgeProps) {
  const created = parseISO(createdAt);
  const today = new Date();
  const daysSinceCreation = differenceInDays(today, created);

  const isOverdue = daysSinceCreation > 6;

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
        {daysSinceCreation} {daysSinceCreation === 1 ? "dia" : "dias"} aguardando laudo
      </span>
    </div>
  );
}

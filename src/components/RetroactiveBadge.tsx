import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RetroactiveBadgeProps {
  effectiveDate: string | Date;
  registrationDate: string | Date;
  notes?: string | null;
  size?: "sm" | "md";
}

export function RetroactiveBadge({
  effectiveDate,
  registrationDate,
  notes,
  size = "md",
}: RetroactiveBadgeProps) {
  const effective = new Date(effectiveDate);
  const registration = new Date(registrationDate);
  const daysDelay = differenceInDays(registration, effective);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${
              size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1"
            } border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40`}
          >
            <Clock className={`${size === "sm" ? "h-3 w-3" : "h-4 w-4"} mr-1`} />
            Cadastro Retroativo
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              Registrado {daysDelay} dias após entrada
            </p>
            <p className="text-sm">
              <strong>Entrada real:</strong>{" "}
              {format(effective, "dd/MM/yyyy", { locale: ptBR })}
            </p>
            <p className="text-sm">
              <strong>Registro no sistema:</strong>{" "}
              {format(registration, "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {notes && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Justificativa:</strong> {notes}
                </p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

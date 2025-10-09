import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { Clock, AlertCircle } from "lucide-react";

interface ContractExpirationBadgeProps {
  contractEndDate: string;
}

export function ContractExpirationBadge({ contractEndDate }: ContractExpirationBadgeProps) {
  const endDate = parseISO(contractEndDate);
  const today = new Date();
  const daysUntilExpiration = differenceInDays(endDate, today);

  const isExpiringSoon = daysUntilExpiration <= 5 && daysUntilExpiration >= 0;
  const isExpired = daysUntilExpiration < 0;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={isExpired ? "destructive" : isExpiringSoon ? "destructive" : "default"}
        className="flex items-center gap-1"
      >
        {isExpired || isExpiringSoon ? (
          <>
            <AlertCircle className="h-3 w-3" />
            {isExpired ? "VENCIDO" : "VENCE EM BREVE"}
          </>
        ) : (
          <>
            <Clock className="h-3 w-3" />
            VIGENTE
          </>
        )}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {isExpired
          ? `Vencido há ${Math.abs(daysUntilExpiration)} ${Math.abs(daysUntilExpiration) === 1 ? "dia" : "dias"}`
          : daysUntilExpiration === 0
          ? "Vence hoje"
          : `${daysUntilExpiration} ${daysUntilExpiration === 1 ? "dia" : "dias"} até vencer`}
      </span>
    </div>
  );
}

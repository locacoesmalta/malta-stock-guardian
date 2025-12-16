import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";
import { Clock, AlertCircle, CheckCircle, Play } from "lucide-react";

interface ContractExpirationBadgeProps {
  contractEndDate: string | null | undefined;
  allEquipmentReturned?: boolean;
}

export function ContractExpirationBadge({ 
  contractEndDate, 
  allEquipmentReturned = false 
}: ContractExpirationBadgeProps) {
  // Se todos equipamentos foram devolvidos, contrato está finalizado
  if (allEquipmentReturned) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          FINALIZADO
        </Badge>
        <span className="text-xs text-muted-foreground">
          Todos os equipamentos foram devolvidos
        </span>
      </div>
    );
  }

  // Se não tem data final, contrato está em andamento
  if (!contractEndDate) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          <Play className="h-3 w-3" />
          EM ANDAMENTO
        </Badge>
        <span className="text-xs text-muted-foreground">
          Aguardando devolução de equipamentos
        </span>
      </div>
    );
  }

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

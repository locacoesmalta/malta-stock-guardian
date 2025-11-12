import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { useAvailablePartsByPAT } from "@/hooks/useAvailablePartsByPAT";
import { RetroactiveBadge } from "@/components/RetroactiveBadge";
import { differenceInDays } from "date-fns";

interface AssetCardHeaderProps {
  assetCode: string;
  equipmentName: string;
  maltaCollaborator?: string | null;
  locationLabel: string;
  locationVariant: "default" | "secondary" | "outline" | "destructive" | "warning";
  effectiveRegistrationDate?: string | null;
  createdAt?: string;
  retroactiveRegistrationNotes?: string | null;
}

/**
 * Componente de cabeçalho do card de ativo com badge de peças disponíveis
 */
export const AssetCardHeader = ({
  assetCode,
  equipmentName,
  maltaCollaborator,
  locationLabel,
  locationVariant,
  effectiveRegistrationDate,
  createdAt,
  retroactiveRegistrationNotes,
}: AssetCardHeaderProps) => {
  const { data: availableParts = 0 } = useAvailablePartsByPAT(assetCode);

  // Verificar se é cadastro retroativo (diferença > 30 dias)
  const isRetroactive =
    effectiveRegistrationDate &&
    createdAt &&
    differenceInDays(new Date(createdAt), new Date(effectiveRegistrationDate)) > 30;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-3 mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base sm:text-lg break-words">{equipmentName}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">PAT: {assetCode}</p>
        {maltaCollaborator && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            Responsável: {maltaCollaborator}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {availableParts > 0 && (
            <Badge
              variant="outline"
              className="text-xs border-green-600 text-green-700 dark:text-green-400"
            >
              <Package className="h-3 w-3 mr-1" />
              {availableParts} {availableParts === 1 ? "peça disponível" : "peças disponíveis"}
            </Badge>
          )}
          {isRetroactive && (
            <RetroactiveBadge
              effectiveDate={effectiveRegistrationDate}
              registrationDate={createdAt}
              notes={retroactiveRegistrationNotes}
              size="sm"
            />
          )}
        </div>
      </div>
      <Badge variant={locationVariant} className="text-xs whitespace-nowrap flex-shrink-0">
        {locationLabel}
      </Badge>
    </div>
  );
};

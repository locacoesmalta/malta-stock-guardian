import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { useAvailablePartsByPAT } from "@/hooks/useAvailablePartsByPAT";

interface AssetCardHeaderProps {
  assetCode: string;
  equipmentName: string;
  maltaCollaborator?: string | null;
  locationLabel: string;
  locationVariant: "default" | "secondary" | "outline" | "destructive" | "warning";
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
}: AssetCardHeaderProps) => {
  const { data: availableParts = 0 } = useAvailablePartsByPAT(assetCode);

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
        {availableParts > 0 && (
          <Badge
            variant="outline"
            className="mt-2 text-xs border-green-600 text-green-700 dark:text-green-400"
          >
            <Package className="h-3 w-3 mr-1" />
            {availableParts} {availableParts === 1 ? "peça disponível" : "peças disponíveis"}
          </Badge>
        )}
      </div>
      <Badge variant={locationVariant} className="text-xs whitespace-nowrap flex-shrink-0">
        {locationLabel}
      </Badge>
    </div>
  );
};

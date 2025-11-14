import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DateValidationTooltipProps {
  type: "substitution" | "rental" | "maintenance" | "generic";
  equipmentCode?: string;
  registrationDate?: string;
}

export function DateValidationTooltip({ 
  type, 
  equipmentCode, 
  registrationDate 
}: DateValidationTooltipProps) {
  const getTooltipContent = () => {
    const baseRules = [
      "✅ Data não pode ser futura",
      "⚠️ Datas retroativas exigem confirmação",
    ];

    switch (type) {
      case "substitution":
        return [
          ...baseRules,
          "🔒 Data deve ser posterior ao cadastro do equipamento NOVO",
          equipmentCode && registrationDate
            ? `📅 ${equipmentCode} foi cadastrado em ${registrationDate}`
            : null,
        ].filter(Boolean);

      case "rental":
        return [
          ...baseRules,
          "🔒 Data de início deve ser posterior ao cadastro do equipamento",
          "📋 Data de término deve ser posterior à data de início",
        ];

      case "maintenance":
        return [
          ...baseRules,
          "🔒 Data de chegada deve ser posterior ao cadastro do equipamento",
          "📋 Data de saída deve ser posterior à data de chegada",
        ];

      case "generic":
      default:
        return baseRules;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold text-sm">Regras de Validação:</p>
            {getTooltipContent().map((rule, index) => (
              <p key={index} className="text-xs">
                {rule}
              </p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { formatPAT } from "@/lib/patUtils";

interface Equipment {
  equipment_name: string;
}

interface ReportEquipmentSelectorProps {
  equipmentCode: string;
  equipmentName: string;
  onEquipmentCodeChange: (value: string) => void;
  onEquipmentNameChange: (value: string) => void;
  onEquipmentCodeBlur: (value: string) => void;
  equipment: Equipment | null;
  loadingEquipment: boolean;
}

export const ReportEquipmentSelector = ({
  equipmentCode,
  equipmentName,
  onEquipmentCodeChange,
  onEquipmentNameChange,
  onEquipmentCodeBlur,
  equipment,
  loadingEquipment,
}: ReportEquipmentSelectorProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="equipment_code">Patrimônio (PAT) * (6 dígitos)</Label>
        <div className="relative">
          <Input
            id="equipment_code"
            type="text"
            value={equipmentCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 6) {
                onEquipmentCodeChange(value);
              }
            }}
            onBlur={(e) => onEquipmentCodeBlur(e.target.value)}
            placeholder="000000"
            maxLength={6}
            required
            className="font-mono"
          />
          {loadingEquipment && equipmentCode && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
        {equipmentCode && !loadingEquipment && (
          equipment ? (
            <Alert className="mt-2 border-green-500/50 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-xs text-green-700 dark:text-green-300">
                Equipamento encontrado: {equipment.equipment_name}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="mt-2 border-red-500/50 bg-red-50 dark:bg-red-950/20">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-xs text-red-700 dark:text-red-300">
                Equipamento não encontrado. Verifique o PAT.
              </AlertDescription>
            </Alert>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="equipment_name">Equipamento *</Label>
        <Input
          id="equipment_name"
          value={equipmentName}
          onChange={(e) => onEquipmentNameChange(e.target.value)}
          placeholder="Nome do equipamento"
          required
          readOnly={!!equipment}
          className={equipment ? "bg-muted cursor-not-allowed" : ""}
        />
        {equipment && (
          <p className="text-xs text-muted-foreground">
            Preenchido automaticamente do cadastro do equipamento
          </p>
        )}
      </div>
    </div>
  );
};

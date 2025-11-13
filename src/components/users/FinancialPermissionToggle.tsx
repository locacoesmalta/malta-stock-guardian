import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

interface FinancialPermissionToggleProps {
  hasPermission: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}

export function FinancialPermissionToggle({
  hasPermission,
  onToggle,
  disabled = false,
}: FinancialPermissionToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <div className="space-y-0.5">
          <Label htmlFor="financial-permission" className="text-base font-medium">
            Acesso a Dados Financeiros
          </Label>
          <p className="text-sm text-muted-foreground">
            Permite visualizar e gerenciar caixa e transações financeiras
          </p>
        </div>
      </div>
      <Switch
        id="financial-permission"
        checked={hasPermission}
        onCheckedChange={onToggle}
        disabled={disabled}
      />
    </div>
  );
}

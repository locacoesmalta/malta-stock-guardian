import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";

interface Permission {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface ModulePermissionCardProps {
  title: string;
  icon: LucideIcon;
  permissions: Permission[];
  values: Record<string, boolean>;
  allEnabled: boolean;
  onToggleAll: () => void;
  onTogglePermission: (key: string, value: boolean) => void;
  disabled?: boolean;
}

export const ModulePermissionCard = ({
  title,
  icon: Icon,
  permissions,
  values,
  allEnabled,
  onToggleAll,
  onTogglePermission,
  disabled = false,
}: ModulePermissionCardProps) => {
  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="w-4 h-4 text-primary" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor={`module-${title}`} className="text-xs text-muted-foreground">
              Ativar Completo
            </Label>
            <Switch
              id={`module-${title}`}
              checked={allEnabled}
              onCheckedChange={onToggleAll}
              disabled={disabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {permissions.map((perm) => (
          <div key={perm.key} className="flex items-center justify-between py-1">
            <Label htmlFor={perm.key} className="flex items-center gap-2 cursor-pointer">
              <perm.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm">{perm.label}</span>
            </Label>
            <Switch
              id={perm.key}
              checked={values[perm.key] || false}
              onCheckedChange={(checked) => onTogglePermission(perm.key, checked)}
              disabled={disabled}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

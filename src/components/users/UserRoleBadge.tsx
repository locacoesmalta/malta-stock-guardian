import { Shield, Crown, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRoleBadgeProps {
  role: "admin" | "superuser" | "user";
}

export const UserRoleBadge = ({ role }: UserRoleBadgeProps) => {
  const roleConfig = {
    admin: {
      icon: Crown,
      label: "ADMINISTRADOR",
      variant: "default" as const,
      className: "bg-gradient-to-r from-amber-500 to-yellow-600 text-white",
    },
    superuser: {
      icon: Shield,
      label: "SUPERUSUÁRIO",
      variant: "secondary" as const,
      className: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
    },
    user: {
      icon: User,
      label: "USUÁRIO",
      variant: "outline" as const,
      className: "border-muted-foreground/30",
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};

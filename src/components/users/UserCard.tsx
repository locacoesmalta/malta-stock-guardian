import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserRoleBadge } from "./UserRoleBadge";
import { UserPermissionsManager } from "./UserPermissionsManager";
import { KeyRound, History, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useUserManagement } from "@/hooks/useUserManagement";
import { formatBRFromYYYYMMDD } from "@/lib/dateUtils";

interface UserCardProps {
  user: any;
  isOwner: boolean;
}

export const UserCard = ({ user, isOwner }: UserCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { updatePermission, updateUserRole, resetPassword } = useUserManagement();

  const isAdmin = user.user_roles?.some((r: any) => r.role === "admin");
  const isSuperuser = user.user_roles?.some((r: any) => r.role === "superuser");
  const isUser = !isAdmin && !isSuperuser;

  const userRole = isAdmin ? "admin" : isSuperuser ? "superuser" : "user";
  const isActive = user.user_permissions?.is_active;

  const hasNoPermissions =
    !isActive &&
    !isAdmin &&
    !user.user_permissions?.can_view_products &&
    !user.user_permissions?.can_access_assets &&
    !user.user_permissions?.can_view_reports;

  return (
    <Card className={`${isOwner ? "border-amber-500/50 bg-amber-50/5" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{user.full_name || "Sem nome"}</h3>
              {isOwner && (
                <Badge variant="default" className="bg-gradient-to-r from-amber-500 to-yellow-600">
                  👑 OWNER
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <UserRoleBadge role={userRole} />
              {isActive ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-amber-600 text-white">
                  <Clock className="w-3 h-3 mr-1" />
                  Pendente
                </Badge>
              )}
              {hasNoPermissions && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Sem Permissões
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrado em {formatBRFromYYYYMMDD(user.created_at?.split('T')[0] || '')}
            </p>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Status e Ações Rápidas */}
            <div className="flex flex-wrap gap-2 pb-3 border-b">
              <div className="flex items-center gap-2">
                <Label htmlFor={`active-${user.id}`} className="text-sm font-medium">
                  Status:
                </Label>
                <Switch
                  id={`active-${user.id}`}
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    updatePermission.mutate({
                      userId: user.id,
                      permission: "is_active",
                      value: checked,
                    })
                  }
                  disabled={isOwner}
                />
                <span className="text-sm text-muted-foreground">
                  {isActive ? "Ativo" : "Inativo"}
                </span>
              </div>

              {!isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetPassword.mutate(user.id)}
                  disabled={resetPassword.isPending}
                >
                  <KeyRound className="w-3 h-3 mr-1" />
                  Reset Senha
                </Button>
              )}

              <Button variant="outline" size="sm" disabled>
                <History className="w-3 h-3 mr-1" />
                Histórico
              </Button>
            </div>

            {/* Alteração de Nível (apenas para não-owner, não-admin) */}
            {!isOwner && !isAdmin && (
              <div className="space-y-2 pb-3 border-b">
                <Label className="text-sm font-medium">Alterar Nível:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={isUser ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateUserRole.mutate({ userId: user.id, newRole: "user" })}
                    disabled={updateUserRole.isPending}
                  >
                    👤 Usuário
                  </Button>
                  <Button
                    variant={isSuperuser ? "default" : "outline"}
                    size="sm"
                    onClick={() =>
                      updateUserRole.mutate({ userId: user.id, newRole: "superuser" })
                    }
                    disabled={updateUserRole.isPending}
                  >
                    🛡️ Superusuário
                  </Button>
                </div>
              </div>
            )}

            {/* Gerenciador de Permissões por Módulo */}
            {!isOwner && (
              <>
                <Label className="text-sm font-medium">Permissões por Módulo:</Label>
                <UserPermissionsManager
                  userId={user.id}
                  permissions={user.user_permissions}
                  isAdmin={isAdmin}
                />
              </>
            )}

            {isAdmin && (
              <div className="bg-muted/50 p-3 rounded-md text-sm text-muted-foreground">
                ✓ Administradores possuem acesso total a todas as funcionalidades do sistema
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

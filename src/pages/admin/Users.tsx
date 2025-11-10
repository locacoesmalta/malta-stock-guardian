import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Users as UsersIcon, 
  Shield, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Building2,
  FileText,
  Settings
} from "lucide-react";
import { AddUserDialog } from "@/components/AddUserDialog";
import { ResetPasswordDialog } from "@/components/ResetPasswordDialog";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useQueryClient } from "@tanstack/react-query";
import { BackButton } from "@/components/BackButton";

const USERS_PER_PAGE = 10;

const Users = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useUsersQuery({ 
    page: currentPage, 
    pageSize: USERS_PER_PAGE 
  });

  const users = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

  if (error) {
    toast.error("Erro ao carregar usuários");
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const refetchUsers = () => {
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const updatePermission = async (
    userId: string,
    field: string,
    value: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("user_permissions")
        .update({ [field]: value })
        .eq("user_id", userId);

      if (error) throw error;
      toast.success("Permissão atualizada!");
      refetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar permissão");
    }
  };

  const isAdmin = (user: typeof users[0]) => {
    return Array.isArray(user.user_roles) && user.user_roles.some((r) => r.role === "admin");
  };

  const isSuperuser = (user: typeof users[0]) => {
    return Array.isArray(user.user_roles) && user.user_roles.some((r) => r.role === "superuser");
  };

  const getUserRole = (user: typeof users[0]): "admin" | "superuser" | "user" => {
    if (isAdmin(user)) return "admin";
    if (isSuperuser(user)) return "superuser";
    return "user";
  };

  const updateUserRole = async (userId: string, newRole: "admin" | "superuser" | "user") => {
    try {
      // 1. DELETAR todas as roles existentes do usuário
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (deleteError) {
        console.error("Erro ao deletar roles antigas:", deleteError);
        throw deleteError;
      }

      // 2. INSERIR a nova role única
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: newRole });
      
      if (insertError) {
        console.error("Erro ao inserir nova role:", insertError);
        throw insertError;
      }

      const roleNames = {
        admin: "Administrador",
        superuser: "Superusuário",
        user: "Usuário"
      };

      toast.success(`Usuário atualizado para ${roleNames[newRole]}!`);
      refetchUsers();
    } catch (error: any) {
      console.error("Erro ao atualizar role:", error);
      toast.error(`Erro ao atualizar role: ${error.message || "Erro desconhecido"}`);
    }
  };

  // Verificar se o usuário tem todas as permissões de estoque
  const hasStockPermissions = (permissions: typeof users[0]['user_permissions']) => {
    if (!permissions) return false;
    return (
      permissions.can_view_products &&
      permissions.can_edit_products &&
      permissions.can_delete_products &&
      permissions.can_create_withdrawals &&
      permissions.can_view_withdrawal_history
    );
  };

  // Verificar se o usuário tem todas as permissões de patrimônio
  const hasAssetsPermissions = (permissions: typeof users[0]['user_permissions']) => {
    if (!permissions) return false;
    return (
      permissions.can_access_assets &&
      permissions.can_create_assets &&
      permissions.can_edit_assets &&
      permissions.can_delete_assets &&
      permissions.can_scan_assets
    );
  };

  // Verificar se o usuário tem todas as permissões de relatórios
  const hasReportsPermissions = (permissions: typeof users[0]['user_permissions']) => {
    if (!permissions) return false;
    return (
      permissions.can_create_reports &&
      permissions.can_view_reports &&
      permissions.can_edit_reports &&
      permissions.can_delete_reports
    );
  };

  // Ativar/desativar módulo completo
  const toggleModulePermissions = async (
    userId: string,
    module: "stock" | "assets" | "reports",
    value: boolean
  ) => {
    const modulePermissions = {
      stock: {
        can_view_products: value,
        can_edit_products: value,
        can_delete_products: value,
        can_create_withdrawals: value,
        can_view_withdrawal_history: value,
      },
      assets: {
        can_access_assets: value,
        can_create_assets: value,
        can_edit_assets: value,
        can_delete_assets: value,
        can_scan_assets: value,
      },
      reports: {
        can_create_reports: value,
        can_view_reports: value,
        can_edit_reports: value,
        can_delete_reports: value,
      },
    };

    try {
      const { error } = await supabase
        .from("user_permissions")
        .update(modulePermissions[module])
        .eq("user_id", userId);

      if (error) throw error;
      
      const moduleName = {
        stock: "Controle de Estoque",
        assets: "Gestão de Patrimônio",
        reports: "Relatórios"
      }[module];
      
      toast.success(`${moduleName} ${value ? 'ativado' : 'desativado'}!`);
      refetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar permissões do módulo");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <BackButton />
        <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Usuários</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Gerencie permissões dos usuários cadastrados
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UsersIcon className="h-5 w-5" />
              Usuários Cadastrados ({totalCount})
            </CardTitle>
            <AddUserDialog onUserAdded={refetchUsers} />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-sm sm:text-base text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-3 sm:p-4 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="font-medium text-sm sm:text-base truncate">
                          {user.full_name || "Sem nome"}
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground truncate">
                          {user.email}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-start justify-end">
                        {isAdmin(user) ? (
                          <Badge variant="default" className="gap-1 text-xs whitespace-nowrap">
                            <Shield className="h-3 w-3" />
                            Administrador
                          </Badge>
                        ) : isSuperuser(user) ? (
                          <Badge className="gap-1 text-xs whitespace-nowrap bg-orange-600 hover:bg-orange-700">
                            <Shield className="h-3 w-3" />
                            Superusuário
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="secondary" className="text-xs">Usuário</Badge>
                            {user.user_permissions && (
                              user.user_permissions.is_active ? (
                                <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">
                                  Pendente
                                </Badge>
                              )
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {!isAdmin(user) && (
                      <div className="flex justify-end">
                        <ResetPasswordDialog 
                          userId={user.id}
                          userEmail={user.email}
                          onPasswordReset={refetchUsers}
                        />
                      </div>
                    )}
                  </div>

                  {/* Gerenciamento de Roles - Apenas para Admins */}
                  {!isAdmin(user) && (
                    <div className="border-t pt-4">
                      <Card className="overflow-hidden border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-purple-600" />
                              <Label className="font-semibold text-sm">Nível de Acesso</Label>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Define o nível de privilégios do usuário no sistema
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant={getUserRole(user) === "user" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateUserRole(user.id, "user")}
                                disabled={getUserRole(user) === "user"}
                                className="text-xs"
                              >
                                Usuário Padrão
                              </Button>
                              <Button
                                variant={getUserRole(user) === "superuser" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateUserRole(user.id, "superuser")}
                                disabled={getUserRole(user) === "superuser"}
                                className="text-xs bg-orange-600 hover:bg-orange-700 text-white border-orange-600"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Superusuário
                              </Button>
                              <Button
                                variant={getUserRole(user) === "admin" ? "default" : "outline"}
                                size="sm"
                                onClick={() => updateUserRole(user.id, "admin")}
                                disabled={getUserRole(user) === "admin"}
                                className="text-xs"
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Administrador
                              </Button>
                            </div>
                            <div className="bg-purple-100 dark:bg-purple-950/50 rounded-lg p-3 text-xs space-y-2">
                              <p className="font-medium">ℹ️ Sobre os níveis:</p>
                              <ul className="space-y-1 text-muted-foreground ml-4 list-disc">
                                <li><strong>Usuário:</strong> Acesso básico com permissões específicas</li>
                                <li><strong>Superusuário:</strong> Acesso avançado (edita estoque, ativos, relatórios, empresas) mas não gerencia usuários</li>
                                <li><strong>Administrador:</strong> Controle total incluindo gestão de usuários</li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {!isAdmin(user) && user.user_permissions && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/50 rounded-lg gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`active-${user.id}`} className="font-semibold text-sm">
                            Status da Conta
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            {user.user_permissions.is_active
                              ? "Usuário pode acessar o sistema"
                              : "Aguardando aprovação do administrador"}
                          </p>
                        </div>
                        <Switch
                          id={`active-${user.id}`}
                          checked={user.user_permissions.is_active}
                          onCheckedChange={(checked) =>
                            updatePermission(
                              user.id,
                              "is_active",
                              checked
                            )
                          }
                          className="flex-shrink-0"
                        />
                      </div>

                      {user.user_permissions.is_active && (
                        <>
                          <div className="text-sm font-semibold mb-3 text-foreground">
                            Módulos de Acesso:
                          </div>
                          
                          <div className="grid gap-3">
                            {/* Módulo 1: Controle de Estoque */}
                            <Card className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                      <Package className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor={`stock-${user.id}`} className="font-semibold text-sm cursor-pointer">
                                        Controle de Estoque
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Produtos, saídas e histórico completo
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    id={`stock-${user.id}`}
                                    checked={hasStockPermissions(user.user_permissions)}
                                    onCheckedChange={(checked) =>
                                      toggleModulePermissions(user.id, "stock", checked)
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Módulo 2: Gestão de Patrimônio */}
                            <Card className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                      <Building2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor={`assets-${user.id}`} className="font-semibold text-sm cursor-pointer">
                                        Gestão de Patrimônio
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Cadastro, edição e controle de ativos
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    id={`assets-${user.id}`}
                                    checked={hasAssetsPermissions(user.user_permissions)}
                                    onCheckedChange={(checked) =>
                                      toggleModulePermissions(user.id, "assets", checked)
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Módulo 3: Relatórios */}
                            <Card className="overflow-hidden">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                      <FileText className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor={`reports-${user.id}`} className="font-semibold text-sm cursor-pointer">
                                        Relatórios
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Criação, edição e visualização de relatórios
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    id={`reports-${user.id}`}
                                    checked={hasReportsPermissions(user.user_permissions)}
                                    onCheckedChange={(checked) =>
                                      toggleModulePermissions(user.id, "reports", checked)
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>

                            {/* Módulo 4: Administração */}
                            <Card className="overflow-hidden border-orange-200 dark:border-orange-900">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex gap-3 flex-1">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                      <Settings className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                      <Label htmlFor={`admin-${user.id}`} className="font-semibold text-sm cursor-pointer">
                                        Administração
                                      </Label>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Acesso total ao painel administrativo
                                      </p>
                                    </div>
                                  </div>
                                  <Switch
                                    id={`admin-${user.id}`}
                                    checked={user.user_permissions.can_access_admin}
                                    onCheckedChange={(checked) =>
                                      updatePermission(user.id, "can_access_admin", checked)
                                    }
                                  />
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;

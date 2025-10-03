import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users as UsersIcon, Shield, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { AddUserDialog } from "@/components/AddUserDialog";
import { useUsersQuery } from "@/hooks/useUsersQuery";
import { useQueryClient } from "@tanstack/react-query";

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
    return user.user_roles.some((r) => r.role === "admin");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
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
                          <div className="text-xs sm:text-sm font-medium mb-2">
                            Permissões de Acesso:
                          </div>
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-3">
                              <div className="flex-1">
                                <Label htmlFor={`menu-${user.id}`} className="font-semibold text-sm">
                                  Acesso ao Menu Principal
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Dashboard, relatórios e inventário
                                </p>
                              </div>
                              <Switch
                                id={`menu-${user.id}`}
                                checked={user.user_permissions.can_access_main_menu}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_access_main_menu",
                                    checked
                                  )
                                }
                                className="flex-shrink-0"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-muted/30 rounded-lg gap-3">
                              <div className="flex-1">
                                <Label htmlFor={`admin-${user.id}`} className="font-semibold text-sm">
                                  Acesso à Administração
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Produtos, usuários e configurações
                                </p>
                              </div>
                              <Switch
                                id={`admin-${user.id}`}
                                checked={user.user_permissions.can_access_admin}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_access_admin",
                                    checked
                                  )
                                }
                                className="flex-shrink-0"
                              />
                            </div>

                          <div className="text-xs sm:text-sm font-medium mt-4 mb-2 text-primary">
                              📦 Controle de Estoque:
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded gap-3">
                              <Label htmlFor={`view-products-${user.id}`} className="text-xs sm:text-sm flex-1">
                                Visualizar Produtos
                              </Label>
                              <Switch
                                id={`view-products-${user.id}`}
                                checked={user.user_permissions.can_view_products}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_view_products",
                                    checked
                                  )
                                }
                                className="flex-shrink-0"
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded gap-3">
                              <Label htmlFor={`edit-products-${user.id}`} className="text-xs sm:text-sm flex-1">
                                Editar Produtos
                              </Label>
                              <Switch
                                id={`edit-products-${user.id}`}
                                checked={user.user_permissions.can_edit_products}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_edit_products",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`delete-products-${user.id}`}>
                                Excluir Produtos
                              </Label>
                              <Switch
                                id={`delete-products-${user.id}`}
                                checked={user.user_permissions.can_delete_products}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_delete_products",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`create-withdrawals-${user.id}`}>
                                Criar Saídas de Material
                              </Label>
                              <Switch
                                id={`create-withdrawals-${user.id}`}
                                checked={user.user_permissions.can_create_withdrawals}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_create_withdrawals",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`view-withdrawal-history-${user.id}`}>
                                Ver Histórico de Saídas
                              </Label>
                              <Switch
                                id={`view-withdrawal-history-${user.id}`}
                                checked={user.user_permissions.can_view_withdrawal_history}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_view_withdrawal_history",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="text-sm font-medium mt-4 mb-2 text-primary">
                              📋 Relatórios:
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`create-reports-${user.id}`}>
                                Criar Relatórios
                              </Label>
                              <Switch
                                id={`create-reports-${user.id}`}
                                checked={user.user_permissions.can_create_reports}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_create_reports",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`view-reports-${user.id}`}>
                                Visualizar Relatórios
                              </Label>
                              <Switch
                                id={`view-reports-${user.id}`}
                                checked={user.user_permissions.can_view_reports}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_view_reports",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`edit-reports-${user.id}`}>
                                Editar Relatórios
                              </Label>
                              <Switch
                                id={`edit-reports-${user.id}`}
                                checked={user.user_permissions.can_edit_reports}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_edit_reports",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`delete-reports-${user.id}`}>
                                Excluir Relatórios
                              </Label>
                              <Switch
                                id={`delete-reports-${user.id}`}
                                checked={user.user_permissions.can_delete_reports}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_delete_reports",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="text-sm font-medium mt-4 mb-2 text-primary">
                              🏢 Gestão de Patrimônio:
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`access-assets-${user.id}`}>
                                Acessar Patrimônio
                              </Label>
                              <Switch
                                id={`access-assets-${user.id}`}
                                checked={user.user_permissions.can_access_assets}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_access_assets",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`create-assets-${user.id}`}>
                                Cadastrar Patrimônio
                              </Label>
                              <Switch
                                id={`create-assets-${user.id}`}
                                checked={user.user_permissions.can_create_assets}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_create_assets",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`edit-assets-${user.id}`}>
                                Editar Patrimônio
                              </Label>
                              <Switch
                                id={`edit-assets-${user.id}`}
                                checked={user.user_permissions.can_edit_assets}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_edit_assets",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`delete-assets-${user.id}`}>
                                Excluir Patrimônio
                              </Label>
                              <Switch
                                id={`delete-assets-${user.id}`}
                                checked={user.user_permissions.can_delete_assets}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_delete_assets",
                                    checked
                                  )
                                }
                              />
                            </div>

                            <div className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                              <Label htmlFor={`scan-assets-${user.id}`}>
                                Escanear Patrimônio
                              </Label>
                              <Switch
                                id={`scan-assets-${user.id}`}
                                checked={user.user_permissions.can_scan_assets}
                                onCheckedChange={(checked) =>
                                  updatePermission(
                                    user.id,
                                    "can_scan_assets",
                                    checked
                                  )
                                }
                              />
                            </div>
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

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie permissões dos usuários cadastrados
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Usuários Cadastrados ({totalCount})
            </CardTitle>
            <AddUserDialog onUserAdded={refetchUsers} />
          </div>
          <div className="flex items-center gap-4">
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
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
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
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="border rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {user.full_name || "Sem nome"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin(user) ? (
                        <Badge variant="default" className="gap-1">
                          <Shield className="h-3 w-3" />
                          Administrador
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="secondary">Usuário</Badge>
                          {user.user_permissions && (
                            user.user_permissions.is_active ? (
                              <Badge className="bg-green-600 hover:bg-green-700 text-white">
                                Ativo
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">
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
                      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <Label htmlFor={`active-${user.id}`} className="font-semibold">
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
                        />
                      </div>

                      {user.user_permissions.is_active && (
                        <>
                          <div className="text-sm font-medium mb-2">
                            Permissões de Acesso:
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <Label htmlFor={`menu-${user.id}`} className="font-semibold">
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
                              />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div>
                                <Label htmlFor={`admin-${user.id}`} className="font-semibold">
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
                              />
                            </div>

                            <div className="text-sm font-medium mt-4 mb-2">
                              Permissões Específicas:
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor={`view-products-${user.id}`}>
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
                              />
                            </div>

                            <div className="flex items-center justify-between">
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

                            <div className="flex items-center justify-between">
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

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users as UsersIcon, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  user_roles: Array<{ role: string }>;
  user_permissions: {
    can_view_products: boolean;
    can_create_reports: boolean;
    can_view_reports: boolean;
  } | null;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role),
          user_permissions!inner(can_view_products, can_create_reports, can_view_reports)
        `)
        .order("created_at")
        .returns<User[]>();

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } finally {
      setLoading(false);
    }
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
      fetchUsers();
    } catch (error: any) {
      toast.error("Erro ao atualizar permissão");
    }
  };

  const isAdmin = (user: User) => {
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
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Usuários Cadastrados ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando usuários...
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
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
                    {isAdmin(user) ? (
                      <Badge variant="default" className="gap-1">
                        <Shield className="h-3 w-3" />
                        Administrador
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </div>

                  {!isAdmin(user) && user.user_permissions && (
                    <div className="border-t pt-4">
                      <div className="text-sm font-medium mb-3">
                        Permissões:
                      </div>
                      <div className="space-y-3">
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

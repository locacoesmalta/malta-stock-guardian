import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface AddUserDialogProps {
  onUserAdded: () => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    is_active: false,
    can_access_main_menu: false,
    can_access_admin: false,
    can_view_products: false,
    can_create_reports: false,
    can_view_reports: false,
    can_create_withdrawals: false,
    can_view_withdrawal_history: false,
    can_edit_products: false,
    can_delete_products: false,
    can_edit_reports: false,
    can_delete_reports: false,
    can_access_assets: false,
    can_create_assets: false,
    can_edit_assets: false,
    can_delete_assets: false,
    can_scan_assets: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          permissions: {
            is_active: formData.is_active,
            can_access_main_menu: formData.can_access_main_menu,
            can_access_admin: formData.can_access_admin,
            can_view_products: formData.can_view_products,
            can_create_reports: formData.can_create_reports,
            can_view_reports: formData.can_view_reports,
            can_create_withdrawals: formData.can_create_withdrawals,
            can_view_withdrawal_history: formData.can_view_withdrawal_history,
            can_edit_products: formData.can_edit_products,
            can_delete_products: formData.can_delete_products,
            can_edit_reports: formData.can_edit_reports,
            can_delete_reports: formData.can_delete_reports,
            can_access_assets: formData.can_access_assets,
            can_create_assets: formData.can_create_assets,
            can_edit_assets: formData.can_edit_assets,
            can_delete_assets: formData.can_delete_assets,
            can_scan_assets: formData.can_scan_assets,
          }
        }
      });

      // Check for errors in response body
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }

      toast.success("Usuário criado com sucesso!");
      setOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        is_active: false,
        can_access_main_menu: false,
        can_access_admin: false,
        can_view_products: false,
        can_create_reports: false,
        can_view_reports: false,
        can_create_withdrawals: false,
        can_view_withdrawal_history: false,
        can_edit_products: false,
        can_delete_products: false,
        can_edit_reports: false,
        can_delete_reports: false,
        can_access_assets: false,
        can_create_assets: false,
        can_edit_assets: false,
        can_delete_assets: false,
        can_scan_assets: false,
      });
      onUserAdded();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Adicionar Usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="font-medium text-sm">Permissões</div>
            
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="is_active" className="font-semibold">
                  Ativar Conta
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Permitir acesso ao sistema
                </p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>

            {formData.is_active && (
              <div className="space-y-3 pl-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="can_access_main_menu" className="font-semibold">
                      Acesso ao Menu Principal
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permite acesso às funcionalidades básicas do sistema
                    </p>
                  </div>
                  <Switch
                    id="can_access_main_menu"
                    checked={formData.can_access_main_menu}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_access_main_menu: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <Label htmlFor="can_access_admin" className="font-semibold">
                      Acesso à Administração
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Permite acesso ao painel administrativo
                    </p>
                  </div>
                  <Switch
                    id="can_access_admin"
                    checked={formData.can_access_admin}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_access_admin: checked })
                    }
                  />
                </div>

                <div className="text-xs font-semibold mt-3 mb-2 text-primary">📦 Controle de Estoque</div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_products" className="text-xs">Visualizar Produtos</Label>
                  <Switch
                    id="can_view_products"
                    checked={formData.can_view_products}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_view_products: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_edit_products" className="text-xs">Editar Produtos</Label>
                  <Switch
                    id="can_edit_products"
                    checked={formData.can_edit_products}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_edit_products: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_products" className="text-xs">Excluir Produtos</Label>
                  <Switch
                    id="can_delete_products"
                    checked={formData.can_delete_products}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_delete_products: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_create_withdrawals" className="text-xs">Criar Saídas de Material</Label>
                  <Switch
                    id="can_create_withdrawals"
                    checked={formData.can_create_withdrawals}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_create_withdrawals: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_withdrawal_history" className="text-xs">Ver Histórico de Saídas</Label>
                  <Switch
                    id="can_view_withdrawal_history"
                    checked={formData.can_view_withdrawal_history}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_view_withdrawal_history: checked })
                    }
                  />
                </div>

                <div className="text-xs font-semibold mt-3 mb-2 text-primary">📋 Relatórios</div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_create_reports" className="text-xs">Criar Relatórios</Label>
                  <Switch
                    id="can_create_reports"
                    checked={formData.can_create_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_create_reports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_reports" className="text-xs">Visualizar Relatórios</Label>
                  <Switch
                    id="can_view_reports"
                    checked={formData.can_view_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_view_reports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_edit_reports" className="text-xs">Editar Relatórios</Label>
                  <Switch
                    id="can_edit_reports"
                    checked={formData.can_edit_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_edit_reports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_reports" className="text-xs">Excluir Relatórios</Label>
                  <Switch
                    id="can_delete_reports"
                    checked={formData.can_delete_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_delete_reports: checked })
                    }
                  />
                </div>

                <div className="text-xs font-semibold mt-3 mb-2 text-primary">🏢 Gestão de Patrimônio</div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_access_assets" className="text-xs">Acessar Patrimônio</Label>
                  <Switch
                    id="can_access_assets"
                    checked={formData.can_access_assets}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_access_assets: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_create_assets" className="text-xs">Cadastrar Patrimônio</Label>
                  <Switch
                    id="can_create_assets"
                    checked={formData.can_create_assets}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_create_assets: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_edit_assets" className="text-xs">Editar Patrimônio</Label>
                  <Switch
                    id="can_edit_assets"
                    checked={formData.can_edit_assets}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_edit_assets: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_delete_assets" className="text-xs">Excluir Patrimônio</Label>
                  <Switch
                    id="can_delete_assets"
                    checked={formData.can_delete_assets}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_delete_assets: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_scan_assets" className="text-xs">Escanear Patrimônio</Label>
                  <Switch
                    id="can_scan_assets"
                    checked={formData.can_scan_assets}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_scan_assets: checked })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Usuário"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

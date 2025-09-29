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
    can_view_products: false,
    can_create_reports: false,
    can_view_reports: false,
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
            can_view_products: formData.can_view_products,
            can_create_reports: formData.can_create_reports,
            can_view_reports: formData.can_view_reports,
          }
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar usuário");
      }

      const { error: dataError, data } = response;
      if (dataError) throw dataError;

      toast.success("Usuário criado com sucesso!");
      setOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        is_active: false,
        can_view_products: false,
        can_create_reports: false,
        can_view_reports: false,
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
      <DialogContent className="sm:max-w-[500px]">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_products">Visualizar Produtos</Label>
                  <Switch
                    id="can_view_products"
                    checked={formData.can_view_products}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_view_products: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_create_reports">Criar Relatórios</Label>
                  <Switch
                    id="can_create_reports"
                    checked={formData.can_create_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_create_reports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="can_view_reports">Visualizar Relatórios</Label>
                  <Switch
                    id="can_view_reports"
                    checked={formData.can_view_reports}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, can_view_reports: checked })
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

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Check, X } from "lucide-react";

// Lista de senhas comuns que devem ser evitadas
const COMMON_PASSWORDS = [
  "123456", "password", "123456789", "12345678", "12345", "1234567",
  "senha", "senha123", "admin", "123123", "qwerty", "abc123",
];

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Validação de força de senha
  const validatePasswordStrength = (password: string) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    };

    return checks;
  };

  const passwordStrength = validatePasswordStrength(formData.newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    // Validações de força de senha
    if (!passwordStrength.length) {
      toast.error("A senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (!passwordStrength.uppercase) {
      toast.error("A senha deve conter pelo menos uma letra maiúscula");
      return;
    }

    if (!passwordStrength.lowercase) {
      toast.error("A senha deve conter pelo menos uma letra minúscula");
      return;
    }

    if (!passwordStrength.number) {
      toast.error("A senha deve conter pelo menos um número");
      return;
    }

    if (!passwordStrength.notCommon) {
      toast.error("Esta senha é muito comum. Por favor, escolha uma senha mais segura");
      return;
    }

    setLoading(true);

    try {
      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        throw new Error("Usuário não encontrado");
      }

      // Try to sign in with current password to verify it
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error("Senha atual incorreta");
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        // Traduzir erros específicos do Supabase
        if (updateError.message.includes("Password is known to be weak")) {
          throw new Error("Esta senha é conhecida por ser fraca e fácil de adivinhar. Por favor, escolha uma senha mais forte e única");
        }
        throw updateError;
      }

      toast.success("Senha alterada com sucesso!");
      setOpen(false);
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.message || "Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <KeyRound className="h-4 w-4" />
          Alterar Minha Senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha Atual</Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              minLength={8}
            />
            
            {/* Indicadores de requisitos de senha */}
            {formData.newPassword && (
              <div className="space-y-1 text-xs pt-2">
                <p className="font-medium text-muted-foreground mb-2">Requisitos da senha:</p>
                
                <div className={`flex items-center gap-2 ${passwordStrength.length ? "text-green-600" : "text-red-600"}`}>
                  {passwordStrength.length ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Mínimo de 8 caracteres</span>
                </div>
                
                <div className={`flex items-center gap-2 ${passwordStrength.uppercase ? "text-green-600" : "text-red-600"}`}>
                  {passwordStrength.uppercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Uma letra maiúscula</span>
                </div>
                
                <div className={`flex items-center gap-2 ${passwordStrength.lowercase ? "text-green-600" : "text-red-600"}`}>
                  {passwordStrength.lowercase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Uma letra minúscula</span>
                </div>
                
                <div className={`flex items-center gap-2 ${passwordStrength.number ? "text-green-600" : "text-red-600"}`}>
                  {passwordStrength.number ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Um número</span>
                </div>
                
                <div className={`flex items-center gap-2 ${passwordStrength.notCommon ? "text-green-600" : "text-red-600"}`}>
                  {passwordStrength.notCommon ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  <span>Não pode ser uma senha comum</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              minLength={8}
            />
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
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

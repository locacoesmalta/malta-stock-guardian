import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Lock } from "lucide-react";

const COMMON_PASSWORDS = [
  "123456", "password", "12345678", "qwerty", "abc123", "monkey", 
  "1234567", "letmein", "trustno1", "dragon", "baseball", "111111",
  "iloveyou", "master", "sunshine", "ashley", "bailey", "passw0rd",
  "shadow", "123123", "654321", "superman", "qazwsx", "michael"
];

export default function ChangePasswordRequired() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 8) {
      return { valid: false, message: "Senha deve ter no mínimo 8 caracteres" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: "Senha deve conter pelo menos uma letra maiúscula" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: "Senha deve conter pelo menos uma letra minúscula" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: "Senha deve conter pelo menos um número" };
    }
    if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
      return { valid: false, message: "Esta senha é muito comum. Escolha uma senha mais segura" };
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    const passwordValidation = validatePasswordStrength(formData.newPassword);
    if (!passwordValidation.valid) {
      toast.error(passwordValidation.message);
      return;
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/auth");
        return;
      }

      // Verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: formData.currentPassword,
      });

      if (signInError) {
        toast.error("Senha atual incorreta");
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (updateError) {
        toast.error("Erro ao alterar senha: " + updateError.message);
        setLoading(false);
        return;
      }

      // Update must_change_password flag
      const { error: permError } = await supabase
        .from("user_permissions")
        .update({ must_change_password: false })
        .eq("user_id", user.id);

      if (permError) {
        console.error("Erro ao atualizar flag:", permError);
      }

      toast.success("Senha alterada com sucesso!");
      navigate("/welcome");
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error("Erro inesperado ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthIndicators = () => {
    const password = formData.newPassword;
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
    };
  };

  const indicators = getPasswordStrengthIndicators();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl text-center">Alterar Senha</CardTitle>
          <CardDescription className="text-center">
            Por segurança, você deve alterar sua senha temporária antes de continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha Atual (Temporária)</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {formData.newPassword && (
                <div className="space-y-1 text-xs mt-2">
                  <div className={indicators.length ? "text-green-600" : "text-muted-foreground"}>
                    {indicators.length ? "✓" : "○"} Mínimo 8 caracteres
                  </div>
                  <div className={indicators.uppercase ? "text-green-600" : "text-muted-foreground"}>
                    {indicators.uppercase ? "✓" : "○"} Letra maiúscula
                  </div>
                  <div className={indicators.lowercase ? "text-green-600" : "text-muted-foreground"}>
                    {indicators.lowercase ? "✓" : "○"} Letra minúscula
                  </div>
                  <div className={indicators.number ? "text-green-600" : "text-muted-foreground"}>
                    {indicators.number ? "✓" : "○"} Número
                  </div>
                  <div className={indicators.notCommon ? "text-green-600" : "text-muted-foreground"}>
                    {indicators.notCommon ? "✓" : "○"} Não é senha comum
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  disabled={loading}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Alterando..." : "Alterar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

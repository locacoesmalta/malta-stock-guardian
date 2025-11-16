import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Key, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const COMMON_PASSWORDS = [
  "123456", "password", "12345678", "qwerty", "abc123", "monkey", 
  "1234567", "letmein", "trustno1", "dragon", "baseball", "111111",
  "iloveyou", "master", "sunshine", "ashley", "bailey", "passw0rd",
  "shadow", "123123", "654321", "superman", "qazwsx", "michael"
];

interface ResetPasswordDialogProps {
  userId: string;
  userEmail: string;
  onPasswordReset?: () => void;
}

export function ResetPasswordDialog({ userId, userEmail, onPasswordReset }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forceChange, setForceChange] = useState(false);

  const getPasswordStrengthIndicators = () => {
    return {
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      notCommon: !COMMON_PASSWORDS.includes(newPassword.toLowerCase()),
    };
  };

  const indicators = getPasswordStrengthIndicators();
  const isPasswordValid = Object.values(indicators).every(Boolean);

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (!isPasswordValid) {
      toast.error("A senha não atende aos requisitos de segurança");
      return;
    }

    setLoading(true);

    try {
      // ✅ FASE 4: Usar helper com retry automático
      const { invokeFunctionWithRetry } = await import("@/lib/edgeFunctionHelper");
      
      const result = await invokeFunctionWithRetry({
        functionName: 'reset-user-password',
        body: {
          user_id: userId,
          new_password: newPassword,
          force_change_password: forceChange,
        },
        maxRetries: 3,
        retryDelay: 1000,
        requiresAuth: true,
      });

      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Senha redefinida com sucesso!");
      setOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setForceChange(false);
      
      if (onPasswordReset) {
        onPasswordReset();
      }
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      
      // ✅ FASE 2: Tratamento específico por tipo de erro
      if (error.message?.includes("Failed to fetch") || error.message?.includes("NetworkError")) {
        toast.error("Erro de conexão. Verifique sua internet.");
      } else if (error.message?.includes("SESSÃO_EXPIRADA") || error.message?.includes("NÃO_AUTORIZADO")) {
        toast.error("Sessão expirada. Faça login novamente.");
      } else {
        toast.error("Erro ao redefinir senha: " + (error.message || "Erro desconhecido"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="h-4 w-4" />
          Redefinir Senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Redefinir Senha do Usuário
          </DialogTitle>
          <DialogDescription>
            Defina uma nova senha para: <strong>{userEmail}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="Digite a nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            
            {newPassword && (
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
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirme a nova senha"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirm(!showConfirm)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="force-change" 
              checked={forceChange}
              onCheckedChange={(checked) => setForceChange(checked as boolean)}
            />
            <Label 
              htmlFor="force-change" 
              className="text-sm font-normal cursor-pointer"
            >
              Forçar troca de senha no próximo login
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleReset}
            disabled={loading || !isPasswordValid || newPassword !== confirmPassword}
          >
            {loading ? "Redefinindo..." : "Redefinir Senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

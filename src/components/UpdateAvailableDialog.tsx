import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { SECURITY_CONFIG } from '@/config/security';
import { RefreshCw } from 'lucide-react';

interface UpdateAvailableDialogProps {
  open: boolean;
  onUpdate: () => void;
}

export function UpdateAvailableDialog({ open, onUpdate }: UpdateAvailableDialogProps) {
  const [countdown, setCountdown] = useState(
    Math.floor(SECURITY_CONFIG.UPDATE_GRACE_PERIOD_MS / 1000)
  );

  useEffect(() => {
    if (!open) {
      setCountdown(Math.floor(SECURITY_CONFIG.UPDATE_GRACE_PERIOD_MS / 1000));
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onUpdate(); // Auto-update quando countdown chegar a 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, onUpdate]);

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Nova Versão Disponível
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Uma nova versão do sistema está disponível. Para garantir a melhor
              experiência e segurança, você será desconectado em:
            </p>
            <div className="text-center">
              <span className="text-3xl font-bold text-primary">
                {countdown}s
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Após fazer login novamente, você terá acesso à versão atualizada do sistema.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onUpdate} className="w-full">
            Atualizar Agora
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
import { Clock } from 'lucide-react';

interface IdleWarningDialogProps {
  open: boolean;
  onContinue: () => void;
}

export function IdleWarningDialog({ open, onContinue }: IdleWarningDialogProps) {
  // Tempo de aviso: diferença entre timeout total e warning
  const warningDuration = SECURITY_CONFIG.IDLE_TIMEOUT_MS - SECURITY_CONFIG.IDLE_WARNING_MS;
  const [countdown, setCountdown] = useState(Math.floor(warningDuration / 1000));

  useEffect(() => {
    if (!open) {
      setCountdown(Math.floor(warningDuration / 1000));
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, warningDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            Sessão Inativa
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Você está inativo há algum tempo. Por motivos de segurança, sua sessão será
              encerrada automaticamente em:
            </p>
            <div className="text-center">
              <span className="text-3xl font-bold text-warning">
                {formatTime(countdown)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Clique em "Continuar Conectado" para manter sua sessão ativa.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button onClick={onContinue} className="w-full">
            Continuar Conectado
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface IntegrityDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problem: any;
  problemType: string;
}

export function IntegrityDetailModal({
  open,
  onOpenChange,
  problem,
  problemType,
}: IntegrityDetailModalProps) {
  const navigate = useNavigate();

  const getNavigationLink = () => {
    if (problemType === "products" && problem?.id) return `/admin/products`;
    if (problemType === "assets" && problem?.id) return `/assets/${problem.asset_code}`;
    if (problemType === "reports" && problem?.id) return `/reports`;
    return null;
  };

  const handleNavigate = () => {
    const link = getNavigationLink();
    if (link) {
      navigate(link);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detalhes do Problema</DialogTitle>
          <DialogDescription>
            Informações completas sobre o problema detectado no sistema
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {/* Tipo do Problema */}
            <div>
              <h4 className="text-sm font-medium mb-2">Tipo</h4>
              <Badge variant="outline">{problemType}</Badge>
            </div>

            <Separator />

            {/* Detalhes específicos por tipo */}
            {problemType === "products" && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Código</h4>
                  <p className="text-sm text-muted-foreground">{problem.code}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Nome</h4>
                  <p className="text-sm text-muted-foreground">{problem.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Quantidade Atual</h4>
                  <p className={`text-sm font-mono ${problem.quantity < 0 ? 'text-destructive' : 'text-foreground'}`}>
                    {problem.quantity}
                  </p>
                </div>
                {problem.negative_stock && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="text-sm font-medium text-destructive mb-1">⚠️ Estoque Negativo</h4>
                    <p className="text-xs text-muted-foreground">
                      Este produto possui estoque negativo, indicando possível erro nas movimentações.
                      Verifique o histórico de retiradas e ajustes.
                    </p>
                  </div>
                )}
                {problem.missing_adjustments && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-medium text-amber-600 mb-1">📋 Sem Histórico</h4>
                    <p className="text-xs text-muted-foreground">
                      Este produto não possui histórico de ajustes de estoque registrado.
                    </p>
                  </div>
                )}
              </div>
            )}

            {problemType === "sessions" && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">Usuário</h4>
                  <p className="text-sm text-muted-foreground">{problem.user_email}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Status</h4>
                  <Badge variant={problem.is_online ? "default" : "secondary"}>
                    {problem.is_online ? "Online" : "Offline"}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Última Atividade</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(problem.last_activity).toLocaleString()}
                  </p>
                </div>
                {problem.is_duplicate && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <h4 className="text-sm font-medium text-destructive mb-1">⚠️ Sessão Duplicada</h4>
                    <p className="text-xs text-muted-foreground">
                      Este usuário possui múltiplas sessões ativas simultaneamente.
                    </p>
                  </div>
                )}
                {problem.is_stale && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-medium text-amber-600 mb-1">⏰ Sessão Antiga</h4>
                    <p className="text-xs text-muted-foreground">
                      Esta sessão está inativa há mais de 24 horas.
                    </p>
                  </div>
                )}
              </div>
            )}

            {problemType === "audit" && (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-1">ID do Log</h4>
                  <p className="text-sm font-mono text-muted-foreground">{problem.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Ação</h4>
                  <Badge>{problem.action}</Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Usuário</h4>
                  <p className="text-sm text-muted-foreground">{problem.user_email}</p>
                </div>
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <h4 className="text-sm font-medium text-destructive mb-1">🔐 Problema de Integridade</h4>
                  <p className="text-xs text-muted-foreground">
                    Este log de auditoria apresenta problemas de integridade ou assinatura.
                  </p>
                </div>
              </div>
            )}

            <Separator />

            {/* Dados brutos (JSON) */}
            <div>
              <h4 className="text-sm font-medium mb-2">Dados Completos (JSON)</h4>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                {JSON.stringify(problem, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>

        {getNavigationLink() && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleNavigate} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para o Registro
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

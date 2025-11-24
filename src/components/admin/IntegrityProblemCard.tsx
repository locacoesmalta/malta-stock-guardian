import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, CheckCircle, ChevronDown, Eye, EyeOff, ExternalLink, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrityProblemCardProps {
  problem: any;
  problemType: string;
  onResolve: (problemId: string, notes?: string) => void;
  onIgnore: (problemId: string, notes?: string) => void;
  onViewDetails: (problem: any, problemType: string) => void;
  resolutionStatus?: "pending" | "resolved" | "ignored";
}

export function IntegrityProblemCard({
  problem,
  problemType,
  onResolve,
  onIgnore,
  onViewDetails,
  resolutionStatus = "pending",
}: IntegrityProblemCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  const getProblemIdentifier = () => {
    if (problemType === "products") return problem.product_id;
    if (problemType === "sessions") return `${problem.user_email}_${problem.last_activity}`;
    if (problemType === "audit") return problem.log_id;
    if (problemType === "assets") return problem.asset_id;
    if (problemType === "withdrawals") return problem.withdrawal_id;
    if (problemType === "reports") return problem.report_id;
    if (problemType === "stock") return problem.product_id;
    if (problemType === "orphans") return problem.reference_id;
    return problem.product_id || problem.id;
  };

  const getProblemTitle = () => {
    if (problemType === "products") {
      if (problem.negative_stock) return `Estoque Negativo: ${problem.product_code} (${problem.current_quantity})`;
      if (problem.missing_adjustments) return `Sem Histórico: ${problem.product_code}`;
    }
    if (problemType === "sessions") {
      if (problem.is_duplicate) return `Sessão Duplicada: ${problem.user_email}`;
      if (problem.is_stale) return `Sessão Antiga: ${problem.user_email}`;
    }
    if (problemType === "audit") return `Log sem Integridade: ${problem.action}`;
    if (problemType === "assets") return `Equipamento: ${problem.asset_code}`;
    if (problemType === "withdrawals") return `Retirada Inválida: ${problem.product_code}`;
    if (problemType === "reports") return `Relatório: ${problem.equipment_code}`;
    if (problemType === "stock") return `Estoque: ${problem.product_code}`;
    if (problemType === "orphans") return `Produto Órfão: ${problem.code}`;
    return "Problema";
  };

  const getStatusIcon = () => {
    if (resolutionStatus === "resolved") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (resolutionStatus === "ignored") return <EyeOff className="h-4 w-4 text-muted-foreground" />;
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  };

  const getStatusBadge = () => {
    if (resolutionStatus === "resolved") return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolvido</Badge>;
    if (resolutionStatus === "ignored") return <Badge variant="outline" className="bg-muted text-muted-foreground">Ignorado</Badge>;
    return <Badge variant="destructive">Pendente</Badge>;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "border rounded-lg p-4 transition-all",
        resolutionStatus === "resolved" && "bg-green-500/5 border-green-500/20",
        resolutionStatus === "ignored" && "bg-muted/50 border-muted",
        resolutionStatus === "pending" && "bg-card border-border"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 text-left">
              {getStatusIcon()}
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{getProblemTitle()}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {problemType === "products" && `Nome: ${problem.product_name}`}
                  {problemType === "sessions" && `Última atividade: ${new Date(problem.last_activity).toLocaleString()}`}
                  {problemType === "audit" && `Usuário: ${problem.user_email}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-3">
          <div className="pl-7 space-y-2 text-sm text-muted-foreground">
            {problemType === "products" && (
              <>
                <p>• Código: {problem.product_code}</p>
                <p>• Quantidade: {problem.current_quantity}</p>
                {problem.negative_stock && <p className="text-destructive">• Estoque negativo detectado</p>}
                {problem.missing_adjustments && <p className="text-amber-500">• Sem histórico de ajustes</p>}
              </>
            )}
            {problemType === "sessions" && (
              <>
                <p>• Email: {problem.user_email}</p>
                <p>• Status: {problem.is_online ? "Online" : "Offline"}</p>
                <p>• Última atividade: {new Date(problem.last_activity).toLocaleString()}</p>
                {problem.is_duplicate && <p className="text-destructive">• Sessão duplicada detectada</p>}
                {problem.is_stale && <p className="text-amber-500">• Sessão antiga ({'>'}24h)</p>}
              </>
            )}
          </div>

          {resolutionStatus === "pending" && (
            <div className="pl-7 flex flex-wrap gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(problem, problemType)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Ver Detalhes
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNotesInput(!showNotesInput)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Adicionar Nota
              </Button>
              <Button
                size="sm"
                variant="default"
                onClick={() => onResolve(getProblemIdentifier(), notes)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Marcar Resolvido
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onIgnore(getProblemIdentifier(), notes)}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Ignorar
              </Button>
            </div>
          )}

          {showNotesInput && resolutionStatus === "pending" && (
            <div className="pl-7 pt-2">
              <textarea
                className="w-full min-h-[60px] px-3 py-2 text-sm rounded-md border border-input bg-background"
                placeholder="Adicione observações sobre este problema..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

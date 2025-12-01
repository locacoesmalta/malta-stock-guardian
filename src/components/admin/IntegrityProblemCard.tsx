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

  const getCompactSummary = () => {
    if (problemType === "products") {
      const name = problem.product_name?.substring(0, 25) || "Produto";
      const creator = problem.created_by_name ? ` (${problem.created_by_name.split(' ')[0]})` : "";
      const qty = Math.abs(problem.current_quantity);
      
      if (problem.current_quantity < 0) {
        return `🔴 ${problem.product_code} · ${name}${creator} · ${qty}un no vermelho → Corrigir estoque`;
      }
      if (!problem.has_adjustment_history || problem.issue_type?.includes("sem histórico")) {
        return `⚠️ ${problem.product_code} · ${name}${creator} · ${qty}un sem origem → Registrar entrada`;
      }
      return `⚠️ ${problem.product_code} · ${name}${creator} · ${problem.issue_type || "Verificar"} → Corrigir`;
    }
    if (problemType === "sessions") {
      if (problem.session_count > 1 || problem.issue_type?.toLowerCase().includes("duplica")) {
        return `👥 ${problem.user_email} · ${problem.session_count} sessões → Limpar`;
      }
      if (problem.issue_type?.toLowerCase().includes("inativ") || problem.issue_type?.toLowerCase().includes("órfã")) {
        const hours = Math.floor((Date.now() - new Date(problem.last_activity).getTime()) / (1000 * 60 * 60));
        return `⏰ ${problem.user_email} · Inativo há ${hours}h → Encerrar`;
      }
      return `⚠️ ${problem.user_email} · ${problem.issue_type || "Sessão com problema"} → Verificar`;
    }
    if (problemType === "audit") {
      return `📋 ${problem.action} · ${problem.user_email} · Log sem integridade → Verificar`;
    }
    if (problemType === "assets") {
      return `🔧 PAT ${problem.asset_code} · ${problem.asset_name || "Equipamento"} → Verificar`;
    }
    if (problemType === "withdrawals") {
      return `📦 ${problem.product_code} · Retirada inválida → Corrigir`;
    }
    if (problemType === "reports") {
      return `📄 PAT ${problem.equipment_code} · Relatório → Verificar`;
    }
    if (problemType === "stock") {
      const name = problem.product_name?.substring(0, 25) || "Produto";
      return `📉 ${problem.product_code} · ${name} · ${problem.current_quantity}/${problem.min_quantity} min → Comprar`;
    }
    if (problemType === "orphans") {
      return `🔍 ${problem.code} · ${problem.name?.substring(0, 25)} · Produto órfão → Vincular`;
    }
    return `⚠️ ${problem.issue_type || "Problema detectado"} → Verificar`;
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
        "border rounded-lg p-3 transition-all",
        resolutionStatus === "resolved" && "bg-green-500/5 border-green-500/20",
        resolutionStatus === "ignored" && "bg-muted/50 border-muted",
        resolutionStatus === "pending" && "bg-card border-border"
      )}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {getStatusIcon()}
              <p className="text-sm font-medium truncate">{getCompactSummary()}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge()}
              <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-3">
          <div className="pl-7 space-y-1 text-xs text-muted-foreground">
            {problemType === "products" && (
              <>
                <p>Produto: {problem.product_name}</p>
                <p>Estoque atual: {problem.current_quantity} {problem.min_quantity && `(mín: ${problem.min_quantity})`}</p>
              </>
            )}
            {problemType === "sessions" && (
              <p>Última atividade: {new Date(problem.last_activity).toLocaleString('pt-BR')}</p>
            )}
            {problemType === "stock" && (
              <>
                <p>Produto: {problem.product_name}</p>
                <p>Estoque: {problem.current_quantity} / Mínimo: {problem.min_quantity}</p>
              </>
            )}
          </div>

          {resolutionStatus === "pending" && (
            <div className="pl-7 flex flex-wrap gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="default"
                onClick={() => onResolve(getProblemIdentifier(), notes)}
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Resolvido
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onIgnore(getProblemIdentifier(), notes)}
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Ignorar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowNotesInput(!showNotesInput)}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                {showNotesInput ? "Ocultar" : "Nota"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewDetails(problem, problemType)}
              >
                <Eye className="h-3 w-3 mr-1" />
                Detalhes
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

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, EyeOff, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Resolution {
  id: string;
  problem_type: string;
  problem_identifier: string;
  status: string;
  resolved_by: string;
  resolved_at: string;
  resolution_notes: string | null;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface IntegrityResolutionHistoryProps {
  resolutions: Resolution[];
  onReopen: (problemType: string, problemId: string) => void;
}

export function IntegrityResolutionHistory({
  resolutions,
  onReopen,
}: IntegrityResolutionHistoryProps) {
  const resolvedProblems = resolutions.filter((r) => r.status === "resolved");
  const ignoredProblems = resolutions.filter((r) => r.status === "ignored");

  const getStatusIcon = (status: string) => {
    if (status === "resolved") return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "ignored") return <EyeOff className="h-4 w-4 text-muted-foreground" />;
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === "resolved") {
      return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Resolvido</Badge>;
    }
    if (status === "ignored") {
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Ignorado</Badge>;
    }
    return null;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      critical: "bg-red-500/10 text-red-500 border-red-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      medium: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority}
      </Badge>
    );
  };

  const ResolutionCard = ({ resolution }: { resolution: Resolution }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {getStatusIcon(resolution.status)}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium">{resolution.problem_type}</p>
              {getStatusBadge(resolution.status)}
              {getPriorityBadge(resolution.priority)}
            </div>
            <p className="text-xs text-muted-foreground">
              ID: {resolution.problem_identifier.slice(0, 20)}...
            </p>
            {resolution.resolution_notes && (
              <p className="text-xs text-muted-foreground italic">
                "{resolution.resolution_notes}"
              </p>
            )}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onReopen(resolution.problem_type, resolution.problem_identifier)}
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reabrir
        </Button>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Resolvido{" "}
          {formatDistanceToNow(new Date(resolution.resolved_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Problemas Resolvidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Problemas Resolvidos ({resolvedProblems.length})
          </CardTitle>
          <CardDescription>
            Histórico de problemas que foram marcados como resolvidos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resolvedProblems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum problema resolvido ainda
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {resolvedProblems.map((resolution) => (
                  <ResolutionCard key={resolution.id} resolution={resolution} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Problemas Ignorados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            Problemas Ignorados ({ignoredProblems.length})
          </CardTitle>
          <CardDescription>
            Problemas que foram marcados para serem ignorados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ignoredProblems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum problema ignorado
            </p>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {ignoredProblems.map((resolution) => (
                  <ResolutionCard key={resolution.id} resolution={resolution} />
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

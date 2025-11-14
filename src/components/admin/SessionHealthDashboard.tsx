import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Activity, Users, AlertTriangle, Clock } from "lucide-react";

export const SessionHealthDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['session-health'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_session_health_stats');
      if (error) throw error;
      return data as {
        active_sessions: number;
        stale_sessions: number;
        unique_users: number;
        multi_session_users: number;
        total_sessions_24h: number;
        avg_session_duration: number;
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saúde das Sessões</CardTitle>
          <CardDescription>Carregando estatísticas...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!stats) return null;

  const isHealthy = stats.stale_sessions <= 5;
  const hasMultipleSessions = stats.multi_session_users > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Saúde das Sessões
        </CardTitle>
        <CardDescription>
          Monitoramento em tempo real de sessões ativas
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Geral */}
        <Alert variant={isHealthy ? "default" : "destructive"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {isHealthy ? "Sistema Saudável" : "Atenção Necessária"}
          </AlertTitle>
          <AlertDescription>
            {isHealthy 
              ? "Todas as sessões estão funcionando normalmente."
              : `${stats.stale_sessions} sessões stale detectadas (marcadas como online mas inativas há mais de 30 minutos).`
            }
          </AlertDescription>
        </Alert>

        {/* Grid de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sessões Ativas */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sessões Ativas</div>
              <Activity className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{stats.active_sessions}</div>
            <div className="text-xs text-muted-foreground">
              Conectadas agora
            </div>
          </div>

          {/* Usuários Únicos */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Usuários Únicos</div>
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.unique_users}</div>
            <div className="text-xs text-muted-foreground">
              Usuários online
            </div>
          </div>

          {/* Sessões Stale */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Sessões Stale</div>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{stats.stale_sessions}</div>
            <div className="text-xs text-muted-foreground">
              Inativas &gt;30min
            </div>
          </div>

          {/* Sessões Múltiplas */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Multi-Sessões</div>
              <Users className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{stats.multi_session_users}</div>
            <div className="text-xs text-muted-foreground">
              Usuários com múltiplas abas
            </div>
          </div>

          {/* Total 24h */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total (24h)</div>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold">{stats.total_sessions_24h}</div>
            <div className="text-xs text-muted-foreground">
              Sessões nas últimas 24h
            </div>
          </div>

          {/* Duração Média */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Duração Média</div>
              <Clock className="h-4 w-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold">{stats.avg_session_duration}min</div>
            <div className="text-xs text-muted-foreground">
              Tempo médio de sessão
            </div>
          </div>
        </div>

        {/* Alertas */}
        {hasMultipleSessions && (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertTitle>Múltiplas Sessões Detectadas</AlertTitle>
            <AlertDescription>
              {stats.multi_session_users} usuários estão com múltiplas abas/dispositivos conectados simultaneamente.
              Isso é normal, mas pode causar conflitos de sincronização.
            </AlertDescription>
          </Alert>
        )}

        {/* Badges de Status */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant={isHealthy ? "default" : "destructive"}>
            {isHealthy ? "Saudável" : "Requer Atenção"}
          </Badge>
          <Badge variant="outline">
            Atualizado a cada 30s
          </Badge>
          {stats.stale_sessions === 0 && (
            <Badge variant="default" className="bg-green-500">
              Sem Sessões Stale
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

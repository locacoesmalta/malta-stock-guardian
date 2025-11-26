import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Database, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SyncStatus {
  internal: number;
  external: number;
  synced: boolean;
  table: string;
}

interface SyncStatusResponse {
  status: SyncStatus[];
  timestamp: string;
}

export default function ExternalSync() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Fetch sync status
  const { data: statusData, isLoading: statusLoading, refetch } = useQuery({
    queryKey: ['external-sync-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SyncStatusResponse>('sync-to-external/status');
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Atualiza a cada 30s
  });

  // Full sync mutation
  const fullSyncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sync-to-external/full', {
        method: 'POST',
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastSyncTime(new Date().toLocaleString('pt-BR'));
      toast({
        title: "Sincronização Completa Iniciada",
        description: "A sincronização de todas as tabelas foi iniciada. Isso pode levar alguns minutos.",
      });
      setTimeout(() => refetch(), 2000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro na Sincronização",
        description: error.message || "Não foi possível iniciar a sincronização completa.",
      });
    },
  });

  // Incremental sync mutation
  const incrementalSyncMutation = useMutation({
    mutationFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Últimas 24h
      const { data, error } = await supabase.functions.invoke('sync-to-external/incremental', {
        method: 'POST',
        body: { since },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastSyncTime(new Date().toLocaleString('pt-BR'));
      toast({
        title: "Sincronização Incremental Concluída",
        description: "Alterações das últimas 24h foram sincronizadas.",
      });
      setTimeout(() => refetch(), 2000);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro na Sincronização",
        description: error.message || "Não foi possível executar a sincronização incremental.",
      });
    },
  });

  const totalInternal = statusData?.status.reduce((sum, t) => sum + t.internal, 0) || 0;
  const totalExternal = statusData?.status.reduce((sum, t) => sum + t.external, 0) || 0;
  const syncedTables = statusData?.status.filter(t => t.synced).length || 0;
  const totalTables = statusData?.status.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronização Externa</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie a sincronização de dados com o banco de dados externo
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Internos</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalInternal.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registros Externos</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExternal.toLocaleString('pt-BR')}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tabelas Sincronizadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncedTables} / {totalTables}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">{lastSyncTime || "Nunca"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações de Sincronização</CardTitle>
            <CardDescription>
              Execute sincronização completa ou incremental dos dados
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              onClick={() => fullSyncMutation.mutate()}
              disabled={fullSyncMutation.isPending}
              size="lg"
            >
              {fullSyncMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronização Completa
            </Button>

            <Button
              variant="outline"
              onClick={() => incrementalSyncMutation.mutate()}
              disabled={incrementalSyncMutation.isPending}
              size="lg"
            >
              {incrementalSyncMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sincronização Incremental (24h)
            </Button>

            <Button
              variant="ghost"
              onClick={() => refetch()}
              disabled={statusLoading}
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar Status
            </Button>
          </CardContent>
        </Card>

        {/* Tables Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Tabelas</CardTitle>
            <CardDescription>
              Contagem de registros por tabela
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" label="Carregando status..." />
              </div>
            ) : (
              <div className="space-y-2">
                {statusData?.status.map((table) => (
                  <div
                    key={table.table}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{table.table}</div>
                      {table.synced ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Sincronizado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Desatualizado
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Interno:</span>{" "}
                        <span className="font-medium">{table.internal}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Externo:</span>{" "}
                        <span className="font-medium">{table.external}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

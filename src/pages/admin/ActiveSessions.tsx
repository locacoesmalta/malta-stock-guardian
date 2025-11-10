import { useActiveUsers } from '@/hooks/useActiveUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, User, Clock, MapPin, Monitor, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ActiveSessions() {
  const { activeUsers, loading, error, refetch } = useActiveUsers();

  const getInactivityTime = (lastActivity: string) => {
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const diffMs = now.getTime() - lastActivityDate.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    return {
      minutes: diffMinutes,
      formatted: formatDistanceToNow(lastActivityDate, { 
        addSuffix: true, 
        locale: ptBR 
      }),
    };
  };

  const getInactivityBadge = (minutes: number) => {
    if (minutes < 5) {
      return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>;
    } else if (minutes < 15) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pouco Inativo</Badge>;
    } else if (minutes < 20) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">Inativo</Badge>;
    } else {
      return <Badge variant="destructive">Muito Inativo</Badge>;
    }
  };

  const onlineUsers = activeUsers.filter(u => u.is_online);
  const offlineUsers = activeUsers.filter(u => !u.is_online);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessões Ativas</h1>
          <p className="text-muted-foreground">
            Monitore usuários ativos e seus tempos de inatividade em tempo real
          </p>
        </div>
        <Button onClick={refetch} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Online</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{onlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Ativos no momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Offline</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offlineUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Desconectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Sessões</CardTitle>
            <Monitor className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Sessões rastreadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            Usuários Online ({onlineUsers.length})
          </h2>
          <div className="grid gap-4">
            {onlineUsers.map((user) => {
              const inactivity = getInactivityTime(user.last_activity);
              return (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {user.user_name || 'Usuário sem nome'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            {user.user_email}
                          </CardDescription>
                        </div>
                      </div>
                      {getInactivityBadge(inactivity.minutes)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Última atividade</p>
                          <p className="font-medium">{inactivity.formatted}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Página atual</p>
                          <p className="font-medium">{user.current_route || 'Desconhecida'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Navegador</p>
                          <p className="font-medium text-xs truncate">
                            {user.browser_info?.platform || 'Desconhecido'}
                          </p>
                        </div>
                      </div>
                    </div>
                    {inactivity.minutes >= 15 && (
                      <Alert className="mt-4" variant="default">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Este usuário será deslogado automaticamente em{' '}
                          <strong>{20 - inactivity.minutes} minutos</strong> se permanecer inativo.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Offline Users */}
      {offlineUsers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <div className="h-3 w-3 bg-muted-foreground rounded-full" />
            Usuários Offline ({offlineUsers.length})
          </h2>
          <div className="grid gap-4">
            {offlineUsers.map((user) => {
              const inactivity = getInactivityTime(user.last_activity);
              return (
                <Card key={user.id} className="opacity-60">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {user.user_name || 'Usuário sem nome'}
                          </CardTitle>
                          <CardDescription>{user.user_email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">Offline</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-muted-foreground">Última vez online</p>
                        <p className="font-medium">{inactivity.formatted}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeUsers.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma sessão ativa</p>
            <p className="text-sm text-muted-foreground">
              Nenhum usuário está conectado no momento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

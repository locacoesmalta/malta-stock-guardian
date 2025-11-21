import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Calendar, Download, Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserActivities } from "@/hooks/useUserActivities";
import { UserActivityDetails } from "@/components/admin/UserActivityDetails";
import { Badge } from "@/components/ui/badge";

export default function UserActivities() {
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserData, setSelectedUserData] = useState<{ email: string; name: string | null } | null>(null);

  const { data: userActivities = [], isLoading } = useUserActivities({
    startDate,
    endDate,
  });

  // Filtrar usuários por termo de busca
  const filteredUsers = userActivities.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.user_email.toLowerCase().includes(searchLower) ||
      (user.user_name && user.user_name.toLowerCase().includes(searchLower))
    );
  });

  // Calcular estatísticas do período
  const totalActions = filteredUsers.reduce((sum, user) => sum + user.total_actions, 0);
  const totalUsers = filteredUsers.length;
  const mostActiveUser = filteredUsers[0]; // Já está ordenado por total_actions

  // Função para obter indicador de atividade
  const getActivityIndicator = (lastActivity: string) => {
    const now = new Date();
    const lastActivityDate = new Date(lastActivity);
    const diffHours = (now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) return { color: "bg-green-500", label: "🟢 Ativo hoje" };
    if (diffHours < 48) return { color: "bg-yellow-500", label: "🟡 Ativo ontem" };
    return { color: "bg-red-500", label: "🔴 Inativo há dias" };
  };

  // Função para exportar CSV
  const handleExport = () => {
    const csvRows = [
      ["Email", "Nome", "Total Ações", "Dias Ativos", "Criações", "Edições", "Exclusões", "Última Atividade"],
      ...filteredUsers.map((user) => [
        user.user_email,
        user.user_name || "-",
        user.total_actions,
        user.days_active,
        user.actions_breakdown.INSERT,
        user.actions_breakdown.UPDATE,
        user.actions_breakdown.DELETE,
        format(new Date(user.last_activity), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `atividades-usuarios-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Atividades dos Usuários</h1>
              <p className="text-muted-foreground">
                Acompanhe o que cada usuário fez no sistema
              </p>
            </div>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Ajuste o período e busque por usuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Início</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Fim</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={format(endDate, "yyyy-MM-dd")}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar Usuário</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Período */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Resumo do Período Selecionado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Ações</p>
              <p className="text-2xl font-bold">{totalActions.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mais Ativo</p>
              <p className="text-2xl font-bold truncate">
                {mostActiveUser ? mostActiveUser.user_name || mostActiveUser.user_email : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Lista de Usuários</CardTitle>
          <CardDescription>Ordenado por atividade (maior → menor)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="mx-auto h-12 w-12 mb-2 opacity-50" />
              <p>Nenhuma atividade encontrada no período selecionado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const indicator = getActivityIndicator(user.last_activity);
                const lastActivityFormatted = format(
                  new Date(user.last_activity),
                  "dd/MM/yyyy 'às' HH:mm",
                  { locale: ptBR }
                );

                return (
                  <div
                    key={user.user_id}
                    className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${indicator.color}`} />
                          <h3 className="font-semibold">
                            {user.user_name || "Nome não disponível"}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{user.user_email}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="secondary">
                            {user.total_actions} ações
                          </Badge>
                          <Badge variant="outline">
                            {user.days_active} dias ativos
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Há {Math.round((new Date().getTime() - new Date(user.last_activity).getTime()) / (1000 * 60 * 60))}h
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Criações: {user.actions_breakdown.INSERT} • Edições: {user.actions_breakdown.UPDATE} • Exclusões: {user.actions_breakdown.DELETE}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedUserId(user.user_id);
                          setSelectedUserData({
                            email: user.user_email,
                            name: user.user_name,
                          });
                        }}
                      >
                        📊 Ver Detalhes
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedUserId && selectedUserData && (
        <UserActivityDetails
          userId={selectedUserId}
          userEmail={selectedUserData.email}
          userName={selectedUserData.name}
          startDate={startDate}
          endDate={endDate}
          open={!!selectedUserId}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedUserId(null);
              setSelectedUserData(null);
            }
          }}
        />
      )}
    </div>
  );
}

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUserActivityDetails } from "@/hooks/useUserActivityDetails";
import {
  translateActivity,
  getActionEmoji,
  getActionColor,
  translateAction,
} from "@/lib/activityTranslator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface UserActivityDetailsProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  startDate: Date;
  endDate: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserActivityDetails({
  userId,
  userEmail,
  userName,
  startDate,
  endDate,
  open,
  onOpenChange,
}: UserActivityDetailsProps) {
  const { data: activities = [], isLoading } = useUserActivityDetails({
    userId,
    startDate,
    endDate,
    enabled: open,
  });

  // Calcular resumo do dia
  const totalActions = activities.length;
  const creations = activities.filter((a) => a.action === "INSERT").length;
  const updates = activities.filter((a) => a.action === "UPDATE").length;
  const deletions = activities.filter((a) => a.action === "DELETE").length;

  // Função para exportar CSV detalhado
  const handleExportDetails = () => {
    const csvRows = [
      ["Data/Hora", "Ação", "Contexto", "Tabela", "IP"],
      ...activities.map((activity) => [
        format(new Date(activity.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
        translateAction(activity.action),
        translateActivity({
          table_name: activity.table_name || "",
          action: activity.action,
          new_data: activity.new_data,
          old_data: activity.old_data,
        }),
        activity.table_name || "-",
        activity.ip_address || "-",
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `atividades-${userEmail}-${format(new Date(), "yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">
                Atividades de: {userName || userEmail}
              </DialogTitle>
              <DialogDescription>
                📅 {format(startDate, "dd/MM/yyyy", { locale: ptBR })} até{" "}
                {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportDetails}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
          </div>
        </DialogHeader>

        <div className="px-6">
          {/* Resumo do Período */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base">📊 Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{totalActions}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{creations}</p>
                  <p className="text-xs text-muted-foreground">Criações</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{updates}</p>
                  <p className="text-xs text-muted-foreground">Edições</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{deletions}</p>
                  <p className="text-xs text-muted-foreground">Exclusões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Histórico Detalhado */}
        <div className="px-6 pb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📝 Histórico Detalhado</CardTitle>
              <CardDescription>Cronologia de ações realizadas</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px] px-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Nenhuma atividade registrada no período.</p>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    {activities.map((activity, index) => {
                      const friendlyText = translateActivity({
                        table_name: activity.table_name || "",
                        action: activity.action,
                        new_data: activity.new_data,
                        old_data: activity.old_data,
                      });

                      return (
                        <div key={activity.id}>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className="text-2xl">{getActionEmoji(activity.action)}</div>
                              {index < activities.length - 1 && (
                                <div className="w-px h-full bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {format(new Date(activity.created_at), "HH:mm", {
                                        locale: ptBR,
                                      })}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={getActionColor(activity.action)}
                                    >
                                      {translateAction(activity.action)}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium">{friendlyText}</p>
                                  {activity.table_name && (
                                    <p className="text-xs text-muted-foreground">
                                      Tabela: {activity.table_name}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          {index < activities.length - 1 && <Separator className="my-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="px-6 pb-6 flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Wrench, Calendar, Clock, User, DollarSign } from "lucide-react";
import { formatHourmeter } from "@/lib/hourmeterUtils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

interface MaintenanceCardProps {
  maintenance: any;
  onDelete?: (id: string) => void;
}

export function MaintenanceCard({ maintenance, onDelete }: MaintenanceCardProps) {
  const { permissions } = useAuth();
  const canDelete = permissions?.can_delete_assets;

  const maintenanceTypeLabel = maintenance.maintenance_type === "preventiva"
    ? "Preventiva"
    : "Corretiva";

  const maintenanceTypeVariant = maintenance.maintenance_type === "preventiva"
    ? "default"
    : "destructive";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <CardTitle className="text-lg">
              Manutenção {maintenanceTypeLabel}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={maintenanceTypeVariant}>
              {maintenanceTypeLabel}
            </Badge>
            {canDelete && onDelete && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir esta manutenção? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(maintenance.id)}>
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(new Date(maintenance.maintenance_date), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>

          {maintenance.technician_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{maintenance.technician_name}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Horímetro:</span>
          </div>
          <div className="pl-6 text-sm space-y-1">
            <p>Anterior: {formatHourmeter(maintenance.previous_hourmeter)}</p>
            <p>Atual: {formatHourmeter(maintenance.current_hourmeter)}</p>
            <p className="font-semibold text-primary">
              Total trabalhado: {formatHourmeter(maintenance.total_hourmeter)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Serviços Realizados:</p>
          <p className="text-sm text-muted-foreground pl-4">
            {maintenance.services_performed}
          </p>
        </div>

        {maintenance.observations && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Observações:</p>
            <p className="text-sm text-muted-foreground pl-4">
              {maintenance.observations}
            </p>
          </div>
        )}

        {maintenance.total_cost > 0 && (
          <div className="flex items-center gap-2 text-sm border-t pt-4">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Custo Total:</span>
            <span className="font-bold text-primary">
              R$ {maintenance.total_cost.toFixed(2)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

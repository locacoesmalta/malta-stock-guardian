import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  location_type: string;
}

interface AssetMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  targetStatus: string;
  onConfirm: (data: MovementData) => void;
}

export interface MovementData {
  rental_company?: string;
  rental_work_site?: string;
  rental_start_date?: string;
  maintenance_company?: string;
  maintenance_work_site?: string;
  maintenance_arrival_date?: string;
  maintenance_description?: string;
  deposito_description?: string;
  notes?: string;
}

export const AssetMovementDialog = ({
  open,
  onOpenChange,
  asset,
  targetStatus,
  onConfirm,
}: AssetMovementDialogProps) => {
  const [formData, setFormData] = useState<MovementData>({});
  const [selectedDate, setSelectedDate] = useState<Date>();

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "deposito_malta": return "Depósito Malta";
      case "em_manutencao": return "Em Manutenção";
      case "locacao": return "Locação";
      case "aguardando_laudo": return "Aguardando Laudo";
      default: return status;
    }
  };

  const handleConfirm = () => {
    const data: MovementData = { ...formData };
    
    // Adicionar data selecionada conforme o tipo de movimentação
    if (targetStatus === "locacao" && selectedDate) {
      data.rental_start_date = format(selectedDate, "yyyy-MM-dd");
    } else if (targetStatus === "em_manutencao" && selectedDate) {
      data.maintenance_arrival_date = format(selectedDate, "yyyy-MM-dd");
    }

    onConfirm(data);
    setFormData({});
    setSelectedDate(undefined);
  };

  if (!asset) return null;

  const renderFields = () => {
    switch (targetStatus) {
      case "locacao":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="rental_company">Empresa *</Label>
              <Input
                id="rental_company"
                value={formData.rental_company || ""}
                onChange={(e) => setFormData({ ...formData, rental_company: e.target.value })}
                placeholder="Nome da empresa de locação"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rental_work_site">Obra *</Label>
              <Input
                id="rental_work_site"
                value={formData.rental_work_site || ""}
                onChange={(e) => setFormData({ ...formData, rental_work_site: e.target.value })}
                placeholder="Local da obra"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </>
        );

      case "em_manutencao":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="maintenance_company">Empresa *</Label>
              <Input
                id="maintenance_company"
                value={formData.maintenance_company || ""}
                onChange={(e) => setFormData({ ...formData, maintenance_company: e.target.value })}
                placeholder="Nome da empresa de manutenção"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance_work_site">Local *</Label>
              <Input
                id="maintenance_work_site"
                value={formData.maintenance_work_site || ""}
                onChange={(e) => setFormData({ ...formData, maintenance_work_site: e.target.value })}
                placeholder="Local da manutenção"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Entrada *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance_description">Descrição</Label>
              <Textarea
                id="maintenance_description"
                value={formData.maintenance_description || ""}
                onChange={(e) => setFormData({ ...formData, maintenance_description: e.target.value })}
                placeholder="Descreva o motivo da manutenção"
                rows={3}
              />
            </div>
          </>
        );

      case "deposito_malta":
        return (
          <div className="space-y-2">
            <Label htmlFor="deposito_description">Descrição (Opcional)</Label>
            <Textarea
              id="deposito_description"
              value={formData.deposito_description || ""}
              onChange={(e) => setFormData({ ...formData, deposito_description: e.target.value })}
              placeholder="Observações sobre o equipamento no depósito"
              rows={3}
            />
          </div>
        );

      case "aguardando_laudo":
        return (
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a movimentação"
              rows={3}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const isFormValid = () => {
    switch (targetStatus) {
      case "locacao":
        return formData.rental_company && formData.rental_work_site && selectedDate;
      case "em_manutencao":
        return formData.maintenance_company && formData.maintenance_work_site && selectedDate;
      default:
        return true;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirmar Movimentação</DialogTitle>
          <DialogDescription>
            Movendo <strong>{asset.asset_code}</strong> para{" "}
            <strong>{getStatusLabel(targetStatus)}</strong>
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta ação registrará a movimentação no histórico do equipamento.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          {renderFields()}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!isFormValid()}>
            Confirmar Movimentação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

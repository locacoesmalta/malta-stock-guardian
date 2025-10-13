import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateRentalEquipment } from "@/hooks/useRentalEquipment";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

interface ReturnEquipmentDialogProps {
  equipment: {
    id: string;
    asset_id: string | null;
    asset_code: string;
    equipment_name: string;
    pickup_date: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReturnEquipmentDialog({ equipment, open, onOpenChange }: ReturnEquipmentDialogProps) {
  const [returnDate, setReturnDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const updateMutation = useUpdateRentalEquipment();
  const navigate = useNavigate();

  const handleReturn = async () => {
    await updateMutation.mutateAsync({
      id: equipment.id,
      return_date: returnDate,
    });

    onOpenChange(false);

    // Redirecionar para movimentação do ativo
    if (equipment.asset_id) {
      navigate(`/assets/movement/${equipment.asset_id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Devolução de Equipamento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">PAT: {equipment.asset_code}</p>
            <p className="font-medium">{equipment.equipment_name}</p>
            <p className="text-sm text-muted-foreground">
              Retirado em: {format(parseISO(equipment.pickup_date), "dd/MM/yyyy")}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Data de Devolução *</Label>
            <Input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              min={equipment.pickup_date}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReturn} disabled={updateMutation.isPending}>
              Confirmar Devolução
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

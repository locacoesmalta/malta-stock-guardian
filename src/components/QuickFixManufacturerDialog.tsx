import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EquipmentBrandSelector } from "@/components/EquipmentBrandSelector";

interface QuickFixManufacturerDialogProps {
  assetId: string;
  assetCode: string;
  equipmentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickFixManufacturerDialog = ({
  assetId,
  assetCode,
  equipmentName,
  open,
  onOpenChange,
}: QuickFixManufacturerDialogProps) => {
  const [manufacturer, setManufacturer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!manufacturer || manufacturer.trim() === "") {
      toast.error("Selecione um fabricante");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("assets")
        .update({ manufacturer: manufacturer.trim() })
        .eq("id", assetId);

      if (error) throw error;

      toast.success(`Fabricante atualizado para ${assetCode}`);
      
      // Invalidar queries para atualizar dados
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets-missing-manufacturer"] });
      queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
      
      onOpenChange(false);
      setManufacturer("");
    } catch (error: any) {
      console.error("Error updating manufacturer:", error);
      toast.error("Erro ao atualizar fabricante");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Corrigir Fabricante</DialogTitle>
          <DialogDescription>
            Adicione o fabricante para o equipamento <strong>{equipmentName}</strong> (PAT: {assetCode})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Fabricante *</Label>
            <EquipmentBrandSelector
              value={manufacturer}
              onChange={setManufacturer}
            />
            <p className="text-xs text-muted-foreground">
              Selecione um fabricante existente ou digite um novo
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !manufacturer}>
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

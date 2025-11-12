import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, RefreshCw, Move } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubstitutionDecisionDialogProps {
  asset: {
    asset_code: string;
    equipment_name: string;
    location_type: string;
    rental_company?: string;
    rental_work_site?: string;
    maintenance_company?: string;
    maintenance_work_site?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubstitution: () => void;
  onNormalMovement: () => void;
}

const getLocationLabel = (locationType: string) => {
  switch (locationType) {
    case "deposito_malta": return "Depósito Malta";
    case "em_manutencao": return "Em Manutenção";
    case "locacao": return "Locação";
    case "aguardando_laudo": return "Aguardando Laudo";
    default: return locationType;
  }
};

const getLocationVariant = (locationType: string) => {
  switch (locationType) {
    case "deposito_malta": return "secondary" as const;
    case "em_manutencao": return "destructive" as const;
    case "locacao": return "default" as const;
    case "aguardando_laudo": return "outline" as const;
    default: return "secondary" as const;
  }
};

export function SubstitutionDecisionDialog({
  asset,
  open,
  onOpenChange,
  onSubstitution,
  onNormalMovement,
}: SubstitutionDecisionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            Este equipamento será substituído?
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo de movimentação para este equipamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do equipamento */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">PAT:</span>
              <span className="text-sm font-mono">{asset.asset_code}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Equipamento:</span>
              <span className="text-sm">{asset.equipment_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Localização Atual:</span>
              <Badge variant={getLocationVariant(asset.location_type)}>
                {getLocationLabel(asset.location_type)}
              </Badge>
            </div>
            {asset.rental_company && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Empresa:</span>
                <span className="text-sm">{asset.rental_company}</span>
              </div>
            )}
            {asset.rental_work_site && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Obra:</span>
                <span className="text-sm">{asset.rental_work_site}</span>
              </div>
            )}
            {asset.maintenance_company && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Empresa Manutenção:</span>
                <span className="text-sm">{asset.maintenance_company}</span>
              </div>
            )}
            {asset.maintenance_work_site && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Obra Manutenção:</span>
                <span className="text-sm">{asset.maintenance_work_site}</span>
              </div>
            )}
          </div>

          {/* Opção: Substituição */}
          <Alert className="border-purple-500 bg-purple-50 dark:bg-purple-950">
            <RefreshCw className="h-4 w-4 text-purple-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-purple-700">✓ SIM, é uma substituição</p>
                <ul className="text-sm text-purple-600 space-y-1 ml-4">
                  <li>• Equipamento vai para <strong>Aguardando Laudo</strong></li>
                  <li>• Sistema solicitará PAT do substituto</li>
                  <li>• Substituto herdará automaticamente empresa e obra</li>
                  <li>• Histórico completo será preservado</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Opção: Movimentação Normal */}
          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <Move className="h-4 w-4 text-blue-600" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-blue-700">✗ NÃO, movimentação normal</p>
                <ul className="text-sm text-blue-600 space-y-1 ml-4">
                  <li>• Alterar localização do equipamento</li>
                  <li>• Atualizar empresa, obra ou depósito</li>
                  <li>• Sem vínculo com substituição</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onNormalMovement}
            className="w-full sm:w-auto"
          >
            <Move className="h-4 w-4 mr-2" />
            Movimentação Normal
          </Button>
          <Button
            onClick={onSubstitution}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sim, é Substituição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

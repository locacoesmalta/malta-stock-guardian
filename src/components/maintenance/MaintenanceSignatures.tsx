import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/SignatureCanvas";
import { PenTool } from "lucide-react";

interface MaintenanceSignaturesProps {
  supervisorName: string;
  supervisorSignature: string;
  technicianName: string;
  technicianSignature: string;
  clientSignature: string;
  onChange: (field: string, value: string) => void;
}

export function MaintenanceSignatures({
  supervisorName,
  supervisorSignature,
  technicianName,
  technicianSignature,
  clientSignature,
  onChange,
}: MaintenanceSignaturesProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5" />
          Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supervisor */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="supervisor_name">Supervisor do Plano</Label>
              <Input
                id="supervisor_name"
                value={supervisorName}
                onChange={(e) => onChange("supervisor_name", e.target.value)}
                placeholder="Nome do supervisor"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura do Supervisor</Label>
              <SignaturePad
                value={supervisorSignature}
                onChange={(sig) => onChange("supervisor_signature", sig)}
              />
            </div>
          </div>

          {/* Técnico */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="technician_name">Técnico Responsável</Label>
              <Input
                id="technician_name"
                value={technicianName}
                onChange={(e) => onChange("technician_name", e.target.value)}
                placeholder="Nome do técnico"
              />
            </div>
            <div className="space-y-2">
              <Label>Assinatura do Técnico</Label>
              <SignaturePad
                value={technicianSignature}
                onChange={(sig) => onChange("technician_signature", sig)}
              />
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <p className="text-sm text-muted-foreground">
                Assinatura do cliente confirmando recebimento do plano
              </p>
            </div>
            <div className="space-y-2">
              <Label>Assinatura do Cliente</Label>
              <SignaturePad
                value={clientSignature}
                onChange={(sig) => onChange("client_signature", sig)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

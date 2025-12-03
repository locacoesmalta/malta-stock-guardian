import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignaturePad } from "@/components/SignatureCanvas";
import { PenTool } from "lucide-react";

interface MaintenanceSignaturesProps {
  supervisorName: string;
  supervisorCpf: string;
  supervisorSignature: string;
  technicianName: string;
  technicianCpf: string;
  technicianSignature: string;
  clientName: string;
  clientCpf: string;
  clientSignature: string;
  onChange: (field: string, value: string) => void;
}

export function MaintenanceSignatures({
  supervisorName,
  supervisorCpf,
  supervisorSignature,
  technicianName,
  technicianCpf,
  technicianSignature,
  clientName,
  clientCpf,
  clientSignature,
  onChange,
}: MaintenanceSignaturesProps) {
  return (
    <Card className="signatures-section">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <PenTool className="h-5 w-5" />
          Assinaturas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Supervisor */}
          <div className="space-y-3 signature-box">
            <div className="space-y-2">
              <Label htmlFor="supervisor_name">Supervisor do Plano</Label>
              <Input
                id="supervisor_name"
                value={supervisorName}
                onChange={(e) => onChange("supervisor_name", e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supervisor_cpf">CPF / Matrícula</Label>
              <Input
                id="supervisor_cpf"
                value={supervisorCpf}
                onChange={(e) => onChange("supervisor_cpf", e.target.value)}
                placeholder="CPF ou Matrícula"
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
          <div className="space-y-3 signature-box">
            <div className="space-y-2">
              <Label htmlFor="technician_name">Técnico Responsável</Label>
              <Input
                id="technician_name"
                value={technicianName}
                onChange={(e) => onChange("technician_name", e.target.value)}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technician_cpf">CPF / Matrícula</Label>
              <Input
                id="technician_cpf"
                value={technicianCpf}
                onChange={(e) => onChange("technician_cpf", e.target.value)}
                placeholder="CPF ou Matrícula"
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
          <div className="space-y-3 signature-box">
            <div className="space-y-2">
              <Label htmlFor="client_name">Nome do Cliente</Label>
              <Input
                id="client_name"
                value={clientName}
                onChange={(e) => onChange("client_name", e.target.value)}
                placeholder="Nome completo do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_cpf">CPF / Matrícula</Label>
              <Input
                id="client_cpf"
                value={clientCpf}
                onChange={(e) => onChange("client_cpf", e.target.value)}
                placeholder="CPF ou Matrícula"
              />
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

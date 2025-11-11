import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReportFormFieldsProps {
  company: string;
  workSite: string;
  technicianName: string;
  reportDate: string;
  serviceComments: string;
  considerations: string;
  observations: string;
  receiver: string;
  responsible: string;
  equipment: any;
  onCompanyChange: (value: string) => void;
  onWorkSiteChange: (value: string) => void;
  onTechnicianNameChange: (value: string) => void;
  onReportDateChange: (value: string) => void;
  onServiceCommentsChange: (value: string) => void;
  onConsiderationsChange: (value: string) => void;
  onObservationsChange: (value: string) => void;
  onReceiverChange: (value: string) => void;
  onResponsibleChange: (value: string) => void;
}

export const ReportFormFields = ({
  company,
  workSite,
  technicianName,
  reportDate,
  serviceComments,
  considerations,
  observations,
  receiver,
  responsible,
  equipment,
  onCompanyChange,
  onWorkSiteChange,
  onTechnicianNameChange,
  onReportDateChange,
  onServiceCommentsChange,
  onConsiderationsChange,
  onObservationsChange,
  onReceiverChange,
  onResponsibleChange,
}: ReportFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Cliente *</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => onCompanyChange(e.target.value)}
            placeholder="Nome do cliente"
            required
            readOnly={!!equipment}
            className={equipment ? "bg-muted cursor-not-allowed" : ""}
          />
          {equipment && (
            <p className="text-xs text-muted-foreground">
              Preenchido automaticamente do cadastro do equipamento
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="work_site">Obra *</Label>
          <Input
            id="work_site"
            value={workSite}
            onChange={(e) => onWorkSiteChange(e.target.value)}
            placeholder="Nome da obra"
            required
            readOnly={!!equipment}
            className={equipment ? "bg-muted cursor-not-allowed" : ""}
          />
          {equipment && (
            <p className="text-xs text-muted-foreground">
              Preenchido automaticamente do cadastro do equipamento
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="technician_name">Técnico Responsável *</Label>
          <Input
            id="technician_name"
            value={technicianName}
            onChange={(e) => onTechnicianNameChange(e.target.value)}
            placeholder="Nome do técnico"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="report_date">Data do Relatório *</Label>
          <Input
            id="report_date"
            type="date"
            value={reportDate}
            onChange={(e) => onReportDateChange(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_comments">Comentários do Serviço *</Label>
        <Textarea
          id="service_comments"
          value={serviceComments}
          onChange={(e) => onServiceCommentsChange(e.target.value)}
          placeholder="Descreva os serviços executados"
          className="min-h-[100px]"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="considerations">Considerações Técnicas</Label>
        <Textarea
          id="considerations"
          value={considerations}
          onChange={(e) => onConsiderationsChange(e.target.value)}
          placeholder="Considerações técnicas adicionais (opcional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          placeholder="Observações gerais (opcional)"
          className="min-h-[80px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="receiver">Recebedor</Label>
          <Input
            id="receiver"
            value={receiver}
            onChange={(e) => onReceiverChange(e.target.value)}
            placeholder="Nome do recebedor (opcional)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsible">Responsável</Label>
          <Input
            id="responsible"
            value={responsible}
            onChange={(e) => onResponsibleChange(e.target.value)}
            placeholder="Nome do responsável (opcional)"
          />
        </div>
      </div>
    </>
  );
};

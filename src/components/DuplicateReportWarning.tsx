import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDuplicateReportDetection } from "@/hooks/useDuplicateReportDetection";

interface DuplicateReportWarningProps {
  equipmentCode: string;
  reportDate: string;
  excludeReportId?: string;
}

/**
 * Componente que exibe alerta quando detecta relatórios duplicados
 * no mesmo equipamento e data
 */
export const DuplicateReportWarning = ({
  equipmentCode,
  reportDate,
  excludeReportId,
}: DuplicateReportWarningProps) => {
  const { data: duplicates, isLoading } = useDuplicateReportDetection({
    equipmentCode,
    reportDate,
    excludeReportId,
  });

  if (isLoading || !duplicates || duplicates.length === 0) {
    return null;
  }

  return (
    <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-300">
        <strong>Atenção:</strong> Já existe{" "}
        {duplicates.length === 1 ? "um relatório" : `${duplicates.length} relatórios`} para este
        equipamento (PAT: {equipmentCode}) na data{" "}
        {format(new Date(reportDate + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}.
        <div className="mt-2 space-y-1">
          {duplicates.map((report) => (
            <div key={report.id} className="text-xs">
              • Técnico: {report.technician_name} - Empresa: {report.company}
            </div>
          ))}
        </div>
        <div className="mt-2">
          Verifique se não é uma duplicação acidental antes de prosseguir.
        </div>
      </AlertDescription>
    </Alert>
  );
};

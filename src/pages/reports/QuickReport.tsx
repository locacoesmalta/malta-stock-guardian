import { BackButton } from "@/components/BackButton";
import { QuickReportForm } from "@/components/reports/QuickReportForm";
import { useSearchParams } from "react-router-dom";

const QuickReport = () => {
  const [searchParams] = useSearchParams();
  const initialPat = searchParams.get("pat") || undefined;

  return (
    <div className="space-y-4">
      <BackButton />
      <div>
        <h1 className="text-3xl font-bold">Relatório Rápido</h1>
        <p className="text-muted-foreground">
          Crie relatórios em 4 etapas simples
        </p>
      </div>
      <QuickReportForm initialPat={initialPat} />
    </div>
  );
};

export default QuickReport;

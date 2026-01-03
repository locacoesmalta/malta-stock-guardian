import { ViabilityAnalysisCard } from "@/components/pricing/ViabilityAnalysisCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ViabilityAnalysisPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/pricing')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Análise de Viabilidade</h1>
          <p className="text-muted-foreground">
            Analise se vale a pena reparar ou substituir um equipamento
          </p>
        </div>
      </div>

      <ViabilityAnalysisCard />
    </div>
  );
}

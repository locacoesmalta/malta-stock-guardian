import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { BackButton } from "@/components/BackButton";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MaintenancePlanForm } from "@/components/maintenance/MaintenancePlanForm";
import { useMaintenancePlans } from "@/hooks/useMaintenancePlans";
import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MaintenancePlanView() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { usePlanById } = useMaintenancePlans();
  
  const { data: plan, isLoading, error } = usePlanById(id);
  const shouldPrint = searchParams.get("print") === "true";
  
  // Auto-print quando parâmetro print=true
  useEffect(() => {
    if (shouldPrint && plan && !isLoading) {
      setTimeout(() => window.print(), 500);
    }
  }, [shouldPrint, plan, isLoading]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <BackButton />
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" label="Carregando plano de manutenção..." />
        </div>
      </div>
    );
  }
  
  if (error || !plan) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <BackButton />
        <Card className="mt-6">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium">Plano não encontrado</p>
            <p className="text-muted-foreground mb-4">
              O plano de manutenção solicitado não existe ou foi excluído.
            </p>
            <Button onClick={() => navigate("/maintenance/plans")}>
              Voltar para Listagem
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <BackButton />
      
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold">
          Editar Plano de Manutenção
          {plan.equipment_code && <span className="text-muted-foreground"> - PAT {plan.equipment_code}</span>}
        </h1>
        <p className="text-muted-foreground">
          {plan.plan_type === "preventiva" ? "Preventiva" : "Corretiva"} - {plan.equipment_name}
        </p>
      </div>

      <MaintenancePlanForm 
        planId={id} 
        initialData={plan}
        mode="edit" 
      />
    </div>
  );
}

import { BackButton } from "@/components/BackButton";
import { MaintenancePlanForm } from "@/components/maintenance/MaintenancePlanForm";

export default function MaintenancePlan() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      <BackButton />
      
      <div className="mb-6 no-print">
        <h1 className="text-2xl font-bold">Novo Plano de Manutenção</h1>
        <p className="text-muted-foreground">
          Crie um plano de manutenção preventiva ou corretiva para o equipamento
        </p>
      </div>

      <MaintenancePlanForm />
    </div>
  );
}

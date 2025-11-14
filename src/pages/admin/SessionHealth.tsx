import { AppHeader } from "@/components/AppHeader";
import { SessionHealthDashboard } from "@/components/admin/SessionHealthDashboard";

export default function SessionHealth() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saúde das Sessões</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento em tempo real de sessões de usuários e detecção de problemas.
          </p>
        </div>
        
        <SessionHealthDashboard />
      </div>
    </div>
  );
}

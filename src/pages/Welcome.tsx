import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Warehouse, BarChart3, FileText, PackageX, Wrench, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WelcomeHeader } from "@/components/WelcomeHeader";
import { NewsAlert } from "@/components/NewsAlert";
import { QuickActionCard } from "@/components/QuickActionCard";
import { useWelcomeData } from "@/hooks/useWelcomeData";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: welcomeData, isLoading, error } = useWelcomeData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-malta-primary/10 via-background to-malta-primary/5 p-4">
        <div className="max-w-5xl w-full space-y-8">
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-malta-primary/10 via-background to-malta-primary/5 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados de boas-vindas. Por favor, tente novamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!welcomeData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-malta-primary/10 via-background to-malta-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Logo Malta */}
        <div className="flex justify-center animate-fade-in">
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain"
            fetchPriority="high"
          />
        </div>

        {/* Header Personalizado */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <WelcomeHeader
            userName={welcomeData.userName}
            userEmail={welcomeData.userEmail}
            greeting={welcomeData.greeting}
            lastLoginFormatted={welcomeData.lastLoginFormatted}
            isFirstLogin={welcomeData.isFirstLogin}
          />
        </div>

        {/* Novidades/Alertas */}
        {welcomeData.news.hasNews && (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-foreground">
                Novidades do Sistema
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {welcomeData.news.lowStockCount > 0 && (
                <NewsAlert
                  icon={PackageX}
                  title="Estoque Baixo"
                  count={welcomeData.news.lowStockCount}
                  description="Produtos precisam de reposição"
                  actionLink="/admin/products"
                  variant="destructive"
                />
              )}
              
              {welcomeData.news.overdueMaintenanceCount > 0 && (
                <NewsAlert
                  icon={Wrench}
                  title="Manutenções Atrasadas"
                  count={welcomeData.news.overdueMaintenanceCount}
                  description="Equipamentos em manutenção há mais de 30 dias"
                  actionLink="/assets"
                  variant="warning"
                />
              )}
              
              {welcomeData.news.pendingReportsCount > 0 && (
                <NewsAlert
                  icon={FileText}
                  title="Relatórios Seus"
                  count={welcomeData.news.pendingReportsCount}
                  description="Relatórios criados por você"
                  actionLink="/reports"
                  variant="default"
                />
              )}
            </div>
          </div>
        )}

        {/* Mensagem quando não há novidades */}
        {!welcomeData.news.hasNews && (
          <Card className="p-6 text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="space-y-2">
              <div className="text-4xl">🎉</div>
              <h3 className="text-lg font-semibold text-foreground">Tudo em ordem!</h3>
              <p className="text-sm text-muted-foreground">
                Não há alertas ou pendências no momento.
              </p>
            </div>
          </Card>
        )}

        {/* Ações Rápidas */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xl font-semibold text-foreground">
            O que você deseja fazer?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={Package}
              title="Controle de Estoque"
              description="Gerenciar retiradas e histórico"
              link="/inventory/withdrawal"
              color="primary"
            />
            
            <QuickActionCard
              icon={Warehouse}
              title="Gestão de Patrimônio"
              description="Cadastrar e gerenciar equipamentos"
              link="/assets"
              color="primary"
            />
            
            <QuickActionCard
              icon={BarChart3}
              title="Dashboard"
              description="Visualizar estatísticas e gráficos"
              link="/dashboard"
              color="primary"
            />
            
            <QuickActionCard
              icon={FileText}
              title="Relatórios"
              description="Criar e visualizar relatórios"
              link="/reports"
              color="primary"
            />
          </div>
        </div>

        {/* Botão Dashboard Completo */}
        <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => navigate("/dashboard")}
            className="px-8"
          >
            Ver Dashboard Completo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

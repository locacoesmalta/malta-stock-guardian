import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Warehouse, BarChart3, FileText, AlertTriangle, Wrench, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWelcomeData } from "@/hooks/useWelcomeData";
import WelcomeHeader from "@/components/WelcomeHeader";
import NewsAlert from "@/components/NewsAlert";
import QuickActionCard from "@/components/QuickActionCard";
import { Skeleton } from "@/components/ui/skeleton";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: welcomeData, isLoading: dataLoading } = useWelcomeData();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
        <div className="space-y-8 max-w-4xl w-full">
          <div className="flex justify-center">
            <img 
              src="/malta-logo.webp" 
              alt="Malta Locações Logo" 
              className="w-32 h-32 object-contain"
              fetchPriority="high"
            />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!welcomeData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações Logo" 
            className="w-24 h-24 md:w-32 md:h-32 object-contain"
            fetchPriority="high"
          />
        </div>

        {/* Header com Saudação */}
        <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <WelcomeHeader
            greeting={welcomeData.greeting}
            userName={welcomeData.userName}
            userEmail={welcomeData.userEmail}
            lastLoginAt={welcomeData.lastLoginAt}
            loginCount={welcomeData.loginCount}
          />
        </div>

        {/* Novidades e Alertas */}
        {welcomeData.news.hasNews && (
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              <h2 className="text-xl font-bold">Novidades e Alertas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {welcomeData.news.lowStockCount > 0 && (
                <NewsAlert
                  icon={Package}
                  title="Produtos com Estoque Baixo"
                  count={welcomeData.news.lowStockCount}
                  description="Produtos precisam de reposição"
                  linkTo="/admin/products"
                  variant="destructive"
                />
              )}
              
              {welcomeData.news.overdueMaintenanceCount > 0 && (
                <NewsAlert
                  icon={Wrench}
                  title="Manutenções Atrasadas"
                  count={welcomeData.news.overdueMaintenanceCount}
                  description="Equipamentos há mais de 30 dias"
                  linkTo="/assets"
                  variant="warning"
                />
              )}
              
              {welcomeData.news.pendingReportsCount > 0 && (
                <NewsAlert
                  icon={ClipboardList}
                  title="Relatórios Pendentes"
                  count={welcomeData.news.pendingReportsCount}
                  description="Seus relatórios criados"
                  linkTo="/reports"
                  variant="default"
                />
              )}
            </div>
          </div>
        )}

        {!welcomeData.news.hasNews && (
          <div className="text-center p-8 bg-background/50 rounded-lg border border-border animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-lg text-muted-foreground">
              ✨ Tudo em ordem! Nenhuma novidade no momento.
            </p>
          </div>
        )}

        {/* Ações Rápidas */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-xl font-bold">O que você deseja fazer?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              icon={Package}
              title="Controle de Estoque"
              description="Gerenciar retiradas e materiais"
              linkTo="/inventory/withdrawal"
              color="primary"
            />
            
            <QuickActionCard
              icon={Warehouse}
              title="Gestão de Patrimônio"
              description="Cadastrar e gerenciar equipamentos"
              linkTo="/assets"
              color="primary"
            />
            
            <QuickActionCard
              icon={BarChart3}
              title="Dashboard Completo"
              description="Visão geral e estatísticas"
              linkTo="/dashboard"
              color="primary"
            />
            
            <QuickActionCard
              icon={FileText}
              title="Relatórios"
              description="Ver e criar relatórios"
              linkTo="/reports"
              color="primary"
            />
          </div>
        </div>

        {/* Botão Extra para Dashboard */}
        <div className="text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mt-4"
          >
            Ver Todas as Opções no Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

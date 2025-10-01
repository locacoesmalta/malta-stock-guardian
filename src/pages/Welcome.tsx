import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Package, Warehouse } from "lucide-react";
import maltaLogo from "@/assets/malta-logo-optimized.webp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
      setUserName(name);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-malta-primary/10 via-background to-malta-primary/5 p-4">
      <div className="text-center space-y-8 max-w-2xl w-full">
        <div className="flex justify-center animate-fade-in">
          <img 
            src={maltaLogo} 
            alt="Malta Locações Logo" 
            className="w-32 h-32 md:w-40 md:h-40 object-contain"
          />
        </div>
        
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Bem-vindo, {userName}!
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Selecione uma opção para continuar:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Card 
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2"
              onClick={() => navigate("/inventory/withdrawal")}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Package className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Controle de Estoque</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Gerenciar retiradas e histórico de materiais
                </p>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2"
              onClick={() => navigate("/assets")}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-primary/10">
                  <Warehouse className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Gestão de Patrimônio</h2>
                <p className="text-sm text-muted-foreground text-center">
                  Cadastrar e gerenciar equipamentos
                </p>
              </div>
            </Card>
          </div>

          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="mt-4"
          >
            Ir para o Dashboard Completo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

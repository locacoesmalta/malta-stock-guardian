import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Package, QrCode } from "lucide-react";
import maltaLogo from "@/assets/malta-logo.png";
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
      <div className="text-center space-y-8 max-w-4xl w-full">
        <div className="flex justify-center">
          <img 
            src={maltaLogo} 
            alt="Malta Locações Logo" 
            className="w-32 h-32 md:w-48 md:h-48 object-contain animate-fade-in"
          />
        </div>
        
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Bem-vindo à Malta Locações, {userName}!
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            Escolha o módulo que deseja acessar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          <Card 
            className="p-6 md:p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
            onClick={() => navigate("/")}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 md:p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Controle de Estoque</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Gerencie produtos, retiradas de material e relatórios de serviço
              </p>
            </div>
          </Card>

          <Card 
            className="p-6 md:p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
            onClick={() => navigate("/assets")}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-4 md:p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-xl md:text-2xl font-bold">Gestão de Patrimônio</h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Cadastre e consulte equipamentos via QR Code pelo celular
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

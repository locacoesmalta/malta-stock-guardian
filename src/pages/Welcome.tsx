import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { Package, QrCode } from "lucide-react";
import maltaLogo from "@/assets/malta-logo.png";

export default function Welcome() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src={maltaLogo} 
              alt="Malta Locações" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Bem-vindo ao Sistema Malta</h1>
          <p className="text-lg text-muted-foreground">
            Escolha o módulo que deseja acessar
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card 
            className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
            onClick={() => navigate("/")}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Package className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Controle de Estoque</h2>
              <p className="text-muted-foreground">
                Gerencie produtos, retiradas de material e relatórios de serviço
              </p>
            </div>
          </Card>

          <Card 
            className="p-8 cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
            onClick={() => navigate("/assets")}
          >
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <QrCode className="h-16 w-16 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl font-bold">Gestão de Patrimônio</h2>
              <p className="text-muted-foreground">
                Cadastre e consulte equipamentos via QR Code pelo celular
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

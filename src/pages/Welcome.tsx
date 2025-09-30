import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import maltaLogo from "@/assets/malta-logo.png";

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
      
      // Redirecionar automaticamente após 3 segundos
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 3000);

      return () => clearTimeout(timer);
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
            className="w-40 h-40 md:w-56 md:h-56 object-contain"
          />
        </div>
        
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            Bem-vindo à Malta Locações, {userName}!
          </h1>
          
          <div className="flex flex-col items-center gap-4 mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary"></div>
            <p className="text-muted-foreground text-lg">
              Preparando o sistema...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;

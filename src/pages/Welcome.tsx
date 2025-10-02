import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { SparklesCore } from "@/components/ui/sparkles";

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
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950">
      {/* Sparkles Background */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="tsparticleswelcome"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full"
          particleColor="#FFFFFF"
          speed={1}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col items-center justify-center gap-12 px-4 text-center">
        <div className="flex justify-center animate-fade-in">
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações Logo" 
            className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 object-contain drop-shadow-2xl"
            fetchPriority="high"
          />
        </div>
        
        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white drop-shadow-lg mx-auto">
            Bem-vindo, {userName}!
          </h1>
          
          <p className="text-white text-lg md:text-xl max-w-3xl mx-auto">
            Sistema de Controle de Estoque Malta Locações
          </p>
        </div>
      </div>

      {/* Radial Gradient to prevent sharp edges */}
      <div className="absolute inset-0 w-full h-full bg-slate-950 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] pointer-events-none"></div>
    </div>
  );
};

export default Welcome;

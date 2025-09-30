import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
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
      // Get user name from metadata or email
      const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Usuário";
      setUserName(name);

      // Redirect to dashboard after 3 seconds
      const timer = setTimeout(() => {
        navigate("/");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-malta-primary/10 via-background to-malta-primary/5">
      <div className="text-center space-y-8 p-8">
        <div className="flex justify-center">
          <img 
            src={maltaLogo} 
            alt="Malta Locações Logo" 
            className="w-48 h-48 object-contain animate-fade-in"
          />
        </div>
        
        <div className="space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold text-foreground">
            Bem-vindo à Malta Locações, {userName}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Preparando seu sistema...
          </p>
        </div>

        <div className="flex justify-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-malta-primary" />
        </div>
      </div>
    </div>
  );
};

export default Welcome;

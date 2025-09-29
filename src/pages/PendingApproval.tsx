import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const PendingApproval = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  useEffect(() => {
    // Check if user became active
    const checkStatus = setInterval(async () => {
      if (!user) return;

      const { data } = await supabase
        .from("user_permissions")
        .select("is_active")
        .eq("user_id", user.id)
        .single();

      if (data?.is_active) {
        navigate("/");
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(checkStatus);
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-warning/10 rounded-full p-4 w-fit">
            <Clock className="h-12 w-12 text-warning" />
          </div>
          <CardTitle className="text-2xl">Aguardando Aprovação</CardTitle>
          <CardDescription className="text-base">
            Seu cadastro foi realizado com sucesso, mas precisa ser aprovado por um administrador antes de você poder acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">O que acontece agora?</p>
                <p className="text-sm text-muted-foreground">
                  Um administrador do sistema irá revisar seu cadastro e liberar seu acesso em breve.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Sua conta:</span> {user?.email}
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={signOut}
          >
            Fazer Logout
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Esta página será atualizada automaticamente quando seu acesso for aprovado.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;

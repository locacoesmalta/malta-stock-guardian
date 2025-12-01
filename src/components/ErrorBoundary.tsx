import { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorCode: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorCode: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary capturou erro:", error, errorInfo);

    // Gerar código de erro único para runtime errors
    const errorCode = `ERR-RUNTIME-${Date.now().toString().slice(-3)}`;
    
    this.setState({ errorCode });

    try {
      const currentRoute = window.location.pathname;
      const timestamp = new Date().toISOString();
      
      // Buscar usuário atual se existir
      const { data: { user } } = await supabase.auth.getUser();
      let userName = null;
      let userEmail = null;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();
        
        userName = profile?.full_name || null;
        userEmail = profile?.email || null;
      }

      // Registrar erro no banco
      await supabase.from("error_logs").insert({
        error_code: errorCode,
        user_id: user?.id || null,
        user_email: userEmail,
        user_name: userName,
        page_route: currentRoute,
        error_type: "RUNTIME_ERROR",
        error_message: error.message,
        error_stack: error.stack,
        additional_data: {
          componentStack: errorInfo.componentStack,
          browser: navigator.userAgent,
        },
        timestamp,
        webhook_sent: false,
      });

      // Enviar para webhook via edge function segura
      const { sendErrorWebhook } = await import("@/lib/webhookClient");
      await sendErrorWebhook({
        error_code: errorCode,
        user_name: userName || "Unknown",
        user_email: userEmail || "unknown@unknown.com",
        page_route: currentRoute,
        error_type: "RUNTIME_ERROR",
        error_message: error.message,
        error_stack: errorInfo.componentStack,
        timestamp,
        additional_data: {
          browser: navigator.userAgent,
        },
      });
    } catch (logError) {
      console.error("Erro ao registrar erro na central:", logError);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorCode: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <CardTitle>Algo deu errado</CardTitle>
              </div>
              <CardDescription>
                Ocorreu um erro inesperado na aplicação. Nossa equipe foi notificada automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.errorCode && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium">Código do erro:</p>
                  <p className="text-sm font-mono text-muted-foreground">
                    {this.state.errorCode}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="flex-1">
                  Voltar para o início
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Recarregar página
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

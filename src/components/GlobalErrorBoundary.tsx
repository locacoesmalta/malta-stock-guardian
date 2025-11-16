import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    
    this.setState({ errorInfo });

    // ✅ CORRIGIDO: Usar logger existente ao invés de chamar Edge Function inexistente
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      await supabase.from('error_logs').insert({
        error_code: "REACT_ERROR_BOUNDARY",
        error_type: "runtime_error",
        error_message: error.message,
        error_stack: error.stack,
        page_route: window.location.pathname,
        additional_data: {
          componentStack: errorInfo.componentStack,
        },
      });
    } catch (err) {
      console.error("Failed to log error:", err);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <CardTitle>Algo deu errado</CardTitle>
                  <CardDescription>
                    Ocorreu um erro inesperado na aplicação
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-mono text-sm text-muted-foreground">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Recarregar Página
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Voltar
                </Button>
              </div>

              {import.meta.env.DEV && this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Detalhes técnicos (modo desenvolvimento)
                  </summary>
                  <pre className="mt-2 bg-muted p-4 rounded-lg overflow-auto text-xs">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface RealtimeDuplicateAlertProps {
  duplicates?: string[];
  suggestion?: string;
  needsNormalization?: boolean;
  onApply: (value: string) => void;
  loading?: boolean;
}

/**
 * Componente de alerta inline para duplicatas detectadas em tempo real
 * Exibe sugestões e permite correção automática
 */
export const RealtimeDuplicateAlert = ({
  duplicates = [],
  suggestion,
  needsNormalization = false,
  onApply,
  loading = false
}: RealtimeDuplicateAlertProps) => {
  // Não renderizar nada se não houver alertas
  if (!needsNormalization && duplicates.length === 0 && !loading) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div className="mt-2 text-xs text-muted-foreground animate-pulse">
        Verificando duplicatas...
      </div>
    );
  }

  // Normalização necessária
  if (needsNormalization && suggestion) {
    return (
      <Alert variant="default" className="mt-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CheckCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              ⚡ Texto será normalizado automaticamente
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Sugestão: <code className="font-mono bg-blue-100 dark:bg-blue-900 px-1 rounded">{suggestion}</code>
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onApply(suggestion)}
            className="shrink-0 border-blue-600 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900"
          >
            Aplicar Agora
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Duplicatas encontradas
  if (duplicates.length > 0) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="text-sm font-medium">
            ⚠️ Duplicata detectada!
          </p>
          <p className="text-xs">
            Este valor já existe com escrita diferente:
          </p>
          <div className="flex flex-col gap-1 mt-2">
            {duplicates.slice(0, 3).map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded">
                <code className="text-xs font-mono">{dup}</code>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onApply(dup)}
                >
                  Usar este
                </Button>
              </div>
            ))}
          </div>
          {duplicates.length > 3 && (
            <p className="text-xs text-muted-foreground mt-1">
              ... e mais {duplicates.length - 3} variações
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            💡 Recomendamos usar sempre a mesma escrita para facilitar buscas e relatórios.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};

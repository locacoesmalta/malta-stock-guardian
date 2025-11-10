import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface RealtimeDuplicateAlertProps {
  duplicates?: string[];
  suggestion?: string | null;
  needsNormalization?: boolean;
  onApply?: (value: string) => void;
  fieldName?: string;
}

export const RealtimeDuplicateAlert = ({
  duplicates = [],
  suggestion,
  needsNormalization,
  onApply,
  fieldName = "campo"
}: RealtimeDuplicateAlertProps) => {
  // Se precisa normalização, mostrar sugestão
  if (needsNormalization && suggestion && onApply) {
    return (
      <Alert variant="default" className="mt-2 border-warning bg-warning/10">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertDescription className="flex items-center justify-between gap-2">
          <span className="text-sm">
            <strong>💡 Sugestão:</strong> "{suggestion}"
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onApply(suggestion)}
            className="shrink-0"
          >
            Corrigir
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Se tem duplicatas, mostrar lista
  if (duplicates.length > 0 && onApply) {
    return (
      <Alert variant="destructive" className="mt-2">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex flex-col gap-2">
          <p className="text-sm">
            <strong>⚠️ Duplicata detectada!</strong> Este {fieldName} já existe com escrita diferente:
          </p>
          <div className="flex flex-col gap-1">
            {duplicates.slice(0, 3).map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded">
                <code className="text-xs">{dup}</code>
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
          <p className="text-xs text-muted-foreground mt-1">
            Recomendamos usar sempre a mesma escrita para facilitar buscas e relatórios.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Tudo OK
  if (!needsNormalization && duplicates.length === 0) {
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-success">
        <CheckCircle className="h-3 w-3" />
        <span>Texto normalizado corretamente</span>
      </div>
    );
  }

  return null;
};

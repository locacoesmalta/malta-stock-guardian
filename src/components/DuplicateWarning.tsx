import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DuplicateWarningProps {
  duplicates: string[];
  onCorrect: (correctValue: string) => void;
  fieldName: string;
}

export const DuplicateWarning = ({
  duplicates,
  onCorrect,
  fieldName
}: DuplicateWarningProps) => {
  if (duplicates.length === 0) return null;

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-2">
        <p className="text-sm">
          <strong>⚠️ Duplicata detectada!</strong> Este {fieldName} já existe com escrita diferente:
        </p>
        <div className="flex flex-col gap-1">
          {duplicates.map((dup, idx) => (
            <div key={idx} className="flex items-center justify-between bg-background/50 p-2 rounded">
              <code className="text-xs">{dup}</code>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onCorrect(dup)}
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
};

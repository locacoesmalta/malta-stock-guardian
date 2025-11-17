import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { InlineValidation } from "@/components/ui/inline-validation";
import { useRealtimeValidation } from "@/hooks/useRealtimeValidation";
import { validatePATFormat, validateDuplicate } from "@/hooks/useDuplicateValidation";
import { formatPAT } from "@/lib/patUtils";
import { cn } from "@/lib/utils";

interface PATInputWithValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label?: string;
  disabled?: boolean;
  className?: string;
  excludeId?: string;
  checkDuplicates?: boolean;
}

/**
 * Input especializado para PAT com validação em tempo real
 * IMPORTANTE: Mantém a lógica de formatação original (6 dígitos com zeros à esquerda)
 */
export function PATInputWithValidation<T extends FieldValues>({
  form,
  name,
  label = "PAT",
  disabled = false,
  className,
  excludeId,
  checkDuplicates = true,
}: PATInputWithValidationProps<T>) {
  const fieldValue = form.watch(name) as string;

  // Validação de formato
  const formatValidation = useRealtimeValidation({
    value: fieldValue || "",
    validationFn: async (value) => validatePATFormat(value),
    enabled: true,
    minLength: 1,
  });

  // Validação de duplicatas
  const duplicateValidation = useRealtimeValidation({
    value: fieldValue || "",
    validationFn: async (value) => {
      if (!checkDuplicates) return { isValid: true, status: "valid" as const };
      
      // Formatar antes de validar duplicata
      const formatted = formatPAT(value);
      return validateDuplicate(formatted, "assets", "asset_code", excludeId);
    },
    enabled: checkDuplicates && formatValidation.isValid,
    minLength: 1,
    debounceMs: 700,
  });

  // Status combinado
  let combinedStatus = formatValidation.status;
  let combinedMessage = formatValidation.message;

  if (formatValidation.isValid && checkDuplicates) {
    combinedStatus = duplicateValidation.status;
    combinedMessage = duplicateValidation.message;
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2 animate-fade-in", className)}>
          <div className="flex items-center gap-2">
            <FormLabel>{label}</FormLabel>
            <ContextualTooltip
              content={
                <div className="space-y-2">
                  <p className="font-semibold">Formato do PAT:</p>
                  <ul className="text-xs space-y-1">
                    <li>✓ Sempre 6 dígitos</li>
                    <li>✓ Zeros à esquerda automáticos</li>
                    <li>✓ Apenas números</li>
                    <li className="text-muted-foreground">Ex: Digite "123" → Vira "000123"</li>
                  </ul>
                </div>
              }
            />
          </div>

          <FormControl>
            <Input
              type="text"
              placeholder="Ex: 123 ou 001234"
              disabled={disabled}
              maxLength={6}
              {...field}
              onChange={(e) => {
                // Permitir apenas números
                const value = e.target.value.replace(/\D/g, "");
                field.onChange(value);
              }}
              onBlur={(e) => {
                // Formatar ao sair do campo
                const formatted = formatPAT(e.target.value);
                field.onChange(formatted);
                field.onBlur();
              }}
              className={cn(
                "transition-all duration-200 font-mono",
                formatValidation.isInvalid && "border-destructive",
                formatValidation.isValid && checkDuplicates && duplicateValidation.isInvalid && "border-destructive",
                formatValidation.isValid && checkDuplicates && duplicateValidation.isValid && "border-green-600"
              )}
            />
          </FormControl>

          <InlineValidation
            status={combinedStatus}
            message={combinedMessage}
          />

          <FormMessage className="animate-fade-in" />
        </FormItem>
      )}
    />
  );
}

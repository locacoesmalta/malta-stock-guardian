import { ReactNode } from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ContextualTooltip } from "@/components/ui/contextual-tooltip";
import { InlineValidation } from "@/components/ui/inline-validation";
import { useRealtimeValidation } from "@/hooks/useRealtimeValidation";
import { cn } from "@/lib/utils";

interface FormFieldWithValidationProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  description?: string;
  tooltip?: ReactNode;
  placeholder?: string;
  type?: "text" | "number" | "email" | "tel" | "textarea";
  disabled?: boolean;
  className?: string;
  realtimeValidation?: {
    enabled: boolean;
    validationFn: (value: string) => Promise<{ isValid: boolean; message?: string; status: "valid" | "invalid" | "warning" }>;
    minLength?: number;
  };
  normalize?: (value: string) => string;
  maxLength?: number;
  rows?: number;
}

export function FormFieldWithValidation<T extends FieldValues>({
  form,
  name,
  label,
  description,
  tooltip,
  placeholder,
  type = "text",
  disabled = false,
  className,
  realtimeValidation,
  normalize,
  maxLength,
  rows = 3,
}: FormFieldWithValidationProps<T>) {
  const fieldValue = form.watch(name) as string;
  
  const validation = useRealtimeValidation({
    value: fieldValue || "",
    validationFn: realtimeValidation?.validationFn || (async () => ({ 
      isValid: true, 
      status: "valid" as const 
    })),
    enabled: realtimeValidation?.enabled || false,
    minLength: realtimeValidation?.minLength || 0,
  });

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("space-y-2 animate-fade-in", className)}>
          <div className="flex items-center gap-2">
            <FormLabel>{label}</FormLabel>
            {tooltip && <ContextualTooltip content={tooltip} />}
          </div>
          
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                rows={rows}
                {...field}
                onChange={(e) => {
                  const value = normalize ? normalize(e.target.value) : e.target.value;
                  field.onChange(value);
                }}
                className="resize-none transition-all duration-200"
              />
            ) : (
              <Input
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                maxLength={maxLength}
                {...field}
                onChange={(e) => {
                  const value = normalize ? normalize(e.target.value) : e.target.value;
                  field.onChange(value);
                }}
                className="transition-all duration-200"
              />
            )}
          </FormControl>

          {description && <FormDescription>{description}</FormDescription>}
          
          {realtimeValidation?.enabled && (
            <InlineValidation
              status={validation.status}
              message={validation.message}
            />
          )}
          
          <FormMessage className="animate-fade-in" />
        </FormItem>
      )}
    />
  );
}

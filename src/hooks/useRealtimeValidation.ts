import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "./use-debounce";

type ValidationStatus = "idle" | "validating" | "valid" | "invalid" | "warning";

interface ValidationResult {
  isValid: boolean;
  message?: string;
  status: ValidationStatus;
}

interface UseRealtimeValidationOptions {
  value: string;
  validationFn: (value: string) => Promise<ValidationResult> | ValidationResult;
  debounceMs?: number;
  enabled?: boolean;
  minLength?: number;
}

export function useRealtimeValidation({
  value,
  validationFn,
  debounceMs = 500,
  enabled = true,
  minLength = 0,
}: UseRealtimeValidationOptions) {
  const [status, setStatus] = useState<ValidationStatus>("idle");
  const [message, setMessage] = useState<string | undefined>();
  const debouncedValue = useDebounce(value, debounceMs);

  const validate = useCallback(async () => {
    if (!enabled || !debouncedValue || debouncedValue.length < minLength) {
      setStatus("idle");
      setMessage(undefined);
      return;
    }

    setStatus("validating");
    
    try {
      const result = await Promise.resolve(validationFn(debouncedValue));
      setStatus(result.status);
      setMessage(result.message);
    } catch (error) {
      console.error("Validation error:", error);
      setStatus("idle");
      setMessage(undefined);
    }
  }, [debouncedValue, validationFn, enabled, minLength]);

  useEffect(() => {
    validate();
  }, [validate]);

  return {
    status,
    message,
    isValid: status === "valid",
    isInvalid: status === "invalid",
    isValidating: status === "validating",
  };
}

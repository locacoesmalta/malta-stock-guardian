import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHourmeter, parseHourmeter, validateHourmeterFormat } from "@/lib/hourmeterUtils";
import { useState, useEffect } from "react";

interface HourmeterInputProps {
  label: string;
  value: number; // em segundos
  onChange: (seconds: number) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

export function HourmeterInput({
  label,
  value,
  onChange,
  error,
  disabled,
  placeholder = "000:00:00",
}: HourmeterInputProps) {
  const [displayValue, setDisplayValue] = useState(formatHourmeter(value));

  useEffect(() => {
    setDisplayValue(formatHourmeter(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/[^\d:]/g, "");
    
    // Auto-formatar conforme digita
    if (input.length <= 3) {
      input = input;
    } else if (input.length <= 5) {
      input = input.slice(0, 3) + ":" + input.slice(3);
    } else if (input.length <= 8) {
      input = input.slice(0, 3) + ":" + input.slice(3, 5) + ":" + input.slice(5);
    } else {
      input = input.slice(0, 8);
      input = input.slice(0, 3) + ":" + input.slice(3, 5) + ":" + input.slice(5);
    }

    setDisplayValue(input);

    // Validar e converter
    if (validateHourmeterFormat(input)) {
      const seconds = parseHourmeter(input);
      onChange(seconds);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input
        id={label}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={9}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Formato: HHH:MM:SS (ex: 001:30:00 = 1h30min)
      </p>
    </div>
  );
}

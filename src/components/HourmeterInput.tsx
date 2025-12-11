import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatHourmeter, parseHourmeter, normalizeHourmeterInput } from "@/lib/hourmeterUtils";
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
  const [localError, setLocalError] = useState<string>("");

  useEffect(() => {
    setDisplayValue(formatHourmeter(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setDisplayValue(input);
    setLocalError(""); // Limpa erro enquanto digita
  };

  const handleBlur = () => {
    // Quando usuário sai do campo, normaliza o input
    const normalized = normalizeHourmeterInput(displayValue);
    
    if (normalized) {
      setDisplayValue(normalized);
      const seconds = parseHourmeter(normalized);
      onChange(seconds);
      setLocalError("");
    } else if (displayValue.trim() !== "") {
      setLocalError("Formato inválido. Use HH:MM:SS (ex: 1:30:45)");
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <Input
        id={label}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={(error || localError) ? "border-destructive" : ""}
      />
      {(error || localError) && (
        <p className="text-sm text-destructive">{error || localError}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Formato: HHH:MM:SS (ex: 1109:33:30 para equipamentos com alta utilização)
      </p>
    </div>
  );
}

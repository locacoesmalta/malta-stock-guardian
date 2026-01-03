import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePATSearch } from "@/hooks/usePricingByPAT";
import { formatPAT } from "@/lib/patUtils";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssetForPricing {
  id: string;
  asset_code: string;
  equipment_name: string;
  manufacturer: string;
  model: string | null;
  serial_number: string | null;
  location_type: string;
  rental_company: string | null;
  rental_work_site: string | null;
  unit_value: number | null;
  purchase_date: string | null;
}

interface PATSearchInputProps {
  onAssetSelect: (asset: AssetForPricing | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  initialValue?: string;
}

export const PATSearchInput = ({ 
  onAssetSelect, 
  label = "PAT do Equipamento",
  placeholder = "Digite o PAT (ex: 1258)",
  className,
  disabled = false,
  initialValue = "",
}: PATSearchInputProps) => {
  const [patInput, setPATInput] = useState(initialValue);
  const [debouncedPat, setDebouncedPat] = useState(initialValue);
  
  const { data: asset, isLoading, isFetched } = usePATSearch(debouncedPat);

  // Debounce PAT input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPat(patInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [patInput]);

  // Notify parent when asset is found/not found
  useEffect(() => {
    if (isFetched) {
      onAssetSelect(asset || null);
    }
  }, [asset, isFetched, onAssetSelect]);

  const handlePATChange = (value: string) => {
    // Remove non-numeric characters and limit to 6 digits
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setPATInput(cleaned);
  };

  const handleBlur = () => {
    // Format with leading zeros on blur
    if (patInput && patInput.length > 0) {
      const formatted = formatPAT(patInput);
      if (formatted) {
        setPATInput(formatted);
      }
    }
  };

  const showNotFound = debouncedPat.length >= 4 && !asset && !isLoading && isFetched;
  const showFound = asset && !isLoading;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor="pat-search" className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      <div className="relative">
        <Input
          id="pat-search"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={patInput}
          onChange={(e) => handlePATChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          maxLength={6}
          disabled={disabled}
          className={cn(
            "pr-10",
            showFound && "border-green-500 focus-visible:ring-green-500",
            showNotFound && "border-destructive focus-visible:ring-destructive"
          )}
        />
        
        {/* Status indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {showFound && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {showNotFound && (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
      </div>

      {/* Feedback messages */}
      {isLoading && (
        <p className="text-xs text-muted-foreground">
          Buscando equipamento...
        </p>
      )}
      
      {showFound && (
        <div className="rounded-md bg-green-50 dark:bg-green-950/20 p-2 border border-green-200 dark:border-green-900">
          <p className="text-sm text-green-700 dark:text-green-400 font-medium">
            ✓ {asset.equipment_name}
          </p>
          <p className="text-xs text-green-600 dark:text-green-500">
            {asset.manufacturer} {asset.model && `• ${asset.model}`}
          </p>
        </div>
      )}
      
      {showNotFound && (
        <p className="text-xs text-destructive">
          Equipamento não encontrado com PAT {formatPAT(debouncedPat)}
        </p>
      )}
    </div>
  );
};

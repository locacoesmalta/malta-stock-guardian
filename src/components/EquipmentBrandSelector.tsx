import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeText } from "@/lib/textNormalization";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface EquipmentBrandSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const EquipmentBrandSelector = ({
  value,
  onChange,
}: EquipmentBrandSelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["equipment-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("manufacturer")
        .not("manufacturer", "is", null)
        .order("manufacturer");

      if (error) throw error;

      // Extrair valores únicos e normalizar
      const uniqueBrands = Array.from(
        new Set(data.map((item) => normalizeText(item.manufacturer)).filter(Boolean))
      ).sort();

      return uniqueBrands as string[];
    },
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Selecione a marca..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar marca..." />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhuma marca encontrada"}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {brands.map((brand) => (
              <CommandItem
                key={brand}
                value={brand}
                onSelect={() => {
                  const normalized = normalizeText(brand);
                  onChange(normalized === value ? "" : normalized);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === brand ? "opacity-100" : "opacity-0"
                  )}
                />
                {brand}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

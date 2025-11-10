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

interface EquipmentTypeSelectorProps {
  brand: string;
  value: string;
  onChange: (value: string) => void;
}

export const EquipmentTypeSelector = ({
  brand,
  value,
  onChange,
}: EquipmentTypeSelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["equipment-types", brand],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("equipment_name")
        .eq("manufacturer", brand)
        .not("equipment_name", "is", null)
        .order("equipment_name");

      if (error) throw error;

      // Extrair valores únicos e normalizar
      const uniqueTypes = Array.from(
        new Set(data.map((item) => normalizeText(item.equipment_name)).filter(Boolean))
      ).sort();

      return uniqueTypes as string[];
    },
    enabled: !!brand,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={!brand}
        >
          {value || "Selecione o tipo de equipamento..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar tipo..." />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum tipo encontrado"}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            {types.map((type) => (
              <CommandItem
                key={type}
                value={type}
                onSelect={() => {
                  const normalized = normalizeText(type);
                  onChange(normalized === value ? "" : normalized);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === type ? "opacity-100" : "opacity-0"
                  )}
                />
                {type}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

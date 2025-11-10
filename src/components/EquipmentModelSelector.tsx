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

interface EquipmentModelSelectorProps {
  brand: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

export const EquipmentModelSelector = ({
  brand,
  type,
  value,
  onChange,
}: EquipmentModelSelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["equipment-models", brand, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("model")
        .eq("manufacturer", brand)
        .eq("equipment_name", type)
        .not("model", "is", null)
        .order("model");

      if (error) throw error;

      // Extrair valores únicos e normalizar
      const uniqueModels = Array.from(
        new Set(data.map((item) => normalizeText(item.model)).filter(Boolean))
      ).sort();

      return uniqueModels as string[];
    },
    enabled: !!brand && !!type,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={!brand || !type}
        >
          {value || "Selecione o modelo (opcional)..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar modelo..." />
          <CommandEmpty>
            {isLoading ? "Carregando..." : "Nenhum modelo encontrado"}
          </CommandEmpty>
          <CommandGroup className="max-h-64 overflow-auto">
            <CommandItem
              value=""
              onSelect={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === "" ? "opacity-100" : "opacity-0"
                )}
              />
              <span className="text-muted-foreground">
                Qualquer modelo (deixar vazio)
              </span>
            </CommandItem>
            {models.map((model) => (
              <CommandItem
                key={model}
                value={model}
                onSelect={() => {
                  const normalized = normalizeText(model);
                  onChange(normalized === value ? "" : normalized);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === model ? "opacity-100" : "opacity-0"
                  )}
                />
                {model}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

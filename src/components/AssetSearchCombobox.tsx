import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Asset {
  id: string;
  asset_code: string;
  equipment_name: string;
  unit_value?: number | null;
  purchase_date?: string | null;
}

interface AssetSearchComboboxProps {
  assets: Asset[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export const AssetSearchCombobox = ({
  assets,
  value,
  onValueChange,
  placeholder = "Buscar por PAT ou nome do equipamento...",
  required = false,
}: AssetSearchComboboxProps) => {
  const [open, setOpen] = useState(false);

  const selectedAsset = assets.find((asset) => asset.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedAsset ? (
            <span className="truncate">
              {selectedAsset.asset_code} - {selectedAsset.equipment_name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 z-50 bg-popover" align="start">
        <Command>
          <CommandInput placeholder="Digite para buscar..." />
          <CommandList>
            <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
            <CommandGroup>
              {assets.map((asset) => (
                <CommandItem
                  key={asset.id}
                  value={`${asset.asset_code} ${asset.equipment_name}`.toLowerCase()}
                  onSelect={() => {
                    onValueChange(asset.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === asset.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 truncate">
                    <span className="font-medium">{asset.asset_code}</span> - {asset.equipment_name}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
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

interface Product {
  id: string;
  code: string;
  name: string;
  quantity?: number;
}

interface ProductSearchComboboxProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showStock?: boolean;
  required?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

export const ProductSearchCombobox = ({
  products,
  value,
  onValueChange,
  placeholder = "Buscar produto por código ou nome...",
  showStock = false,
  required = false,
  showClearButton = false,
  onClear,
}: ProductSearchComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const selectedProduct = products.find((product) => product.id === value);

  // Filtrar produtos - mostrar lista ao clicar ou quando digitar
  const filteredProducts = searchValue.length > 0
    ? products.filter(product => {
        const search = searchValue.toLowerCase();
        return (
          product.code.toLowerCase().includes(search) ||
          product.name.toLowerCase().includes(search)
        );
      })
    : products.slice(0, 50); // Mostrar primeiros 50 produtos quando clicar

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange("");
    if (onClear) onClear();
    setSearchValue("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedProduct ? (
            <span className="truncate flex-1 text-left">
              {selectedProduct.code} - {selectedProduct.name}
              {showStock && ` (Estoque: ${selectedProduct.quantity})`}
            </span>
          ) : (
            <span className="text-muted-foreground flex-1 text-left">{placeholder}</span>
          )}
          <div className="flex items-center gap-1 ml-2">
            {showClearButton && selectedProduct && (
              <X 
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 cursor-pointer" 
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 z-50 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite o código ou nome do produto..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredProducts.length === 0 ? (
              <CommandEmpty>
                {searchValue.length === 0 
                  ? "Clique para ver produtos ou digite para buscar..." 
                  : "Nenhum produto encontrado."}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => {
                      onValueChange(product.id);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === product.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 truncate">
                      <span className="font-medium">{product.code}</span> - {product.name}
                      {showStock && (
                        <span className="text-muted-foreground ml-2">
                          (Estoque: {product.quantity})
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

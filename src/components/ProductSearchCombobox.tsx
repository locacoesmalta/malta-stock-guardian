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
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity?: number;
  is_universal?: boolean;
  compatibility_level?: string;
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
  showCompatibility?: boolean;
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
  showCompatibility = false,
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
      <PopoverContent className="w-[500px] p-0 z-50 bg-popover" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Digite o código ou nome do produto..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className="max-h-[350px]">
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
                    <div className="flex-1 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{product.code}</div>
                        <div className="text-sm text-muted-foreground whitespace-normal break-words">
                          {product.name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        {showCompatibility && (
                          <>
                            {product.is_universal ? (
                              <Badge variant="secondary" className="text-xs">
                                Universal
                              </Badge>
                            ) : product.compatibility_level === 'exact_match' ? (
                              <Badge variant="default" className="text-xs bg-green-600">
                                ✓ Exata
                              </Badge>
                            ) : product.compatibility_level === 'type_match' ? (
                              <Badge variant="default" className="text-xs bg-blue-600">
                                ≈ Tipo
                              </Badge>
                            ) : product.compatibility_level === 'brand_match' ? (
                              <Badge variant="default" className="text-xs bg-amber-600">
                                ~ Marca
                              </Badge>
                            ) : null}
                          </>
                        )}
                        {showStock && (
                          <span className="text-muted-foreground text-sm">
                            Est: {product.quantity}
                          </span>
                        )}
                      </div>
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

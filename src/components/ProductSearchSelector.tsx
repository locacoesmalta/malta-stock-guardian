import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check } from "lucide-react";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

interface ProductSearchSelectorProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showStock?: boolean;
  required?: boolean;
}

export const ProductSearchSelector = React.memo(({
  products,
  value,
  onValueChange,
  placeholder = "Busque por nome do produto...",
  showStock = false,
  required = false,
}: ProductSearchSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find selected product when value changes
  useEffect(() => {
    const product = products.find(p => p.id === value);
    setSelectedProduct(product || null);
    
    // Only update searchTerm if it's different from current display value
    const displayValue = product ? `${product.code} - ${product.name}` : "";
    if (searchTerm !== displayValue) {
      setSearchTerm(displayValue);
    }
  }, [value, products]); // Removed searchTerm from dependencies to prevent loop

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts([]);
      return;
    }

    // Only filter if searchTerm is not a selected product display value
    const isSelectedProductDisplay = selectedProduct && 
      searchTerm === `${selectedProduct.code} - ${selectedProduct.name}`;
    
    if (isSelectedProductDisplay) {
      setFilteredProducts([]);
      return;
    }

    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered.slice(0, 10)); // Limit to 10 results
  }, [searchTerm, products, selectedProduct]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Clear selection if user is typing and it's different from selected product
    if (selectedProduct) {
      const selectedDisplay = `${selectedProduct.code} - ${selectedProduct.name}`;
      if (newValue !== selectedDisplay) {
        setSelectedProduct(null);
        onValueChange("");
      }
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm(`${product.code} - ${product.name}`);
    onValueChange(product.id);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // If there's a selected product, clear the search to allow new search
    if (selectedProduct) {
      setSearchTerm("");
    }
  };

  const clearSelection = () => {
    setSelectedProduct(null);
    setSearchTerm("");
    onValueChange("");
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          required={required}
          className="pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selectedProduct && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-6 w-6 p-0 hover:bg-destructive/10"
            >
              ×
            </Button>
          )}
          <Search className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {isOpen && filteredProducts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none border-b border-border last:border-b-0"
              onClick={() => handleProductSelect(product)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {product.code} - {product.name}
                  </div>
                  {showStock && (
                    <div className="text-xs text-muted-foreground">
                      Estoque: {product.quantity}
                    </div>
                  )}
                </div>
                {selectedProduct?.id === product.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && searchTerm.trim() && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            Nenhum produto encontrado para "{searchTerm}"
          </p>
        </div>
      )}
    </div>
  );
});

ProductSearchSelector.displayName = "ProductSearchSelector";
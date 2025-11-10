import { ProductSearchCombobox } from "./ProductSearchCombobox";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
  is_universal?: boolean;
  compatibility_level?: string;
}

interface ProductSelectorProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showStock?: boolean;
  required?: boolean;
  showCompatibility?: boolean;
}

export const ProductSelector = ({
  products,
  value,
  onValueChange,
  placeholder = "Selecione um produto",
  showStock = false,
  required = false,
  showCompatibility = false,
}: ProductSelectorProps) => {
  return (
    <ProductSearchCombobox
      products={products}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      showStock={showStock}
      required={required}
      showCompatibility={showCompatibility}
    />
  );
};

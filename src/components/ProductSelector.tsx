import { ProductSearchCombobox } from "./ProductSearchCombobox";

interface Product {
  id: string;
  code: string;
  name: string;
  quantity: number;
}

interface ProductSelectorProps {
  products: Product[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showStock?: boolean;
  required?: boolean;
}

export const ProductSelector = ({
  products,
  value,
  onValueChange,
  placeholder = "Selecione um produto",
  showStock = false,
  required = false,
}: ProductSelectorProps) => {
  return (
    <ProductSearchCombobox
      products={products}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      showStock={showStock}
      required={required}
    />
  );
};

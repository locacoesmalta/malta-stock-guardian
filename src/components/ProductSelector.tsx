import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <Select value={value} onValueChange={onValueChange} required={required}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {products.map((product) => (
          <SelectItem key={product.id} value={product.id}>
            {product.code} - {product.name}
            {showStock && ` (Estoque: ${product.quantity})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

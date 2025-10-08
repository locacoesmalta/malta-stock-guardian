import { useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, Download, Upload, Layers, AlertTriangle, History } from "lucide-react";
import { toast } from "sonner";
import { StockBadge } from "@/components/StockBadge";
import { useAuth } from "@/contexts/AuthContext";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useConfirm } from "@/hooks/useConfirm";
import { useProducts } from "@/hooks/useProducts";
import { productSchema, addStockSchema } from "@/lib/validations";
import { ProductPurchaseHistory } from "@/components/ProductPurchaseHistory";
import * as XLSX from "xlsx";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Product {
  id: string;
  code: string;
  name: string;
  manufacturer: string | null;
  quantity: number;
  min_quantity: number;
  purchase_price: number | null;
  sale_price: number | null;
  comments: string | null;
}

const Products = () => {
  const { user } = useAuth();
  const { products, loading, searchTerm, setSearchTerm, refetch } = useProducts();
  const { confirm, ConfirmDialog } = useConfirm();
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [groupByBrand, setGroupByBrand] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    newProducts: number;
    updatedStock: number;
    updatedPrice: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    manufacturer: "",
    quantity: 0,
    min_quantity: 0,
    purchase_price: "",
    sale_price: "",
    purchase_date: "",
    payment_type: "",
    comments: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    existingProduct: Product | null;
  }>({ open: false, existingProduct: null });
  const [addStockDialog, setAddStockDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const [addStockData, setAddStockData] = useState({
    purchase_date: "",
    quantity: 0,
    purchase_price: "",
    sale_price: "",
    payment_type: "",
    notes: "",
  });
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });

  // Extrair marcas únicas dos produtos
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((product) => {
      if (product.manufacturer) {
        brands.add(product.manufacturer);
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Filtrar produtos por marca
  const filteredProducts = useMemo(() => {
    if (brandFilter === "all") return products;
    if (brandFilter === "no-brand") return products.filter((p) => !p.manufacturer);
    return products.filter((p) => p.manufacturer === brandFilter);
  }, [products, brandFilter]);

  // Agrupar produtos por marca
  const groupedProducts = useMemo(() => {
    if (!groupByBrand) return null;
    
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((product) => {
      const brand = product.manufacturer || "Sem Marca";
      if (!groups[brand]) {
        groups[brand] = [];
      }
      groups[brand].push(product);
    });
    
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredProducts, groupByBrand]);

  // Verificar duplicidade quando o usuário sair do campo de código
  const handleCodeBlur = async () => {
    const code = formData.code.trim();
    
    // Não verificar se estiver vazio ou em modo de edição
    if (!code || editingProduct) return;
    
    try {
      // Normalizar o código para comparação
      const normalizedCode = code.replace(/[-\s]/g, '').toLowerCase();
      
      // Buscar todos os produtos
      const { data: allProducts, error } = await supabase
        .from("products")
        .select("*");

      if (error) throw error;

      // Verificar se existe um produto com código similar
      const existingProduct = allProducts?.find(p => {
        const dbNormalizedCode = p.code.replace(/[-\s]/g, '').toLowerCase();
        return dbNormalizedCode === normalizedCode;
      });

      if (existingProduct) {
        // Produto duplicado encontrado - mostrar dialog
        setDuplicateDialog({
          open: true,
          existingProduct: existingProduct as Product,
        });
      }
    } catch (error) {
      console.error("Erro ao verificar código:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent, forceDuplicate: boolean = false) => {
    e.preventDefault();
    setErrors({});

    const productData = {
      code: formData.code.trim(),
      name: formData.name,
      manufacturer: formData.manufacturer || null,
      quantity: Number(formData.quantity),
      min_quantity: Number(formData.min_quantity),
      purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
      sale_price: formData.sale_price ? Number(formData.sale_price) : null,
      purchase_date: formData.purchase_date || undefined,
      payment_type: formData.payment_type || undefined,
      comments: formData.comments || null,
    };

    // Para novos produtos, validar com schema completo
    if (!editingProduct) {
      const validation = productSchema.safeParse(productData);
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error("Por favor, corrija os erros no formulário");
        return;
      }
    }

    setSubmitting(true);

    try {
      const dataToSave = { ...productData, created_by: user?.id };
      
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(dataToSave)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        // Buscar profile do usuário para nome completo
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user?.id)
          .single();

        // Inserir novo produto
        const { data: newProduct, error: insertError } = await supabase
          .from("products")
          .insert([dataToSave])
          .select()
          .single();

        if (insertError) throw insertError;

        // Registrar primeira compra no histórico
        if (newProduct && formData.purchase_date && formData.payment_type) {
          await supabase.from("product_purchases").insert([{
            product_id: newProduct.id,
            purchase_date: formData.purchase_date,
            quantity: Number(formData.quantity),
            purchase_price: formData.purchase_price ? Number(formData.purchase_price) : null,
            sale_price: formData.sale_price ? Number(formData.sale_price) : null,
            payment_type: formData.payment_type,
            operator_id: user?.id,
            operator_name: profile?.full_name || user?.email,
          }]);
        }

        toast.success("Produto cadastrado com sucesso!");
      }

      setOpen(false);
      setEditingProduct(null);
      resetForm();
      refetch();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast.error(error.message || "Erro ao salvar produto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditExisting = () => {
    if (duplicateDialog.existingProduct) {
      setDuplicateDialog({ open: false, existingProduct: null });
      setOpen(false);
      openEditDialog(duplicateDialog.existingProduct);
    }
  };

  const handleForceDuplicate = async () => {
    setDuplicateDialog({ open: false, existingProduct: null });
    // Criar um evento sintético para chamar handleSubmit
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    await handleSubmit(syntheticEvent, true);
  };

  const handleAddStock = async () => {
    if (!addStockDialog.product) return;

    const validation = addStockSchema.safeParse({
      purchase_date: addStockData.purchase_date,
      quantity: Number(addStockData.quantity),
      purchase_price: addStockData.purchase_price ? Number(addStockData.purchase_price) : null,
      sale_price: addStockData.sale_price ? Number(addStockData.sale_price) : null,
      payment_type: addStockData.payment_type,
      notes: addStockData.notes || null,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Buscar profile do usuário
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user?.id)
        .single();

      // 1. Inserir compra no histórico
      const { error: purchaseError } = await supabase
        .from("product_purchases")
        .insert([{
          product_id: addStockDialog.product.id,
          purchase_date: addStockData.purchase_date,
          quantity: Number(addStockData.quantity),
          purchase_price: addStockData.purchase_price ? Number(addStockData.purchase_price) : null,
          sale_price: addStockData.sale_price ? Number(addStockData.sale_price) : null,
          payment_type: addStockData.payment_type,
          operator_id: user?.id,
          operator_name: profile?.full_name || user?.email,
          notes: addStockData.notes || null,
        }]);

      if (purchaseError) throw purchaseError;

      // 2. Atualizar quantidade no produto
      const newQuantity = addStockDialog.product.quantity + Number(addStockData.quantity);
      
      // 3. Decidir sobre preço (se fornecido)
      const updatedData: any = {
        quantity: newQuantity,
      };

      if (addStockData.purchase_price && addStockData.sale_price) {
        const useNewPrice = await confirm({
          title: "Atualizar Preços?",
          description: `Deseja usar os novos preços (Compra: R$ ${addStockData.purchase_price}, Venda: R$ ${addStockData.sale_price}) ou manter os preços atuais?`,
        });

        if (useNewPrice) {
          updatedData.purchase_price = Number(addStockData.purchase_price);
          updatedData.sale_price = Number(addStockData.sale_price);
        }
      }

      const { error: updateError } = await supabase
        .from("products")
        .update(updatedData)
        .eq("id", addStockDialog.product.id);

      if (updateError) throw updateError;

      toast.success(`Estoque adicionado! Nova quantidade: ${newQuantity}`);
      setAddStockDialog({ open: false, product: null });
      setAddStockData({
        purchase_date: "",
        quantity: 0,
        purchase_price: "",
        sale_price: "",
        payment_type: "",
        notes: "",
      });
      refetch();
    } catch (error) {
      toast.error("Erro ao adicionar estoque");
      console.error(error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Excluir Produto",
      description: `Tem certeza que deseja excluir o produto "${name}"? Esta ação não pode ser desfeita.`,
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Produto excluído com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao excluir produto");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      manufacturer: "",
      quantity: 0,
      min_quantity: 0,
      purchase_price: "",
      sale_price: "",
      purchase_date: "",
      payment_type: "",
      comments: "",
    });
    setErrors({});
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code,
      name: product.name,
      manufacturer: product.manufacturer || "",
      quantity: product.quantity,
      min_quantity: product.min_quantity,
      purchase_price: product.purchase_price?.toString() || "",
      sale_price: product.sale_price?.toString() || "",
      purchase_date: "",
      payment_type: "",
      comments: product.comments || "",
    });
    setOpen(true);
  };

  const downloadTemplate = () => {
    // Exportar template vazio para preenchimento
    const exportData = [{
      codigo: "",
      nome: "",
      fabricante: "",
      quantidade: "",
      quantidade_minima: "",
      preco_compra: "",
      preco_venda: "",
      data_compra: "", // Formato: DD/MM/AAAA
      tipo_pagamento: "", // Faturado, Caixa, Nivaldo ou Sabrina
      comentarios: ""
    }];

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Produtos");
    
    const colWidths = [
      { wch: 15 }, // codigo
      { wch: 30 }, // nome
      { wch: 25 }, // fabricante
      { wch: 12 }, // quantidade
      { wch: 18 }, // quantidade_minima
      { wch: 15 }, // preco_compra
      { wch: 15 }, // preco_venda
      { wch: 15 }, // data_compra
      { wch: 15 }, // tipo_pagamento
      { wch: 40 }, // comentarios
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, "template_produtos.xlsx");
    toast.success("Template exportado com sucesso!");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error("Arquivo Excel vazio");
        return;
      }

      let newProducts = 0;
      let updatedStock = 0;
      let updatedPrice = 0;

      for (const row of jsonData as any[]) {
        const productData = {
          code: row.codigo?.toString() || "",
          name: row.nome?.toString() || "",
          manufacturer: row.fabricante?.toString() || null,
          quantity: Number(row.quantidade) || 0,
          min_quantity: Number(row.quantidade_minima) || 0,
          purchase_price: row.preco_compra ? Number(row.preco_compra) : null,
          sale_price: row.preco_venda ? Number(row.preco_venda) : null,
          purchase_date: row.data_compra || null,
          payment_type: row.tipo_pagamento || null,
          comments: row.comentarios?.toString() || null,
          created_by: user?.id,
        };

        // Pular linhas vazias do template
        if (!productData.code || !productData.name) continue;

        // Verificar se o produto já existe pelo código
        const { data: existingProduct } = await supabase
          .from("products")
          .select("id, quantity, purchase_price, sale_price")
          .eq("code", productData.code)
          .maybeSingle();

        if (existingProduct) {
          let priceChanged = false;
          
          // Calcular média de preços se houver mudança
          const newPurchasePrice = productData.purchase_price && existingProduct.purchase_price
            ? (existingProduct.purchase_price + productData.purchase_price) / 2
            : productData.purchase_price || existingProduct.purchase_price;
          
          const newSalePrice = productData.sale_price && existingProduct.sale_price
            ? (existingProduct.sale_price + productData.sale_price) / 2
            : productData.sale_price || existingProduct.sale_price;

          // Verificar se houve mudança de preço
          if (
            (newPurchasePrice && newPurchasePrice !== existingProduct.purchase_price) ||
            (newSalePrice && newSalePrice !== existingProduct.sale_price)
          ) {
            priceChanged = true;
          }

          // Atualizar somando a quantidade e calculando média dos preços
          await supabase
            .from("products")
            .update({
              quantity: existingProduct.quantity + productData.quantity,
              name: productData.name,
              manufacturer: productData.manufacturer,
              min_quantity: productData.min_quantity,
              purchase_price: newPurchasePrice,
              sale_price: newSalePrice,
              comments: productData.comments,
            })
            .eq("id", existingProduct.id);
          
          if (productData.quantity > 0) updatedStock++;
          if (priceChanged) updatedPrice++;
        } else {
          // Inserir novo produto
          await supabase.from("products").insert([productData]);
          newProducts++;
        }
      }

      setImportSummary({
        newProducts,
        updatedStock,
        updatedPrice,
      });
      
      refetch();
    } catch (error: any) {
      toast.error("Erro ao processar arquivo Excel");
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestão de Produtos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Cadastre e gerencie os produtos do estoque</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={downloadTemplate} className="flex-1 sm:flex-none text-xs sm:text-sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Estoque
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex-1 sm:flex-none text-xs sm:text-sm">
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Processando..." : "Importar Excel"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Dialog open={open} onOpenChange={(value) => {
            setOpen(value);
            if (!value) {
              setEditingProduct(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none text-xs sm:text-sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Campos do formulário de produto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Produto *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    onBlur={handleCodeBlur}
                    required
                  />
                  {errors.code && (
                    <p className="text-sm text-destructive">{errors.code}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Fabricante</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                  placeholder="Nome do fabricante ou marca"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantidade em Estoque *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_quantity">Quantidade Mínima *</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    min="0"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Preço de Compra (R$)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sale_price">Preço de Venda (R$)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
                  />
                </div>
              </div>

              {!editingProduct && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purchase_date">Data da Compra *</Label>
                      <Input
                        id="purchase_date"
                        type="date"
                        value={formData.purchase_date}
                        onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="payment_type">Tipo de Pagamento *</Label>
                      <Select
                        value={formData.payment_type}
                        onValueChange={(value) => setFormData({ ...formData, payment_type: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Faturado">Faturado</SelectItem>
                          <SelectItem value="Caixa">Caixa</SelectItem>
                          <SelectItem value="Nivaldo">Nivaldo</SelectItem>
                          <SelectItem value="Sabrina">Sabrina</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="comments">Comentários / Especificações</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Adicione observações específicas sobre este produto..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    setEditingProduct(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Salvando..." : editingProduct ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Marcas</SelectItem>
                <SelectItem value="no-brand">Sem Marca</SelectItem>
                {availableBrands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={groupByBrand ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByBrand(!groupByBrand)}
            >
              <Layers className="h-4 w-4 mr-2" />
              {groupByBrand ? "Desagrupar" : "Agrupar por Marca"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando produtos...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum produto encontrado
            </div>
          ) : groupByBrand && groupedProducts ? (
            <div className="space-y-6">
              {groupedProducts.map(([brand, brandProducts]) => (
                <div key={brand} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <h3 className="font-semibold text-lg">{brand}</h3>
                    <span className="text-sm text-muted-foreground">
                      ({brandProducts.length} produtos)
                    </span>
                  </div>
                  <div className="space-y-2">
                    {brandProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Código: {product.code}
                          </div>
                          {(product.purchase_price || product.sale_price) && (
                            <div className="text-sm space-x-4">
                              {product.purchase_price && (
                                <span className="text-muted-foreground">
                                  Compra: R$ {product.purchase_price.toFixed(2)}
                                </span>
                              )}
                              {product.sale_price && (
                                <span className="text-muted-foreground">
                                  Venda: R$ {product.sale_price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                          {product.comments && (
                            <div className="text-sm text-muted-foreground italic">
                              {product.comments}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">{product.quantity}</div>
                            <div className="text-xs text-muted-foreground">
                              Mín: {product.min_quantity}
                            </div>
                          </div>
                    <StockBadge
                      quantity={product.quantity}
                      minQuantity={product.min_quantity}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setAddStockDialog({ open: true, product })}
                        title="Adicionar Estoque"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setHistoryDialog({ open: true, product })}
                        title="Ver Histórico"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Código: {product.code}
                    </div>
                    {product.manufacturer && (
                      <div className="text-sm text-muted-foreground">
                        Fabricante: {product.manufacturer}
                      </div>
                    )}
                    {(product.purchase_price || product.sale_price) && (
                      <div className="text-sm space-x-4">
                        {product.purchase_price && (
                          <span className="text-muted-foreground">
                            Compra: R$ {product.purchase_price.toFixed(2)}
                          </span>
                        )}
                        {product.sale_price && (
                          <span className="text-muted-foreground">
                            Venda: R$ {product.sale_price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                    {product.comments && (
                      <div className="text-sm text-muted-foreground italic">
                        {product.comments}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{product.quantity}</div>
                      <div className="text-xs text-muted-foreground">
                        Mín: {product.min_quantity}
                      </div>
                    </div>
                    <StockBadge
                      quantity={product.quantity}
                      minQuantity={product.min_quantity}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id, product.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog />

      <Dialog open={!!importSummary} onOpenChange={() => setImportSummary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Produtos Importados</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-medium">
                Novos produtos: <span className="text-primary">{importSummary?.newProducts || 0}</span>
              </p>
              {importSummary && importSummary.updatedStock > 0 && (
                <p className="font-medium">
                  Produtos com estoque atualizado: <span className="text-primary">{importSummary.updatedStock}</span>
                </p>
              )}
              {importSummary && importSummary.updatedPrice > 0 && (
                <p className="font-medium">
                  Produtos com preço atualizado: <span className="text-primary">{importSummary.updatedPrice}</span>
                </p>
              )}
            </div>
            <Button onClick={() => setImportSummary(null)} className="w-full">
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Produto Duplicado */}
      <Dialog open={duplicateDialog.open} onOpenChange={(open) => {
        if (!open) {
          setDuplicateDialog({ open: false, existingProduct: null });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>Produto Já Cadastrado</DialogTitle>
            </div>
            <DialogDescription>
              Já existe um produto cadastrado com o código <strong>{formData.code}</strong>
            </DialogDescription>
          </DialogHeader>
          
          {duplicateDialog.existingProduct && (
            <Alert>
              <AlertDescription className="space-y-2">
                <div><strong>Nome:</strong> {duplicateDialog.existingProduct.name}</div>
                <div><strong>Fabricante:</strong> {duplicateDialog.existingProduct.manufacturer || "Não informado"}</div>
                <div><strong>Quantidade:</strong> {duplicateDialog.existingProduct.quantity}</div>
                {duplicateDialog.existingProduct.purchase_price && (
                  <div><strong>Preço:</strong> R$ {duplicateDialog.existingProduct.purchase_price.toFixed(2)}</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogDescription className="text-sm">
            O que você deseja fazer?
          </DialogDescription>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDuplicateDialog({ open: false, existingProduct: null })}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              onClick={handleEditExisting}
              className="w-full sm:w-auto"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Editar Produto Existente
            </Button>
            <Button
              variant="default"
              onClick={handleForceDuplicate}
              className="w-full sm:w-auto"
            >
              Cadastrar Mesmo Assim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Adicionar Estoque */}
      <Dialog open={addStockDialog.open} onOpenChange={(open) => {
        if (!open) {
          setAddStockDialog({ open: false, product: null });
          setAddStockData({ purchase_date: "", quantity: 0, purchase_price: "", sale_price: "", payment_type: "", notes: "" });
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Estoque - {addStockDialog.product?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add_purchase_date">Data da Compra *</Label>
              <Input
                id="add_purchase_date"
                type="date"
                value={addStockData.purchase_date}
                onChange={(e) => setAddStockData({ ...addStockData, purchase_date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_quantity">Quantidade *</Label>
              <Input
                id="add_quantity"
                type="number"
                min="1"
                value={addStockData.quantity}
                onChange={(e) => setAddStockData({ ...addStockData, quantity: Number(e.target.value) })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add_purchase_price">Preço Compra (R$)</Label>
                <Input
                  id="add_purchase_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addStockData.purchase_price}
                  onChange={(e) => setAddStockData({ ...addStockData, purchase_price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add_sale_price">Preço Venda (R$)</Label>
                <Input
                  id="add_sale_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={addStockData.sale_price}
                  onChange={(e) => setAddStockData({ ...addStockData, sale_price: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_payment_type">Tipo de Pagamento *</Label>
              <Select
                value={addStockData.payment_type}
                onValueChange={(value) => setAddStockData({ ...addStockData, payment_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Faturado">Faturado</SelectItem>
                  <SelectItem value="Caixa">Caixa</SelectItem>
                  <SelectItem value="Nivaldo">Nivaldo</SelectItem>
                  <SelectItem value="Sabrina">Sabrina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add_notes">Observações</Label>
              <Textarea
                id="add_notes"
                value={addStockData.notes}
                onChange={(e) => setAddStockData({ ...addStockData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStockDialog({ open: false, product: null })}>
              Cancelar
            </Button>
            <Button onClick={handleAddStock}>Adicionar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Histórico */}
      {historyDialog.product && (
        <ProductPurchaseHistory
          open={historyDialog.open}
          onOpenChange={(open) => setHistoryDialog({ open, product: open ? historyDialog.product : null })}
          productId={historyDialog.product.id}
          productName={historyDialog.product.name}
        />
      )}
    </div>
  );
};

export default Products;

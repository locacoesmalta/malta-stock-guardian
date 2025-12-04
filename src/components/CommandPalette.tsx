import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Package,
  Wrench,
  FileText,
  Receipt,
  Users,
  Settings,
  Search,
  Home,
  BarChart3,
  BoxIcon,
  History as HistoryIcon,
} from "lucide-react";
import { useProductsQuery } from "@/hooks/useProductsQuery";
import { useAssetsQuery } from "@/hooks/useAssetsQuery";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  group: string;
}

export const CommandPalette = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  
  // Lazy load: queries só executam quando o dialog abre
  const { data: products } = useProductsQuery(open);
  const { data: assets } = useAssetsQuery(open);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigationItems: CommandItem[] = [
    {
      id: "home",
      title: "Dashboard",
      description: "Ir para página inicial",
      icon: Home,
      onSelect: () => navigate("/"),
      group: "Navegação",
    },
    {
      id: "products",
      title: "Produtos",
      description: "Gerenciar produtos e estoque",
      icon: Package,
      onSelect: () => navigate("/admin/products"),
      group: "Navegação",
    },
    {
      id: "assets",
      title: "Ativos",
      description: "Gerenciar equipamentos",
      icon: Wrench,
      onSelect: () => navigate("/assets"),
      group: "Navegação",
    },
    {
      id: "unified-history",
      title: "Histórico Unificado",
      description: "Timeline completa de eventos por equipamento",
      icon: HistoryIcon,
      onSelect: () => navigate("/assets/unified-history"),
      group: "Navegação",
    },
    {
      id: "reports",
      title: "Relatórios",
      description: "Ver relatórios de serviço",
      icon: FileText,
      onSelect: () => navigate("/reports"),
      group: "Navegação",
    },
    {
      id: "receipts",
      title: "Recibos",
      description: "Gerenciar recibos de equipamentos",
      icon: Receipt,
      onSelect: () => navigate("/receipts"),
      group: "Navegação",
    },
    {
      id: "users",
      title: "Usuários",
      description: "Gerenciar usuários e permissões",
      icon: Users,
      onSelect: () => navigate("/admin/users"),
      group: "Navegação",
    },
    {
      id: "settings",
      title: "Configurações",
      description: "Configurações do sistema",
      icon: Settings,
      onSelect: () => navigate("/admin/settings"),
      group: "Navegação",
    },
  ];

  const quickActions: CommandItem[] = [
    {
      id: "new-product",
      title: "Novo Produto",
      description: "Cadastrar novo produto",
      icon: Package,
      onSelect: () => navigate("/admin/products"),
      group: "Ações Rápidas",
    },
    {
      id: "new-asset",
      title: "Novo Ativo",
      description: "Cadastrar novo equipamento",
      icon: BoxIcon,
      onSelect: () => navigate("/assets/register"),
      group: "Ações Rápidas",
    },
    {
      id: "new-report",
      title: "Novo Relatório",
      description: "Criar novo relatório de serviço",
      icon: FileText,
      onSelect: () => navigate("/reports/new"),
      group: "Ações Rápidas",
    },
    {
      id: "view-analytics",
      title: "Ver Análises",
      description: "Dashboard de análises",
      icon: BarChart3,
      onSelect: () => navigate("/admin/financial-forecast"),
      group: "Ações Rápidas",
    },
  ];

  // Produtos recentes (busca dinâmica)
  const productItems: CommandItem[] = (products?.slice(0, 5) || []).map((product) => ({
    id: `product-${product.id}`,
    title: product.name,
    description: `Código: ${product.code} | Estoque: ${product.quantity}`,
    icon: Package,
    onSelect: () => navigate("/admin/products"),
    group: "Produtos",
  }));

  // Ativos recentes (busca dinâmica)
  const assetItems: CommandItem[] = (assets?.slice(0, 5) || []).map((asset) => ({
    id: `asset-${asset.id}`,
    title: asset.equipment_name,
    description: `PAT: ${asset.asset_code}`,
    icon: Wrench,
    onSelect: () => navigate(`/assets/view/${asset.id}`),
    group: "Equipamentos",
  }));

  const allItems = [...navigationItems, ...quickActions, ...productItems, ...assetItems];
  const groupedItems = allItems.reduce((acc, item) => {
    if (!acc[item.group]) {
      acc[item.group] = [];
    }
    acc[item.group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Digite para buscar ou Ctrl+K para abrir..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        
        {Object.entries(groupedItems).map(([group, items], index) => (
          <div key={group}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

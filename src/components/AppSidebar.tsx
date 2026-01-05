import { 
  Package, 
  PackageMinus, 
  LayoutDashboard,
  HardDrive, 
  Building2, 
  Wrench, 
  ClipboardList,
  Zap,
  FileText, 
  ClipboardCheck,
  CircleDollarSign,
  Calculator, 
  TrendingUp,
  Percent,
  Wallet,
  ShoppingCart,
  Users, 
  ScrollText,
  Activity,
  AlertTriangle, 
  ShieldCheck,
  RefreshCcw,
  Settings, 
  LogOut, 
  History, 
  MessageSquare,
  type LucideIcon 
} from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function AppSidebar() {
  const { isAdmin, isSuperuser, isStaff, isSystemOwner, signOut, user, permissions } = useAuth();
  const { open, isMobile, setOpenMobile } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (!permissions) {
    return null;
  }

  // 📦 ESTOQUE
  const stockMenuItems = [
    {
      path: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      show: permissions.can_view_products || isAdmin,
    },
    {
      path: "/admin/products",
      icon: Package,
      label: "Produtos",
      show: permissions.can_edit_products || isAdmin,
    },
    {
      path: "/inventory/withdrawal",
      icon: PackageMinus,
      label: "Retirada",
      show: permissions.can_create_withdrawals || isAdmin,
    },
    {
      path: "/inventory/history",
      icon: History,
      label: "Histórico",
      show: permissions.can_view_withdrawal_history || isAdmin,
    },
  ];

  // 🖥️ PATRIMÔNIO
  const assetsMenuItems = [
    {
      path: "/assets/control",
      icon: LayoutDashboard,
      label: "Painel",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/assets",
      icon: HardDrive,
      label: "Equipamentos",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/rental-companies",
      icon: Building2,
      label: "Empresas",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/maintenance/plan",
      icon: Wrench,
      label: "Manutenção",
      show: permissions.can_edit_assets || isAdmin,
    },
    {
      path: "/maintenance/plans",
      icon: ClipboardList,
      label: "Histórico",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/assets/unified-history",
      icon: History,
      label: "Histórico Unificado",
      show: isStaff,
    },
  ];

  // 📄 DOCUMENTOS
  const docsMenuItems = [
    {
      path: "/reports/quick",
      icon: Zap,
      label: "Relatório Rápido",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/reports/new",
      icon: FileText,
      label: "Relatório Completo",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/reports",
      icon: History,
      label: "Histórico",
      show: permissions.can_view_reports || isAdmin,
    },
    {
      path: "/reports/status",
      icon: ClipboardList,
      label: "Status",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/reports/malta-productivity",
      icon: TrendingUp,
      label: "Produtividade",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/receipts/movement-report",
      icon: ClipboardCheck,
      label: "Movimentação",
      show: permissions.can_view_reports || isAdmin,
    },
    {
      path: "/receipts/delivery/new",
      icon: ClipboardCheck,
      label: "Nova Entrega",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/receipts/return/new",
      icon: ClipboardCheck,
      label: "Nova Devolução",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/receipts/history",
      icon: History,
      label: "Comprovantes",
      show: permissions.can_view_reports || isAdmin,
    },
    {
      path: "/chat",
      icon: MessageSquare,
      label: "Chat",
      show: true,
    },
  ];

  // 💰 FINANCEIRO
  const financeMenuItems = [
    {
      path: "/pricing",
      icon: CircleDollarSign,
      label: "Precificação",
      show: isStaff,
    },
    {
      path: "/pricing/calculator",
      icon: Calculator,
      label: "Calculadora",
      show: isStaff,
    },
    {
      path: "/pricing/viability",
      icon: TrendingUp,
      label: "Viabilidade",
      show: isStaff,
    },
    {
      path: "/pricing/tax-config",
      icon: Percent,
      label: "Impostos",
      show: isStaff,
    },
    {
      path: "/pricing/asset-costs",
      icon: Wrench,
      label: "Custos",
      show: isStaff,
    },
    {
      path: "/admin/cash-box",
      icon: Wallet,
      label: "Caixa",
      show: isStaff,
    },
    {
      path: "/admin/financial-forecast",
      icon: TrendingUp,
      label: "Previsão",
      show: isStaff,
    },
    {
      path: "/admin/predictive-purchases",
      icon: ShoppingCart,
      label: "Compras",
      show: isStaff,
    },
  ];

  // ⚙️ SISTEMA
  const systemMenuItems = [
    {
      path: "/admin/users",
      icon: Users,
      label: "Usuários",
      show: isSystemOwner, // APENAS owner pode gerenciar usuários
    },
    {
      path: "/admin/user-activities",
      icon: Activity,
      label: "Atividades",
      show: isStaff,
    },
    {
      path: "/admin/logs",
      icon: ScrollText,
      label: "Logs",
      show: isStaff,
    },
    {
      path: "/admin/error-logs",
      icon: AlertTriangle,
      label: "Erros",
      show: isStaff,
    },
    {
      path: "/admin/active-sessions",
      icon: Activity,
      label: "Sessões",
      show: isStaff,
    },
    {
      path: "/admin/session-health",
      icon: Activity,
      label: "Health",
      show: isStaff,
    },
    {
      path: "/admin/edge-functions-health",
      icon: Activity,
      label: "Edge",
      show: isStaff,
    },
    {
      path: "/admin/system-integrity",
      icon: ShieldCheck,
      label: "Integridade",
      show: isStaff,
    },
    {
      path: "/admin/external-sync",
      icon: RefreshCcw,
      label: "Sincronização",
      show: isSystemOwner, // APENAS owner pode sincronizar externamente
    },
    {
      path: "/admin/settings",
      icon: Settings,
      label: "Configurações",
      show: isStaff,
    },
  ];

  // Filtrar itens visíveis
  const visibleStockItems = stockMenuItems.filter(item => item.show);
  const visibleAssetsItems = assetsMenuItems.filter(item => item.show);
  const visibleDocsItems = docsMenuItems.filter(item => item.show);
  const visibleFinanceItems = financeMenuItems.filter(item => item.show);
  const visibleSystemItems = systemMenuItems.filter(item => item.show);

  const showMainMenu = permissions.can_access_main_menu || isAdmin;
  const showAdminMenu = permissions.can_access_admin || isAdmin;

  const renderMenuItem = (item: { path: string; icon: LucideIcon; label: string }) => (
    <SidebarMenuItem key={item.path}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton asChild>
            <NavLink to={item.path} className={getNavCls} onClick={handleNavClick}>
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          </SidebarMenuButton>
        </TooltipTrigger>
        {!open && (
          <TooltipContent side="right" className="font-normal">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    </SidebarMenuItem>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar className="border-r" collapsible="icon">
        <SidebarHeader className="border-b p-3 sm:p-4 md:px-6 md:py-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img 
              src="/malta-logo.webp" 
              alt="Malta Locações" 
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain flex-shrink-0"
              fetchPriority="high"
            />
            {open && (
              <div className="min-w-0">
                <h2 className="font-semibold text-sidebar-foreground text-sm sm:text-base truncate">Malta Locações</h2>
                <p className="text-xs text-sidebar-foreground/70 truncate">Sistema de Gestão</p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {/* 📦 ESTOQUE */}
          {showMainMenu && visibleStockItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Estoque</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleStockItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* 🖥️ PATRIMÔNIO */}
          {showMainMenu && visibleAssetsItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Patrimônio</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleAssetsItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* 📄 DOCUMENTOS */}
          {showMainMenu && visibleDocsItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Documentos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleDocsItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* 💰 FINANCEIRO */}
          {showAdminMenu && visibleFinanceItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleFinanceItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* ⚙️ SISTEMA */}
          {showAdminMenu && visibleSystemItems.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel>Sistema</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleSystemItems.map(renderMenuItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="border-t p-3 sm:p-4">
          <div className="space-y-2">
            {open && (
              <p className="text-xs sm:text-sm text-muted-foreground px-2 truncate">
                {user?.email}
              </p>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm" 
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
                  {open && <span>Sair</span>}
                </Button>
              </TooltipTrigger>
              {!open && (
                <TooltipContent side="right" className="font-normal">
                  Sair
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

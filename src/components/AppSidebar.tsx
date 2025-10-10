import { Package, FileText, Users, Settings, LogOut, PackageMinus, History, QrCode, Shield, BarChart3, ClipboardList, TrendingUp, Building2, Wallet } from "lucide-react";
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
  SidebarTrigger,
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
  const { isAdmin, signOut, user, permissions } = useAuth();
  const { open, isMobile, setOpenMobile } = useSidebar();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "";

  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Se não tem permissões carregadas, não mostrar menu
  if (!permissions) {
    return null;
  }

  // CONTROLE DE ESTOQUE
  const inventoryMenuItems = [
    {
      path: "/dashboard",
      icon: Package,
      label: "Controle de Estoque",
      show: permissions.can_view_products || isAdmin,
    },
    {
      path: "/inventory/withdrawal",
      icon: PackageMinus,
      label: "Retirada de Material",
      show: permissions.can_create_withdrawals || isAdmin,
    },
    {
      path: "/inventory/history",
      icon: History,
      label: "Histórico de Retiradas",
      show: permissions.can_view_withdrawal_history || isAdmin,
    },
  ];

  // GESTÃO DE PATRIMÔNIO
  const assetsMenuItems = [
    {
      path: "/assets/control",
      icon: BarChart3,
      label: "Controle de Patrimônio",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/assets",
      icon: QrCode,
      label: "Gestão de Patrimônio",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/rental-companies",
      icon: Building2,
      label: "Empresas de Locação",
      show: permissions.can_access_assets || isAdmin,
    },
  ];

  // RELATÓRIOS
  const reportsMenuItems = [
    {
      path: "/reports/new",
      icon: FileText,
      label: "Novo Relatório",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/reports",
      icon: FileText,
      label: "Histórico de Relatórios",
      show: permissions.can_view_reports || isAdmin,
    },
    {
      path: "/reports/status",
      icon: ClipboardList,
      label: "Relatórios de Status",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/reports/malta-productivity",
      icon: TrendingUp,
      label: "Produtividade Malta",
      show: permissions.can_access_assets || isAdmin,
    },
  ];

  // Filtrar itens visíveis
  const visibleInventoryItems = inventoryMenuItems.filter(item => item.show);
  const visibleAssetsItems = assetsMenuItems.filter(item => item.show);
  const visibleReportsItems = reportsMenuItems.filter(item => item.show);

  // Só mostrar o menu principal se houver permissão ou se for admin
  const showMainMenu = permissions.can_access_main_menu || isAdmin;

  // Só mostrar o menu admin se tiver permissão ou for admin
  const showAdminMenu = permissions.can_access_admin || isAdmin;

  return (
    <TooltipProvider delayDuration={0}>
      <Sidebar
        className="border-r"
        collapsible="icon"
      >
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
              <p className="text-xs text-sidebar-foreground/70 truncate">Controle de Estoque</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showMainMenu && visibleInventoryItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Controle de Estoque</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleInventoryItems.map((item) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showMainMenu && visibleAssetsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Gestão de Patrimônio</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAssetsItems.map((item) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showMainMenu && visibleReportsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Relatórios</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReportsItems.map((item) => (
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
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {showAdminMenu && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/cash-box" className={getNavCls} onClick={handleNavClick}>
                          <Wallet className="h-4 w-4" />
                          <span>Caixa</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Caixa
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/financial-forecast" className={getNavCls} onClick={handleNavClick}>
                          <TrendingUp className="h-4 w-4" />
                          <span>Previsão Financeira</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Previsão Financeira
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/products" className={getNavCls} onClick={handleNavClick}>
                          <Package className="h-4 w-4" />
                          <span>Produtos</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Produtos
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/users" className={getNavCls} onClick={handleNavClick}>
                          <Users className="h-4 w-4" />
                          <span>Usuários</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Usuários
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/logs" className={getNavCls} onClick={handleNavClick}>
                          <Shield className="h-4 w-4" />
                          <span>Logs de Auditoria</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Logs de Auditoria
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/settings" className={getNavCls} onClick={handleNavClick}>
                          <Settings className="h-4 w-4" />
                          <span>Configurações</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Configurações
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
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

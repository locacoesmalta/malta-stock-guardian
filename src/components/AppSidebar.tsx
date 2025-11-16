import { Package, FileText, Users, Settings, LogOut, PackageMinus, History, QrCode, Shield, BarChart3, ClipboardList, TrendingUp, Building2, Wallet, FileCheck, FileBarChart, MessageSquare, AlertTriangle, ShoppingCart, Activity, CheckCircle2, type LucideIcon } from "lucide-react";
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
      path: "/admin/products",
      icon: Package,
      label: "Cadastro de Produtos",
      show: permissions.can_edit_products || isAdmin,
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
      label: "Painel de Controle",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/assets",
      icon: QrCode,
      label: "Lista de Ativos",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/assets/unified-history",
      icon: History,
      label: "Histórico Unificado",
      show: isAdmin, // Apenas para admin
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
      path: "/reports/quick",
      icon: FileText,
      label: "⚡ Relatório Rápido",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/reports/new",
      icon: FileText,
      label: "Novo Relatório Completo",
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
      label: "Status de Equipamentos",
      show: permissions.can_access_assets || isAdmin,
    },
    {
      path: "/reports/malta-productivity",
      icon: TrendingUp,
      label: "Produtividade Malta",
      show: permissions.can_access_assets || isAdmin,
    },
  ];

  // COMPROVANTES
  const receiptsMenuItems = [
    {
      path: "/receipts/movement-report",
      icon: FileBarChart,
      label: "Relatório de Movimentação",
      show: permissions.can_view_reports || isAdmin,
    },
    {
      path: "/receipts/delivery/new",
      icon: FileCheck,
      label: "Nova Entrega",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/receipts/return/new",
      icon: FileCheck,
      label: "Nova Devolução",
      show: permissions.can_create_reports || isAdmin,
    },
    {
      path: "/receipts/history",
      icon: History,
      label: "Histórico",
      show: permissions.can_view_reports || isAdmin,
    },
  ];

  // Filtrar itens visíveis
  const visibleInventoryItems = inventoryMenuItems.filter(item => item.show);
  const visibleAssetsItems = assetsMenuItems.filter(item => item.show);
  const visibleReportsItems = reportsMenuItems.filter(item => item.show);
  const visibleReceiptsItems = receiptsMenuItems.filter(item => item.show);

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

        {showMainMenu && visibleReceiptsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Comprovantes</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleReceiptsItems.map((item) => (
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

        {showMainMenu && (
          <SidebarGroup>
            <SidebarGroupLabel>Comunicação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/chat" className={getNavCls} onClick={handleNavClick}>
                          <MessageSquare className="h-4 w-4" />
                          <span>Chat em Tempo Real</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Chat em Tempo Real
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>
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
                        <NavLink to="/admin/predictive-purchases" className={getNavCls} onClick={handleNavClick}>
                          <ShoppingCart className="h-4 w-4" />
                          <span>Compras Preditivas</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Compras Preditivas
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
                        <NavLink to="/admin/error-logs" className={getNavCls} onClick={handleNavClick}>
                          <AlertTriangle className="h-4 w-4" />
                          <span>Central de Erros</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Central de Erros
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/active-sessions" className={getNavCls} onClick={handleNavClick}>
                          <Activity className="h-4 w-4" />
                          <span>Sessões Ativas</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Sessões Ativas
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/system-integrity" className={getNavCls} onClick={handleNavClick}>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Integridade do Sistema</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Integridade do Sistema
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/session-health" className={getNavCls} onClick={handleNavClick}>
                          <Activity className="h-4 w-4" />
                          <span>Saúde das Sessões</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Saúde das Sessões
                      </TooltipContent>
                    )}
                  </Tooltip>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton asChild>
                        <NavLink to="/admin/edge-functions-health" className={getNavCls} onClick={handleNavClick}>
                          <Activity className="h-4 w-4" />
                          <span>Edge Functions</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    {!open && (
                      <TooltipContent side="right" className="font-normal">
                        Saúde das Edge Functions
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

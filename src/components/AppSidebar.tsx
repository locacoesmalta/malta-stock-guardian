import { Package, FileText, Users, Settings, LogOut, PackageMinus, History, QrCode, Shield } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { isAdmin, signOut, user, permissions } = useAuth();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "";

  // Se não tem permissões carregadas, não mostrar menu
  if (!permissions) {
    return null;
  }

  // Menu items principais com suas permissões
  const mainMenuItems = [
    {
      path: "/dashboard",
      icon: Package,
      label: "Controle de Estoque",
      show: permissions.can_view_products || isAdmin,
    },
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
    {
      path: "/assets",
      icon: QrCode,
      label: "Gestão de Patrimônio",
      show: permissions.can_access_assets || isAdmin,
    },
  ];

  // Filtrar itens visíveis
  const visibleMainMenuItems = mainMenuItems.filter(item => item.show);

  // Só mostrar o menu principal se houver permissão ou se for admin
  const showMainMenu = permissions.can_access_main_menu || isAdmin;

  // Só mostrar o menu admin se tiver permissão ou for admin
  const showAdminMenu = permissions.can_access_admin || isAdmin;

  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
    >
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações" 
            className="w-12 h-12 object-contain"
            fetchPriority="high"
          />
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Malta Locações</h2>
            <p className="text-xs text-sidebar-foreground/70">Controle de Estoque</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {showMainMenu && visibleMainMenuItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleMainMenuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.path} className={getNavCls}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
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
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/products" className={getNavCls}>
                      <Package className="h-4 w-4" />
                      <span>Produtos</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/users" className={getNavCls}>
                      <Users className="h-4 w-4" />
                      <span>Usuários</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/logs" className={getNavCls}>
                      <Shield className="h-4 w-4" />
                      <span>Logs de Auditoria</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/admin/settings" className={getNavCls}>
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground px-2">
            {user?.email}
          </p>
          <Button 
            variant="ghost" 
            className="w-full justify-start" 
            onClick={signOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

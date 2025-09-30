import { Package, FileText, Users, Settings, LogOut, PackageMinus, History, QrCode } from "lucide-react";
import { NavLink } from "react-router-dom";
import maltaLogo from "@/assets/malta-logo.png";
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
  const { isAdmin, signOut, user } = useAuth();

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "";

  return (
    <Sidebar
      className="border-r"
      collapsible="icon"
    >
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <img 
            src={maltaLogo} 
            alt="Malta Locações" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Malta Locações</h2>
            <p className="text-xs text-sidebar-foreground/70">Controle de Estoque</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" className={getNavCls}>
                    <Package className="h-4 w-4" />
                    <span>Controle de Estoque</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/reports/new" className={getNavCls}>
                    <FileText className="h-4 w-4" />
                    <span>Novo Relatório</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/reports" className={getNavCls}>
                    <FileText className="h-4 w-4" />
                    <span>Histórico</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/inventory/withdrawal" className={getNavCls}>
                    <PackageMinus className="h-4 w-4" />
                    <span>Retirada de Material</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/inventory/history" className={getNavCls}>
                    <History className="h-4 w-4" />
                    <span>Histórico de Retiradas</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/assets" className={getNavCls}>
                    <QrCode className="h-4 w-4" />
                    <span>Gestão de Patrimônio</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
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

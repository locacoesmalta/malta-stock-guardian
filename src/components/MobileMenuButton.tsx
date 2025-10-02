import { Menu } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileMenuButton() {
  return (
    <SidebarTrigger className="h-10 w-10 rounded-lg bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all flex items-center justify-center">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Abrir menu</span>
    </SidebarTrigger>
  );
}

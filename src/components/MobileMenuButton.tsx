import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function MobileMenuButton() {
  return (
    <div className="fixed top-4 left-4 z-50 lg:hidden">
      <SidebarTrigger asChild>
        <Button 
          size="icon" 
          variant="default"
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SidebarTrigger>
    </div>
  );
}

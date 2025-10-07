import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 md:h-16 lg:h-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-3 sm:px-4 md:px-6">
        {/* Left: Menu toggle - sempre visível */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <SidebarTrigger className="flex-shrink-0" />
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações" 
            className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 object-contain"
            fetchPriority="high"
          />
          <span className="hidden sm:inline-block font-semibold text-sm md:text-base lg:text-lg truncate">
            Malta Locações
          </span>
        </div>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-2 md:gap-3">
          <span className="hidden md:inline-block text-xs md:text-sm lg:text-base text-muted-foreground truncate max-w-[200px] lg:max-w-[300px]">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="flex-shrink-0 md:h-10 md:w-10 lg:h-12 lg:w-12"
            title="Sair"
          >
            <LogOut className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

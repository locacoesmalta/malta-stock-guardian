import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        {/* Left: Menu toggle - sempre visível */}
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="flex-shrink-0" />
          <img 
            src="/malta-logo.webp" 
            alt="Malta Locações" 
            className="h-8 w-8 object-contain"
            fetchPriority="high"
          />
          <span className="hidden sm:inline-block font-semibold text-sm truncate">
            Malta Locações
          </span>
        </div>

        {/* Right: User info + Logout */}
        <div className="flex items-center gap-2">
          <span className="hidden md:inline-block text-xs sm:text-sm text-muted-foreground truncate max-w-[200px]">
            {user?.email}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="flex-shrink-0"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

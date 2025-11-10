import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const KeyboardShortcutHint = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        onClick={() => setIsVisible(false)}
      >
        <Command className="h-4 w-4" />
        <span className="text-xs">
          Pressione <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded">Ctrl</kbd> + 
          <kbd className="px-1.5 py-0.5 text-xs font-semibold border rounded ml-1">K</kbd> para busca rápida
        </span>
      </Button>
    </div>
  );
};

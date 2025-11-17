import { Info, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ContextualTooltipProps {
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  variant?: "info" | "help";
  className?: string;
  triggerClassName?: string;
}

export function ContextualTooltip({
  content,
  side = "right",
  variant = "info",
  className,
  triggerClassName,
}: ContextualTooltipProps) {
  const Icon = variant === "info" ? Info : HelpCircle;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full",
              "hover:bg-muted transition-colors cursor-help",
              triggerClassName
            )}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="sr-only">Mais informações</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          className={cn("max-w-xs animate-fade-in", className)}
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

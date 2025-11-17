import { AlertCircle, CheckCircle, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineValidationProps {
  status: "idle" | "validating" | "valid" | "invalid" | "warning";
  message?: string;
  className?: string;
}

export function InlineValidation({ 
  status, 
  message, 
  className 
}: InlineValidationProps) {
  if (status === "idle") return null;

  const config = {
    validating: {
      icon: Loader2,
      className: "text-muted-foreground animate-spin",
      bgClassName: "bg-muted/50",
    },
    valid: {
      icon: CheckCircle,
      className: "text-green-600",
      bgClassName: "bg-green-50 dark:bg-green-950/20",
    },
    invalid: {
      icon: AlertCircle,
      className: "text-destructive",
      bgClassName: "bg-destructive/10",
    },
    warning: {
      icon: Info,
      className: "text-amber-600",
      bgClassName: "bg-amber-50 dark:bg-amber-950/20",
    },
  };

  const { icon: Icon, className: iconClass, bgClassName } = config[status];

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-md text-sm animate-fade-in",
        bgClassName,
        className
      )}
    >
      <Icon className={cn("h-4 w-4 mt-0.5 flex-shrink-0", iconClass)} />
      {message && <span className="flex-1">{message}</span>}
    </div>
  );
}

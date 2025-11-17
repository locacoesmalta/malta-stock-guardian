import { AlertCircle, CheckCircle, Info, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface FeedbackBannerProps {
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  className?: string;
  animated?: boolean;
}

export function FeedbackBanner({
  variant,
  title,
  message,
  className,
  animated = true,
}: FeedbackBannerProps) {
  const config = {
    success: {
      icon: CheckCircle,
      className: "border-green-500/50 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400",
      iconClassName: "text-green-600",
    },
    error: {
      icon: XCircle,
      className: "border-red-500/50 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
      iconClassName: "text-red-600",
    },
    warning: {
      icon: AlertCircle,
      className: "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
      iconClassName: "text-amber-600",
    },
    info: {
      icon: Info,
      className: "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
      iconClassName: "text-blue-600",
    },
  };

  const { icon: Icon, className: alertClass, iconClassName } = config[variant];

  return (
    <Alert
      className={cn(
        alertClass,
        animated && "animate-fade-in",
        className
      )}
    >
      <Icon className={cn("h-4 w-4", iconClassName)} />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

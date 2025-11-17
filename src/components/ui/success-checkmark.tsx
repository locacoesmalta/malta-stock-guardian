import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessCheckmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  animated?: boolean;
}

export function SuccessCheckmark({ 
  size = "md", 
  className,
  label,
  animated = true 
}: SuccessCheckmarkProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <CheckCircle 
        className={cn(
          "text-green-600",
          sizeClasses[size],
          animated && "animate-scale-in"
        )} 
      />
      {label && (
        <span className={cn(
          "text-sm text-green-600 font-medium",
          animated && "animate-fade-in"
        )}>
          {label}
        </span>
      )}
    </div>
  );
}

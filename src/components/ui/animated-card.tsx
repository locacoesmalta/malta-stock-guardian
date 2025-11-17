import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AnimatedCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  variant?: "default" | "hover-lift" | "hover-glow";
  animated?: boolean;
}

export function AnimatedCard({
  title,
  description,
  children,
  footer,
  className,
  variant = "default",
  animated = true,
}: AnimatedCardProps) {
  const variantClasses = {
    default: "",
    "hover-lift": "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
    "hover-glow": "transition-all duration-300 hover:shadow-[0_0_15px_rgba(var(--primary),0.3)]",
  };

  return (
    <Card
      className={cn(
        animated && "animate-fade-in",
        variantClasses[variant],
        className
      )}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

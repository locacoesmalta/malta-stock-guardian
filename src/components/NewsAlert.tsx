import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NewsAlertProps {
  icon: LucideIcon;
  title: string;
  count: number;
  description: string;
  actionLink: string;
  variant?: "default" | "warning" | "destructive";
}

export const NewsAlert = ({
  icon: Icon,
  title,
  count,
  description,
  actionLink,
  variant = "default",
}: NewsAlertProps) => {
  const navigate = useNavigate();

  const variantStyles = {
    default: "border-primary/20 hover:border-primary/40",
    warning: "border-yellow-500/20 hover:border-yellow-500/40",
    destructive: "border-destructive/20 hover:border-destructive/40",
  };

  const badgeVariants = {
    default: "default" as const,
    warning: "secondary" as const,
    destructive: "destructive" as const,
  };

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${variantStyles[variant]}`}
      onClick={() => navigate(actionLink)}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${
          variant === "warning" ? "bg-yellow-500/10" :
          variant === "destructive" ? "bg-destructive/10" :
          "bg-primary/10"
        }`}>
          <Icon className={`h-5 w-5 ${
            variant === "warning" ? "text-yellow-600" :
            variant === "destructive" ? "text-destructive" :
            "text-primary"
          }`} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <Badge variant={badgeVariants[variant]} className="text-xs">
              {count}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  );
};

import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface NewsAlertProps {
  icon: LucideIcon;
  title: string;
  count: number;
  description: string;
  linkTo: string;
  variant?: "default" | "warning" | "destructive";
}

const NewsAlert = ({ icon: Icon, title, count, description, linkTo, variant = "default" }: NewsAlertProps) => {
  const navigate = useNavigate();

  const variantStyles = {
    default: "border-primary/30 hover:border-primary/50 bg-primary/5",
    warning: "border-yellow-500/30 hover:border-yellow-500/50 bg-yellow-500/5",
    destructive: "border-destructive/30 hover:border-destructive/50 bg-destructive/5"
  };

  const badgeVariants = {
    default: "default" as const,
    warning: "outline" as const,
    destructive: "destructive" as const
  };

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all hover:scale-105 hover:shadow-md ${variantStyles[variant]}`}
      onClick={() => navigate(linkTo)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-background/50">
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm">{title}</h3>
            <Badge variant={badgeVariants[variant]} className="shrink-0">
              {count}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

export default NewsAlert;

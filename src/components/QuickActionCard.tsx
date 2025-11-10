import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link: string;
  color?: string;
}

export const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  link,
  color = "primary",
}: QuickActionCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 group"
      onClick={() => navigate(link)}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`p-4 rounded-full bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
          <Icon className={`w-12 h-12 text-${color}`} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
};

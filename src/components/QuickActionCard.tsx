import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface QuickActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  linkTo: string;
  color?: string;
}

const QuickActionCard = ({ icon: Icon, title, description, linkTo, color = "primary" }: QuickActionCardProps) => {
  const navigate = useNavigate();

  return (
    <Card 
      className="p-6 cursor-pointer transition-all hover:scale-105 hover:shadow-lg border-2 group"
      onClick={() => navigate(linkTo)}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className={`p-4 rounded-full bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
          <Icon className={`w-12 h-12 text-${color}`} />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
};

export default QuickActionCard;

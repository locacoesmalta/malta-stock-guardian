import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
}

export function BackButton({ fallbackPath = "/assets" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Se há histórico suficiente, volta. Senão, vai para fallbackPath
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="gap-2"
    >
      <ArrowLeft className="h-4 w-4" />
      Voltar
    </Button>
  );
}

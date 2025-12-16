import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  fallbackPath?: string;
}

export function BackButton({ fallbackPath = "/assets" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // Sempre navegar para fallbackPath para comportamento previsível
    navigate(fallbackPath);
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

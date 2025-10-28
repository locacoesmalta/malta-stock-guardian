import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NotificationToggleProps {
  isMuted: boolean;
  onToggle: () => void;
}

export const NotificationToggle = ({ isMuted, onToggle }: NotificationToggleProps) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="shrink-0"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isMuted ? 'Ativar notificações sonoras' : 'Desativar notificações sonoras'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

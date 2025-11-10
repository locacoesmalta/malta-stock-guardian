import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock } from "lucide-react";

interface WelcomeHeaderProps {
  userName: string;
  userEmail: string;
  greeting: string;
  lastLoginFormatted: string | null;
  isFirstLogin: boolean;
}

export const WelcomeHeader = ({
  userName,
  userEmail,
  greeting,
  lastLoginFormatted,
  isFirstLogin,
}: WelcomeHeaderProps) => {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="flex items-start gap-4 animate-fade-in">
      <Avatar className="h-16 w-16 border-2 border-primary">
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-foreground mb-1">
          {greeting}, {userName}! 👋
        </h1>
        
        <p className="text-sm text-muted-foreground mb-2">{userEmail}</p>
        
        {isFirstLogin ? (
          <div className="flex items-center gap-2 text-sm text-primary font-medium">
            <span>✨ Este é seu primeiro acesso! Bem-vindo!</span>
          </div>
        ) : lastLoginFormatted ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Último acesso: {lastLoginFormatted}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
};

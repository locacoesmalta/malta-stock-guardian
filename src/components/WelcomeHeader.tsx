import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDateTimeBR } from "@/lib/dateUtils";

interface WelcomeHeaderProps {
  greeting: string;
  userName: string;
  userEmail: string;
  lastLoginAt: string | null;
  loginCount: number;
}

const WelcomeHeader = ({ greeting, userName, userEmail, lastLoginAt, loginCount }: WelcomeHeaderProps) => {
  const initials = userName
    .split(" ")
    .filter(n => n.length > 0)
    .map((n) => n[0].toUpperCase())
    .join("")
    .slice(0, 2);

  const formatLastLogin = () => {
    if (!lastLoginAt) return "Este é seu primeiro acesso!";
    
    try {
      return formatDateTimeBR(lastLoginAt);
    } catch {
      return "Data indisponível";
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-background rounded-lg border border-border/50 animate-fade-in">
      <Avatar className="h-20 w-20 border-4 border-primary/20">
        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {userName}! 👋
        </h1>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium">Último acesso:</span> {formatLastLogin()}
          </p>
          {loginCount > 1 && (
            <p className="text-xs">
              Total de acessos: <span className="font-semibold">{loginCount}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeHeader;

import { User, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OnlineUser } from "@/hooks/useUserPresence";

interface UserPresenceListProps {
  onlineUsers: OnlineUser[];
  onSelectUser: (userId: string) => void;
}

export const UserPresenceList = ({ onlineUsers, onSelectUser }: UserPresenceListProps) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">
          Usuários ({onlineUsers.filter(u => u.status === 'online').length}/{onlineUsers.length})
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Carregando usuários...
            </p>
          ) : (
            onlineUsers.map((user) => (
              <Button
                key={user.user_id}
                variant="ghost"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => onSelectUser(user.user_id)}
              >
                <div className="relative">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10">
                      <User className="w-5 h-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`} 
                  />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{user.user_name}</p>
                    {user.status === 'online' && (
                      <span className="text-xs text-green-600 dark:text-green-400">• Online</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user.user_email}</p>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

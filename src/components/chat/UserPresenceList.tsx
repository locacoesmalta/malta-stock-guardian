import { User, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { OnlineUser } from "@/hooks/useUserPresence";
import { User as UserType } from "@/hooks/useAllUsers";

interface UserPresenceListProps {
  onlineUsers: OnlineUser[];
  allUsers: UserType[];
  onSelectUser: (userId: string) => void;
}

export const UserPresenceList = ({ onlineUsers, allUsers, onSelectUser }: UserPresenceListProps) => {
  // Combinar todos os usuários com status online
  const usersWithStatus = allUsers.map(user => {
    const onlineStatus = onlineUsers.find(ou => ou.user_id === user.id);
    return {
      ...user,
      isOnline: !!onlineStatus,
      user_name: user.full_name || user.email.split('@')[0],
      user_email: user.email,
    };
  });

  const onlineCount = usersWithStatus.filter(u => u.isOnline).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">
          Usuários ({onlineCount} online / {usersWithStatus.length} total)
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {usersWithStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum usuário disponível
            </p>
          ) : (
            usersWithStatus
              .sort((a, b) => {
                // Online users first
                if (a.isOnline && !b.isOnline) return -1;
                if (!a.isOnline && b.isOnline) return 1;
                return a.user_name.localeCompare(b.user_name);
              })
              .map((user) => (
                <Button
                  key={user.id}
                  variant="ghost"
                  className="w-full justify-start gap-3 h-auto py-3"
                  onClick={() => onSelectUser(user.id)}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10">
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div 
                      className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${
                        user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      title={user.isOnline ? 'Online' : 'Offline'}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {user.user_name}
                      {user.isOnline && (
                        <span className="ml-2 text-xs text-green-500">● online</span>
                      )}
                    </p>
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

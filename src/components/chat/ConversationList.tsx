import { MessageCircle, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Conversation } from "@/hooks/useConversations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
}

export const ConversationList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) => {
  const { user } = useAuth();

  const getConversationName = (conv: Conversation) => {
    if (conv.type === 'group') {
      return conv.group?.name || 'Grupo sem nome';
    }
    if (conv.type === 'direct') {
      const otherParticipant = conv.participants?.find(p => p.user_id !== user?.id);
      return otherParticipant?.user_name || 'Usuário';
    }
    return 'Chat Global';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-4 border-b">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Conversas</h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma conversa ainda
            </p>
          ) : (
            conversations.map((conv) => (
              <Button
                key={conv.id}
                variant={selectedConversationId === conv.id ? "secondary" : "ghost"}
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  {conv.type === 'group' ? (
                    <Users className="w-5 h-5 text-primary" />
                  ) : (
                    <MessageCircle className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {getConversationName(conv)}
                    </p>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(conv.last_message.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    {conv.last_message && (
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message.content}
                      </p>
                    )}
                    {conv.unread_count && conv.unread_count > 0 && (
                      <Badge variant="default" className="ml-auto shrink-0 h-5 min-w-5 flex items-center justify-center px-1.5">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

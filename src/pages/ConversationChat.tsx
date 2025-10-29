import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useConversations } from "@/hooks/useConversations";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

const ConversationChat = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const { messages, isLoading, sendMessage, isSending, newMessageId } = useConversationMessages(conversationId || null);
  const { conversations } = useConversations();
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(conversationId || null);
  const { playNotification } = useNotificationSound();

  // Get conversation details
  const conversation = conversations.find(c => c.id === conversationId);
  
  // Get other participant's name for direct messages
  const otherParticipant = conversation?.type === 'direct' 
    ? conversation.participants?.find(p => p.user_id !== user?.id)
    : null;

  const conversationName = conversation?.type === 'group' 
    ? conversation.group?.name 
    : otherParticipant?.user_name || 'Conversa';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Play notification sound for new messages from others
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage && latestMessage.user_id !== user?.id) {
        playNotification();
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, user, playNotification]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;
    
    stopTyping();
    sendMessage(inputValue);
    setInputValue("");
    
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;

    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3 bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/chat")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">{conversationName}</h1>
          <p className="text-sm text-muted-foreground">
            {conversation?.type === 'group' 
              ? `${conversation.participants?.length || 0} participantes` 
              : 'Conversa direta'}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <Card className="flex-1 flex flex-col overflow-hidden m-4 mt-0">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhuma mensagem ainda. Inicie a conversa!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.user_id === user?.id;
                const isNew = message.id === newMessageId;
                
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-1",
                      isOwnMessage ? "items-end" : "items-start",
                      isNew && "animate-fade-in"
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {isOwnMessage 
                          ? "Você" 
                          : message.user_name || message.user_email || "Usuário"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%] md:max-w-[60%] break-words",
                        isOwnMessage
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
              className="min-h-[44px] max-h-[120px] resize-none"
              disabled={isSending}
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              size="icon"
              className="h-11 w-11 shrink-0"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConversationChat;

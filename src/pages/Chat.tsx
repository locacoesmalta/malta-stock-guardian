import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Chat = () => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, isSending, newMessageId } = useMessages();
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;
    
    sendMessage(inputValue);
    setInputValue("");
    
    // Reset textarea height
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
    
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-foreground">Chat em Tempo Real</h1>
        <p className="text-muted-foreground mt-1">
          Converse com a equipe em tempo real
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Nenhuma mensagem ainda. Seja o primeiro a conversar!
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

        {/* Input Area - Fixed at bottom */}
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
                <Send className="w-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Chat;

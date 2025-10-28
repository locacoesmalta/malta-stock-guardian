import { useState, useRef, useEffect } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { useConversations } from "@/hooks/useConversations";
import { useGroups } from "@/hooks/useGroups";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { UserPresenceList } from "@/components/chat/UserPresenceList";
import { ConversationList } from "@/components/chat/ConversationList";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { NotificationToggle } from "@/components/chat/NotificationToggle";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";

const Chat = () => {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const { messages, isLoading, sendMessage, isSending, newMessageId } = useMessages();
  const { onlineUsers } = useUserPresence();
  const { conversations, isLoading: loadingConversations, createDirectConversation, markAsRead } = useConversations();
  const { groups } = useGroups();
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(selectedConversationId);
  const { playNotification, isMuted, toggleMute } = useNotificationSound();

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

  // Handle selecting user for direct message
  const handleSelectUser = async (userId: string) => {
    try {
      const conversationId = await createDirectConversation(userId);
      setSelectedConversationId(conversationId);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle selecting conversation
  const handleSelectConversation = async (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
    await markAsRead(conversationId);
  };

  const handleSend = () => {
    if (!inputValue.trim() || isSending) return;
    
    stopTyping();
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

    // Start typing indicator
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const Sidebar = () => (
    <div className="h-full border-r bg-card">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat</h2>
        <NotificationToggle isMuted={isMuted} onToggle={toggleMute} />
      </div>

      <Tabs defaultValue="conversations" className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="conversations">Conversas</TabsTrigger>
          <TabsTrigger value="users">Online</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversations" className="flex-1 mt-0">
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </TabsContent>
        
        <TabsContent value="users" className="flex-1 mt-0">
          <UserPresenceList
            onlineUsers={onlineUsers}
            onSelectUser={handleSelectUser}
          />
        </TabsContent>
        
        <TabsContent value="groups" className="flex-1 mt-0">
          <div className="p-4 space-y-4">
            <CreateGroupDialog onlineUsers={onlineUsers} />
            <ConversationList
              conversations={conversations.filter(c => c.type === 'group')}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Chat em Tempo Real</h1>
            <p className="text-sm text-muted-foreground">
              {onlineUsers.length} usuários online
            </p>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden m-4 mt-0">
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

        {/* Typing Indicator */}
        <TypingIndicator typingUsers={typingUsers} />

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
    </div>
  );
};

export default Chat;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserPresence } from "@/hooks/useUserPresence";
import { useConversations } from "@/hooks/useConversations";
import { useGroups } from "@/hooks/useGroups";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useAllUsers } from "@/hooks/useAllUsers";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Menu } from "lucide-react";
import { UserPresenceList } from "@/components/chat/UserPresenceList";
import { ConversationList } from "@/components/chat/ConversationList";
import { NotificationToggle } from "@/components/chat/NotificationToggle";
import { CreateGroupDialog } from "@/components/chat/CreateGroupDialog";

const Chat = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { onlineUsers } = useUserPresence();
  const { users: allUsers } = useAllUsers();
  const { conversations, isLoading: loadingConversations, createDirectConversation, markAsRead } = useConversations();
  const { groups } = useGroups();
  const { isMuted, toggleMute } = useNotificationSound();

  // Handle selecting user for direct message
  const handleSelectUser = async (userId: string) => {
    try {
      const conversationId = await createDirectConversation(userId);
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Handle selecting conversation
  const handleSelectConversation = async (conversationId: string) => {
    await markAsRead(conversationId);
    navigate(`/chat/${conversationId}`);
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
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversations" className="flex-1 mt-0">
          <ConversationList
            conversations={conversations}
            selectedConversationId={null}
            onSelectConversation={handleSelectConversation}
          />
        </TabsContent>
        
        <TabsContent value="users" className="flex-1 mt-0">
          <UserPresenceList
            onlineUsers={onlineUsers}
            allUsers={allUsers}
            onSelectUser={handleSelectUser}
          />
        </TabsContent>
        
        <TabsContent value="groups" className="flex-1 mt-0">
          <div className="p-4 space-y-4">
            <CreateGroupDialog onlineUsers={onlineUsers} />
            <ConversationList
              conversations={conversations.filter(c => c.type === 'group')}
              selectedConversationId={null}
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

      {/* Main Chat Area - Welcome Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden absolute top-4 left-4"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-bold">Chat em Tempo Real</h1>
          <p className="text-muted-foreground">
            Selecione uma conversa na barra lateral ou inicie uma nova conversa com um usuário online.
          </p>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <p>📝 {conversations.length} conversas ativas</p>
            <p>🟢 {onlineUsers.length} usuários online agora</p>
            <p>👥 {allUsers.length} usuários disponíveis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

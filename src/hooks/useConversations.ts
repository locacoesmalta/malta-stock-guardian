import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  type: 'direct' | 'group' | 'global';
  created_at: string;
  updated_at: string;
  participants?: ConversationParticipant[];
  group?: {
    name: string;
    description?: string;
    avatar_url?: string;
  };
  unread_count?: number;
  last_message?: {
    content: string;
    created_at: string;
  };
}

export interface ConversationParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  joined_at: string;
  last_read_at?: string;
  user_name?: string;
  user_email?: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Buscar conversas do usuário
      const { data: participations, error: participationsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (participationsError) throw participationsError;

      const conversationIds = participations.map(p => p.conversation_id);

      if (conversationIds.length === 0) return [];

      // Buscar detalhes das conversas
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          created_at,
          updated_at
        `)
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (conversationsError) throw conversationsError;

      // Para cada conversa, buscar participantes e grupos
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conv) => {
          // Buscar participantes
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select(`
              id,
              user_id,
              conversation_id,
              joined_at,
              last_read_at
            `)
            .eq('conversation_id', conv.id);

          // Buscar nomes dos participantes
          const participantsWithNames: any[] = [];
          if (participants) {
            for (const participant of participants) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', participant.user_id)
                .single();

              participantsWithNames.push({
                ...participant,
                user_name: profile?.full_name || profile?.email || 'Usuário',
                user_email: profile?.email || '',
              });
            }
          }

          // Se for grupo, buscar info do grupo
          let group = undefined;
          if (conv.type === 'group') {
            const { data: groupData } = await supabase
              .from('chat_groups')
              .select('name, description, avatar_url')
              .eq('conversation_id', conv.id)
              .single();

            if (groupData) {
              group = groupData;
            }
          }

          // Buscar última mensagem
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Calcular não lidas
          const myParticipation = participants?.find(p => p.user_id === user.id);
          const lastReadAt = myParticipation?.last_read_at;
          
          let unread_count = 0;
          if (lastReadAt) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id)
              .gt('created_at', lastReadAt)
              .neq('user_id', user.id);

            unread_count = count || 0;
          }

          return {
            ...conv,
            participants,
            group,
            last_message: lastMessage || undefined,
            unread_count,
          };
        })
      );

      return conversationsWithDetails as Conversation[];
    },
    enabled: !!user,
  });

  const createDirectConversation = useMutation({
    mutationFn: async (otherUserId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar conversas do usuário atual
      const { data: myParticipations, error: myError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (myError) throw myError;

      // Verificar se já existe conversa com o outro usuário
      if (myParticipations && myParticipations.length > 0) {
        const conversationIds = myParticipations.map(p => p.conversation_id);
        
        const { data: otherParticipations, error: otherError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .in('conversation_id', conversationIds);

        if (otherError) throw otherError;

        if (otherParticipations && otherParticipations.length > 0) {
          // Já existe conversa, verificar se é direct
          const { data: existingConv } = await supabase
            .from('conversations')
            .select('id, type')
            .eq('id', otherParticipations[0].conversation_id)
            .eq('type', 'direct')
            .single();

          if (existingConv) {
            return existingConv.id;
          }
        }
      }

      // Criar nova conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (convError) throw convError;

      // Adicionar participantes
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: otherUserId },
        ]);

      if (participantsError) throw participantsError;

      return conversation.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error) => {
      console.error('Error creating conversation:', error);
      toast.error('Erro ao criar conversa');
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('conversation_participants')
        .update({ last_read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  return {
    conversations,
    isLoading,
    createDirectConversation: createDirectConversation.mutateAsync,
    markAsRead: markAsRead.mutateAsync,
  };
};

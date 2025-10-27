import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
}

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_user_id_fkey (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        toast.error('Erro ao carregar mensagens');
      } else {
        setMessages(
          data.map((msg: any) => ({
            ...msg,
            user_email: msg.profiles?.email,
            user_name: msg.profiles?.full_name,
          }))
        );
      }
      setLoading(false);
    };

    fetchMessages();

    // Inscrever-se em mudanças em tempo real
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('Nova mensagem recebida:', payload);
          
          // Buscar informações do perfil do usuário
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            ...(payload.new as Message),
            user_email: profile?.email,
            user_name: profile?.full_name,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      content: content.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from('messages').delete().eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      toast.error('Erro ao deletar mensagem');
    } else {
      setMessages((prev) => prev.filter((msg) => msg.id !== id));
      toast.success('Mensagem deletada');
    }
  };

  return { messages, loading, sendMessage, deleteMessage };
};

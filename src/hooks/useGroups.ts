import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface ChatGroup {
  id: string;
  conversation_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  avatar_url?: string;
  members?: GroupMember[];
  my_role?: 'admin' | 'moderator' | 'member';
}

export interface GroupMember {
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'admin' | 'moderator' | 'member';
  can_add_members: boolean;
  can_remove_members: boolean;
}

export const useGroups = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ['chat-groups', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Buscar grupos que o usuário participa
      const { data: myConversations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (!myConversations || myConversations.length === 0) return [];

      const conversationIds = myConversations.map(c => c.conversation_id);

      // Buscar grupos
      const { data: groups, error } = await supabase
        .from('chat_groups')
        .select('*')
        .in('conversation_id', conversationIds);

      if (error) throw error;

      // Para cada grupo, buscar membros e permissões
      const groupsWithMembers = await Promise.all(
        groups.map(async (group) => {
          // Buscar membros do grupo
          const { data: permissions } = await supabase
            .from('group_permissions')
            .select('*')
            .eq('group_id', group.id);

          const members: GroupMember[] = [];
          let myRole: 'admin' | 'moderator' | 'member' | undefined;

          if (permissions) {
            for (const perm of permissions) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', perm.user_id)
                .single();

              if (profile) {
                members.push({
                  user_id: perm.user_id,
                  user_name: profile.full_name || profile.email,
                  user_email: profile.email,
                  role: perm.role as 'admin' | 'moderator' | 'member',
                  can_add_members: perm.can_add_members,
                  can_remove_members: perm.can_remove_members,
                });

                if (perm.user_id === user.id) {
                  myRole = perm.role as 'admin' | 'moderator' | 'member';
                }
              }
            }
          }

          return {
            ...group,
            members,
            my_role: myRole,
          };
        })
      );

      return groupsWithMembers as ChatGroup[];
    },
    enabled: !!user,
  });

  const createGroup = useMutation({
    mutationFn: async ({ name, description, memberIds }: { 
      name: string; 
      description?: string; 
      memberIds: string[] 
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Criar conversa
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'group' })
        .select()
        .single();

      if (convError) throw convError;

      // Criar grupo
      const { data: group, error: groupError } = await supabase
        .from('chat_groups')
        .insert({
          conversation_id: conversation.id,
          name,
          description,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Adicionar criador como participante e admin
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: conversation.id, user_id: user.id });

      if (participantError) throw participantError;

      const { error: permError } = await supabase
        .from('group_permissions')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
          can_add_members: true,
          can_remove_members: true,
        });

      if (permError) throw permError;

      // Adicionar outros membros
      if (memberIds.length > 0) {
        const participants = memberIds.map(id => ({
          conversation_id: conversation.id,
          user_id: id,
        }));

        const { error: membersError } = await supabase
          .from('conversation_participants')
          .insert(participants);

        if (membersError) throw membersError;

        const permissions = memberIds.map(id => ({
          group_id: group.id,
          user_id: id,
          role: 'member',
        }));

        await supabase
          .from('group_permissions')
          .insert(permissions);
      }

      return group;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      toast.success('Grupo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Error creating group:', error);
      toast.error('Erro ao criar grupo');
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Grupo não encontrado');

      // Adicionar como participante da conversa
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .insert({ conversation_id: group.conversation_id, user_id: userId });

      if (participantError) throw participantError;

      // Adicionar permissões
      const { error: permError } = await supabase
        .from('group_permissions')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
        });

      if (permError) throw permError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      toast.success('Membro adicionado!');
    },
    onError: (error) => {
      console.error('Error adding member:', error);
      toast.error('Erro ao adicionar membro');
    },
  });

  const removeMember = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) => {
      const group = groups.find(g => g.id === groupId);
      if (!group) throw new Error('Grupo não encontrado');

      // Remover permissões
      const { error: permError } = await supabase
        .from('group_permissions')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (permError) throw permError;

      // Remover participação
      const { error: participantError } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', group.conversation_id)
        .eq('user_id', userId);

      if (participantError) throw participantError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-groups'] });
      toast.success('Membro removido!');
    },
    onError: (error) => {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover membro');
    },
  });

  return {
    groups,
    isLoading,
    createGroup: createGroup.mutateAsync,
    addMember: addMember.mutateAsync,
    removeMember: removeMember.mutateAsync,
  };
};

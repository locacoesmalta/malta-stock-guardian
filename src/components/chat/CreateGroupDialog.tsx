import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { OnlineUser } from "@/hooks/useUserPresence";
import { useGroups } from "@/hooks/useGroups";
import { toast } from "sonner";

interface CreateGroupDialogProps {
  onlineUsers: OnlineUser[];
}

export const CreateGroupDialog = ({ onlineUsers }: CreateGroupDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { createGroup } = useGroups();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Digite um nome para o grupo");
      return;
    }

    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedUsers,
      });
      setOpen(false);
      setName("");
      setDescription("");
      setSelectedUsers([]);
    } catch (error) {
      console.error(error);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Nome do Grupo</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do grupo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-description">Descrição (opcional)</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito do grupo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Adicionar Membros</Label>
            <div className="border rounded-lg p-3 max-h-[200px] overflow-y-auto space-y-2">
              {onlineUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum usuário online
                </p>
              ) : (
                onlineUsers.map((user) => (
                  <div key={user.user_id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`user-${user.user_id}`}
                      checked={selectedUsers.includes(user.user_id)}
                      onCheckedChange={() => toggleUser(user.user_id)}
                    />
                    <label
                      htmlFor={`user-${user.user_id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {user.user_name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleCreate}>
            Criar Grupo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

interface WithdrawalCollaboratorsManagerProps {
  collaborators: string[];
  onCollaboratorsChange: (collaborators: string[]) => void;
}

export const WithdrawalCollaboratorsManager = ({
  collaborators,
  onCollaboratorsChange,
}: WithdrawalCollaboratorsManagerProps) => {
  const [newCollaboratorName, setNewCollaboratorName] = useState("");

  const handleAddCollaborator = () => {
    const trimmedName = newCollaboratorName.trim();
    
    if (!trimmedName) {
      toast.error("Digite o nome do colaborador");
      return;
    }

    if (collaborators.includes(trimmedName)) {
      toast.error("Este colaborador já foi adicionado");
      return;
    }

    onCollaboratorsChange([...collaborators, trimmedName]);
    setNewCollaboratorName("");
    toast.success("Colaborador adicionado");
  };

  const handleRemoveCollaborator = (name: string) => {
    onCollaboratorsChange(collaborators.filter((c) => c !== name));
    toast.success("Colaborador removido");
  };

  return (
    <div className="space-y-3">
      {/* Input para adicionar novo colaborador */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={newCollaboratorName}
          onChange={(e) => setNewCollaboratorName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCollaborator();
            }
          }}
          placeholder="Nome do colaborador adicional"
          className="text-sm"
        />
        <Button
          type="button"
          onClick={handleAddCollaborator}
          size="sm"
          variant="outline"
          className="flex-shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista de colaboradores adicionados */}
      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collaborators.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
            >
              <span>{name}</span>
              <Button
                type="button"
                onClick={() => handleRemoveCollaborator(name)}
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

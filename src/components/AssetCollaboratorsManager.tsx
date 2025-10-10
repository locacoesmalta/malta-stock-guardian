import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, User } from "lucide-react";
import { useAssetCollaborators } from "@/hooks/useAssetCollaborators";

interface AssetCollaboratorsManagerProps {
  assetId: string | undefined;
  onCollaboratorsChange?: (collaborators: string[]) => void;
}

export const AssetCollaboratorsManager = ({
  assetId,
  onCollaboratorsChange,
}: AssetCollaboratorsManagerProps) => {
  const [newCollaboratorName, setNewCollaboratorName] = useState("");
  const { collaborators, addCollaborator, removeCollaborator } = useAssetCollaborators(assetId);

  const handleAddCollaborator = async () => {
    if (!assetId || !newCollaboratorName.trim()) return;

    await addCollaborator.mutateAsync({
      assetId,
      collaboratorName: newCollaboratorName.trim(),
    });

    setNewCollaboratorName("");
    
    if (onCollaboratorsChange) {
      const updatedCollaborators = [...collaborators.map(c => c.collaborator_name), newCollaboratorName.trim()];
      onCollaboratorsChange(updatedCollaborators);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    await removeCollaborator.mutateAsync(collaboratorId);
    
    if (onCollaboratorsChange) {
      const updatedCollaborators = collaborators
        .filter(c => c.id !== collaboratorId)
        .map(c => c.collaborator_name);
      onCollaboratorsChange(updatedCollaborators);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Colaboradores Adicionais Malta</Label>
        <div className="flex gap-2">
          <Input
            value={newCollaboratorName}
            onChange={(e) => setNewCollaboratorName(e.target.value)}
            placeholder="Nome do colaborador"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCollaborator();
              }
            }}
          />
          <Button
            type="button"
            onClick={handleAddCollaborator}
            disabled={!newCollaboratorName.trim() || !assetId}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {collaborators.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Colaboradores cadastrados ({collaborators.length})
          </Label>
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{collaborator.collaborator_name}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCollaborator(collaborator.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Plus } from "lucide-react";
import { Badge } from "./ui/badge";

interface WithdrawalCollaboratorsManagerProps {
  collaborators: string[];
  onCollaboratorsChange: (collaborators: string[]) => void;
}

export const WithdrawalCollaboratorsManager = ({
  collaborators,
  onCollaboratorsChange,
}: WithdrawalCollaboratorsManagerProps) => {
  const [newCollaborator, setNewCollaborator] = useState("");

  const addCollaborator = () => {
    const trimmedName = newCollaborator.trim();
    if (trimmedName && !collaborators.includes(trimmedName)) {
      onCollaboratorsChange([...collaborators, trimmedName]);
      setNewCollaborator("");
    }
  };

  const removeCollaborator = (index: number) => {
    onCollaboratorsChange(collaborators.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addCollaborator();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            value={newCollaborator}
            onChange={(e) => setNewCollaborator(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nome do colaborador adicional"
            className="text-sm"
          />
        </div>
        <Button
          type="button"
          onClick={addCollaborator}
          disabled={!newCollaborator.trim()}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collaborators.map((collaborator, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span className="text-sm">{collaborator}</span>
              <button
                type="button"
                onClick={() => removeCollaborator(index)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

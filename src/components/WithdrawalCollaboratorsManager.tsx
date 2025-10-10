import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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

  const handleAddCollaborator = () => {
    const trimmed = newCollaborator.trim();
    if (trimmed && !collaborators.includes(trimmed)) {
      onCollaboratorsChange([...collaborators, trimmed]);
      setNewCollaborator("");
    }
  };

  const handleRemoveCollaborator = (name: string) => {
    onCollaboratorsChange(collaborators.filter((c) => c !== name));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCollaborator();
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
          onClick={handleAddCollaborator}
          variant="outline"
          size="sm"
          disabled={!newCollaborator.trim() || collaborators.includes(newCollaborator.trim())}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {collaborators.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {collaborators.map((name) => (
            <Badge key={name} variant="secondary" className="gap-1 pr-1">
              <span className="text-xs">{name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveCollaborator(name)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

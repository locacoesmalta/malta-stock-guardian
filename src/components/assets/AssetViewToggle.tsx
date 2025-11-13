import { Button } from "@/components/ui/button";
import { LayoutGrid, Columns3 } from "lucide-react";

interface AssetViewToggleProps {
  viewMode: "grid" | "kanban";
  onViewModeChange: (mode: "grid" | "kanban") => void;
}

export const AssetViewToggle = ({ viewMode, onViewModeChange }: AssetViewToggleProps) => {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      <Button
        variant={viewMode === "grid" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("grid")}
        className="gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Grid</span>
      </Button>
      <Button
        variant={viewMode === "kanban" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("kanban")}
        className="gap-2"
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">Kanban</span>
      </Button>
    </div>
  );
};

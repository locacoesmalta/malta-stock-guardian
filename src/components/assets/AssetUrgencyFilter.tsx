import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Filter } from "lucide-react";

interface AssetUrgencyFilterProps {
  value: "all" | "attention" | "on-track";
  onChange: (value: "all" | "attention" | "on-track") => void;
  urgentCount: number;
}

export const AssetUrgencyFilter = ({ value, onChange, urgentCount }: AssetUrgencyFilterProps) => {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Filtrar por urgência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Todos
            </div>
          </SelectItem>
          <SelectItem value="attention">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Atenção Necessária {urgentCount > 0 && `(${urgentCount})`}
            </div>
          </SelectItem>
          <SelectItem value="on-track">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              No Prazo
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

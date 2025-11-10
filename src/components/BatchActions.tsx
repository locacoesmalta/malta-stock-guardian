import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Trash2, MoreVertical, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { useSoftDelete } from "@/hooks/useSoftDelete";
import { useConfirm } from "@/hooks/useConfirm";
import * as XLSX from "xlsx";

interface BatchActionsProps {
  selectedIds: string[];
  table: "assets" | "products" | "reports" | "equipment_receipts";
  data: any[];
  queryKey: string[];
  onClearSelection?: () => void;
}

export const BatchActions = ({ 
  selectedIds, 
  table, 
  data, 
  queryKey,
  onClearSelection 
}: BatchActionsProps) => {
  const { softDelete } = useSoftDelete();
  const { confirm } = useConfirm();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedItems = data.filter(item => selectedIds.includes(item.id));

  const handleExportSelected = () => {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos 1 item");
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(selectedItems);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      
      const filename = `${table}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`${selectedItems.length} itens exportados`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) {
      toast.error("Selecione pelo menos 1 item");
      return;
    }

    const confirmed = await confirm({
      title: "Confirmar exclusão em lote",
      description: `Deseja realmente remover ${selectedItems.length} itens selecionados?`,
    });

    if (!confirmed) return;

    setIsProcessing(true);
    
    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of selectedIds) {
        try {
          await softDelete({ table, id, queryKey });
          successCount++;
        } catch (error) {
          console.error(`Erro ao deletar item ${id}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`${successCount} itens removidos com sucesso`);
      } else {
        toast.warning(`${successCount} itens removidos, ${errorCount} falharam`);
      }

      onClearSelection?.();
    } catch (error) {
      console.error("Erro na exclusão em lote:", error);
      toast.error("Erro ao processar exclusões");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportAll = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      
      const filename = `${table}_completo_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      toast.success(`Todos os ${data.length} itens exportados`);
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar dados");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {selectedIds.length > 0 && (
        <span className="text-sm text-muted-foreground">
          {selectedIds.length} selecionados
        </span>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4 mr-2" />
            Ações em Lote
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ações Selecionadas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleExportSelected}
            disabled={selectedIds.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Selecionados ({selectedIds.length})
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDeleteSelected}
            disabled={selectedIds.length === 0 || isProcessing}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remover Selecionados ({selectedIds.length})
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Todas as Linhas</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportAll}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar Tudo ({data.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

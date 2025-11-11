import { useEffect } from "react";

interface Equipment {
  equipment_name: string;
  rental_company?: string | null;
  maintenance_company?: string | null;
  rental_work_site?: string | null;
  maintenance_work_site?: string | null;
  location_type?: string | null;
}

interface UseEquipmentFormAutofillProps<T> {
  equipment: Equipment | null;
  equipmentCode: string;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
}

/**
 * Hook para preencher automaticamente campos do formulário baseado nos dados do equipamento
 * Prioriza dados de locação sobre dados de manutenção
 */
export const useEquipmentFormAutofill = <T extends { equipment_name: string; company: string; work_site: string }>({
  equipment,
  equipmentCode,
  setFormData,
}: UseEquipmentFormAutofillProps<T>) => {
  useEffect(() => {
    console.log("🔍 Equipment data in autofill:", equipment);
    
    if (equipment) {
      setFormData(prev => ({
        ...prev,
        equipment_name: equipment.equipment_name,
      }));
      
      // Preencher empresa: prioriza rental_company, senão maintenance_company
      if (equipment.rental_company) {
        console.log("✅ Preenchendo empresa de locação:", equipment.rental_company);
        setFormData(prev => ({
          ...prev,
          company: equipment.rental_company || "",
        }));
      } else if (equipment.maintenance_company) {
        console.log("✅ Preenchendo empresa de manutenção:", equipment.maintenance_company);
        setFormData(prev => ({
          ...prev,
          company: equipment.maintenance_company || "",
        }));
      }
      
      // Preencher obra: prioriza rental_work_site, senão maintenance_work_site
      if (equipment.rental_work_site) {
        console.log("✅ Preenchendo obra de locação:", equipment.rental_work_site);
        setFormData(prev => ({
          ...prev,
          work_site: equipment.rental_work_site || "",
        }));
      } else if (equipment.maintenance_work_site) {
        console.log("✅ Preenchendo obra de manutenção:", equipment.maintenance_work_site);
        setFormData(prev => ({
          ...prev,
          work_site: equipment.maintenance_work_site || "",
        }));
      }
    } else if (!equipmentCode) {
      // Limpa os campos se o PAT for apagado
      console.log("🧹 Limpando campos em autofill");
      setFormData(prev => ({
        ...prev,
        equipment_name: "",
        work_site: "",
        company: "",
      }));
    }
  }, [equipment, equipmentCode]);
};

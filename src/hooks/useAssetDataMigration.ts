import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Hook para aplicar migrações automáticas de dados em equipamentos antigos
 * quando há atualizações no sistema
 */
export const useAssetDataMigration = () => {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (user && !migrationComplete && !isMigrating) {
      runMigrations();
    }
  }, [user, migrationComplete, isMigrating]);

  const runMigrations = async () => {
    setIsMigrating(true);

    try {
      // Executar todas as migrações necessárias
      const results = await Promise.all([
        migrateReplacedAssetsWithoutRentalInfo(),
        migrateAssetsWithInconsistentStatus(),
        migrateSubstitutesStuckInAguardandoLaudo(),
      ]);

      const totalMigrated = results.reduce((sum, r) => sum + r.migratedCount, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);
      const allErrors = results.flatMap((r) => r.errors);

      if (totalMigrated > 0) {
        toast.success(
          `Sistema atualizado: ${totalMigrated} equipamento(s) migrado(s) com sucesso`
        );
      }

      if (totalFailed > 0) {
        toast.warning(
          `${totalFailed} equipamento(s) requerem atualização manual`,
          {
            description: "Verifique os equipamentos destacados na lista",
          }
        );
        console.warn("Erros de migração:", allErrors);
      }

      setMigrationComplete(true);
    } catch (error) {
      console.error("Erro ao executar migrações:", error);
      toast.error("Erro ao atualizar sistema. Algumas atualizações podem não ter sido aplicadas.");
    } finally {
      setIsMigrating(false);
    }
  };

  /**
   * MIGRAÇÃO 1: Equipamentos substituídos sem informações de locação
   * Corrige equipamentos que foram substituídos mas não herdaram corretamente
   * as informações de empresa/obra do equipamento antigo
   */
  const migrateReplacedAssetsWithoutRentalInfo = async (): Promise<MigrationResult> => {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Buscar equipamentos que substituíram outros mas não têm info de locação
      const { data: replacementAssets, error: fetchError } = await supabase
        .from("assets")
        .select("id, asset_code, location_type, rental_company, rental_work_site")
        .eq("location_type", "locacao")
        .is("rental_company", null);

      if (fetchError) throw fetchError;
      if (!replacementAssets || replacementAssets.length === 0) return result;

      // Para cada equipamento, verificar se ele substituiu outro
      for (const asset of replacementAssets) {
        try {
          // Buscar o equipamento antigo que este substituiu
          const { data: oldAssets, error: oldError } = await supabase
            .from("assets")
            .select("rental_company, rental_work_site, rental_start_date, rental_end_date, rental_contract_number")
            .eq("replaced_by_asset_id", asset.id)
            .eq("was_replaced", true)
            .maybeSingle();

          if (oldError) throw oldError;
          if (!oldAssets) continue;

          // Se o equipamento antigo tinha informações de locação, copiar para o novo
          if (oldAssets.rental_company && oldAssets.rental_work_site) {
            const { error: updateError } = await supabase
              .from("assets")
              .update({
                rental_company: oldAssets.rental_company,
                rental_work_site: oldAssets.rental_work_site,
                rental_start_date: oldAssets.rental_start_date,
                rental_end_date: oldAssets.rental_end_date,
                rental_contract_number: oldAssets.rental_contract_number,
              })
              .eq("id", asset.id);

            if (updateError) throw updateError;

            result.migratedCount++;
            console.log(`✅ PAT ${asset.asset_code}: Informações de locação restauradas`);
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push(`PAT ${asset.asset_code}: ${error.message}`);
          console.error(`❌ Erro ao migrar PAT ${asset.asset_code}:`, error);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na migração: ${error.message}`);
    }

    return result;
  };

  /**
   * MIGRAÇÃO 2: Equipamentos com status inconsistente
   * Corrige equipamentos que deveriam estar em manutenção mas estão em outro status
   */
  const migrateAssetsWithInconsistentStatus = async (): Promise<MigrationResult> => {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Buscar equipamentos que foram substituídos mas não estão em manutenção
      const { data: inconsistentAssets, error: fetchError } = await supabase
        .from("assets")
        .select("id, asset_code, location_type, was_replaced")
        .eq("was_replaced", true)
        .neq("location_type", "em_manutencao");

      if (fetchError) throw fetchError;
      if (!inconsistentAssets || inconsistentAssets.length === 0) return result;

      // Corrigir o status para manutenção
      for (const asset of inconsistentAssets) {
        try {
          const { error: updateError } = await supabase
            .from("assets")
            .update({
              location_type: "em_manutencao",
            })
            .eq("id", asset.id);

          if (updateError) throw updateError;

          result.migratedCount++;
          console.log(`✅ PAT ${asset.asset_code}: Status corrigido para manutenção`);
        } catch (error) {
          result.failedCount++;
          result.errors.push(`PAT ${asset.asset_code}: ${error.message}`);
          console.error(`❌ Erro ao migrar PAT ${asset.asset_code}:`, error);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na migração: ${error.message}`);
    }

    return result;
  };

  /**
   * MIGRAÇÃO 3: Substitutos presos em "aguardando_laudo"
   * Corrige equipamentos substitutos que deveriam estar em locação
   * mas ficaram em aguardando_laudo após substituição
   */
  const migrateSubstitutesStuckInAguardandoLaudo = async (): Promise<MigrationResult> => {
    const result: MigrationResult = {
      success: true,
      migratedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      // Buscar equipamentos que:
      // 1. Estão em aguardando_laudo
      // 2. NÃO têm dados de locação ainda
      // 3. NÃO foram substituídos (são os substitutos)
      const { data: substituteAssets, error: fetchError } = await supabase
        .from("assets")
        .select("id, asset_code, location_type, rental_company, was_replaced")
        .eq("location_type", "aguardando_laudo")
        .is("rental_company", null)
        .eq("was_replaced", false);

      if (fetchError) throw fetchError;
      if (!substituteAssets || substituteAssets.length === 0) return result;

      // Para cada equipamento, verificar se ele substituiu outro que tinha dados de locação
      for (const substitute of substituteAssets) {
        try {
          // Buscar o equipamento antigo que este substituiu
          const { data: oldAssets, error: oldError } = await supabase
            .from("assets")
            .select("rental_company, rental_work_site, rental_start_date, rental_end_date, rental_contract_number, substitution_date")
            .eq("replaced_by_asset_id", substitute.id)
            .eq("was_replaced", true)
            .maybeSingle();

          if (oldError) throw oldError;
          if (!oldAssets) continue;

          // Se o equipamento antigo tinha informações de locação, o substituto deveria estar em locação
          if (oldAssets.rental_company && oldAssets.rental_work_site) {
            const { error: updateError } = await supabase
              .from("assets")
              .update({
                location_type: "locacao",
                rental_company: oldAssets.rental_company,
                rental_work_site: oldAssets.rental_work_site,
                rental_start_date: oldAssets.substitution_date || oldAssets.rental_start_date,
                rental_end_date: oldAssets.rental_end_date,
                rental_contract_number: oldAssets.rental_contract_number,
              })
              .eq("id", substitute.id);

            if (updateError) throw updateError;

            result.migratedCount++;
            console.log(`✅ PAT ${substitute.asset_code}: Corrigido de aguardando_laudo → locação (${oldAssets.rental_company} - ${oldAssets.rental_work_site})`);
          }
        } catch (error) {
          result.failedCount++;
          result.errors.push(`PAT ${substitute.asset_code}: ${error.message}`);
          console.error(`❌ Erro ao migrar PAT ${substitute.asset_code}:`, error);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Erro geral na migração: ${error.message}`);
    }

    return result;
  };

  return {
    isMigrating,
    migrationComplete,
  };
};

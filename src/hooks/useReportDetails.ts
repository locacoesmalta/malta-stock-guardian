import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useReportDetails = (reportId: string | undefined) => {
  return useQuery({
    queryKey: ["report-details", reportId],
    queryFn: async () => {
      if (!reportId) return null;

      // Buscar relatório
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .is("deleted_at", null)
        .single();

      if (reportError) throw reportError;

      // Buscar peças do relatório com informações de produtos e retiradas
      const { data: parts, error: partsError } = await supabase
        .from("report_parts")
        .select(`
          *,
          products (id, name, code, purchase_price),
          material_withdrawals (id, quantity, equipment_code, withdrawal_date)
        `)
        .eq("report_id", reportId);

      if (partsError) throw partsError;

      // Buscar fotos do relatório
      const { data: photos, error: photosError } = await supabase
        .from("report_photos")
        .select("*")
        .eq("report_id", reportId)
        .order("photo_order");

      if (photosError) throw photosError;

      // Gerar signed URLs para as fotos
      const photosWithUrls = await Promise.all(
        (photos || []).map(async (photo) => {
          const { data: signedUrlData } = await supabase.storage
            .from("report-photos")
            .createSignedUrl(photo.photo_url, 3600);

          return {
            ...photo,
            signed_url: signedUrlData?.signedUrl || photo.photo_url,
          };
        })
      );

      return { 
        report, 
        parts: parts || [], 
        photos: photosWithUrls || [] 
      };
    },
    enabled: !!reportId,
  });
};

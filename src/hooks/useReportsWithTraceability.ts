import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportPartWithTraceability {
  id: string;
  product_id: string;
  quantity_used: number;
  withdrawal_id: string | null;
  products: {
    code: string;
    name: string;
    purchase_price: number | null;
  };
  material_withdrawals: {
    id: string;
    withdrawal_date: string;
    withdrawal_reason: string | null;
    work_site: string;
    company: string;
    withdrawn_by: string;
  } | null;
}

interface ReportWithTraceability {
  id: string;
  report_date: string;
  equipment_code: string;
  equipment_name: string | null;
  work_site: string;
  company: string;
  technician_name: string;
  service_comments: string;
  report_parts: ReportPartWithTraceability[];
  report_photos: Array<{
    photo_url: string;
    photo_comment: string;
    photo_order: number;
    signedUrl?: string;
  }>;
}

interface UseReportsWithTraceabilityOptions {
  startDate?: string;
  endDate?: string;
  equipmentCode?: string;
  searchTerm?: string;
}

export const useReportsWithTraceability = (options?: UseReportsWithTraceabilityOptions) => {
  return useQuery({
    queryKey: ["reports-traceability", options?.startDate, options?.endDate, options?.equipmentCode, options?.searchTerm],
    queryFn: async (): Promise<ReportWithTraceability[]> => {
      let query = supabase
        .from("reports")
        .select(`
          id,
          report_date,
          equipment_code,
          equipment_name,
          work_site,
          company,
          technician_name,
          service_comments,
          report_parts(
            id,
            product_id,
            quantity_used,
            withdrawal_id,
            products(code, name, purchase_price),
            material_withdrawals(
              id,
              withdrawal_date,
              withdrawal_reason,
              work_site,
              company,
              withdrawn_by
            )
          ),
          report_photos(photo_url, photo_comment, photo_order)
        `)
        .is("deleted_at", null)
        .order("report_date", { ascending: false });

      // Filtro por data inicial
      if (options?.startDate) {
        query = query.gte("report_date", options.startDate);
      }

      // Filtro por data final
      if (options?.endDate) {
        query = query.lte("report_date", options.endDate);
      }

      // Filtro por PAT
      if (options?.equipmentCode) {
        query = query.ilike("equipment_code", `%${options.equipmentCode}%`);
      }

      // Filtro por busca geral
      if (options?.searchTerm) {
        query = query.or(
          `equipment_code.ilike.%${options.searchTerm}%,` +
          `technician_name.ilike.%${options.searchTerm}%,` +
          `work_site.ilike.%${options.searchTerm}%,` +
          `company.ilike.%${options.searchTerm}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar relatórios com rastreabilidade:", error);
        throw error;
      }

      // Gerar URLs assinadas para fotos
      const reportsWithSignedUrls = await Promise.all(
        (data || []).map(async (report) => {
          const photosWithSignedUrls = await Promise.all(
            report.report_photos.map(async (photo) => {
              try {
                const { data: signedData } = await supabase.storage
                  .from('report-photos')
                  .createSignedUrl(photo.photo_url, 3600);
                
                return {
                  ...photo,
                  signedUrl: signedData?.signedUrl || photo.photo_url
                };
              } catch (err) {
                console.error('Error generating signed URL:', err);
                return { ...photo, signedUrl: photo.photo_url };
              }
            })
          );
          
          return {
            ...report,
            report_photos: photosWithSignedUrls
          };
        })
      );

      return reportsWithSignedUrls;
    },
  });
};

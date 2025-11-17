-- 1. Remover constraint que limita photo_order a 6 fotos
ALTER TABLE report_photos 
DROP CONSTRAINT IF EXISTS report_photos_photo_order_check;

-- Adicionar nova constraint: photo_order >= 1 (sem limite superior)
ALTER TABLE report_photos 
ADD CONSTRAINT report_photos_photo_order_check 
CHECK (photo_order >= 1);

-- 2. Modificar policy de INSERT em report_parts para permitir edição
DROP POLICY IF EXISTS "Authenticated users with permission can create report parts" 
ON report_parts;

CREATE POLICY "Users can insert report parts when creating or editing"
ON report_parts FOR INSERT
WITH CHECK (
  can_user_create_reports(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_parts.report_id 
    AND (
      reports.created_by = auth.uid() OR
      can_user_edit_reports(auth.uid())
    )
    AND reports.deleted_at IS NULL
  )
);

-- 3. Modificar policy de INSERT em report_photos para permitir edição
DROP POLICY IF EXISTS "Authenticated users with permission can insert report photos" 
ON report_photos;

CREATE POLICY "Users can insert report photos when creating or editing"
ON report_photos FOR INSERT
WITH CHECK (
  can_user_create_reports(auth.uid()) AND 
  EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_photos.report_id 
    AND (
      reports.created_by = auth.uid() OR
      can_user_edit_reports(auth.uid())
    )
    AND reports.deleted_at IS NULL
  )
);
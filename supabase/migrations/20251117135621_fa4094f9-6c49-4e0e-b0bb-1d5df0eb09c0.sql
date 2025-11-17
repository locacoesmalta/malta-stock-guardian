-- ✅ Permitir UPDATE em report_parts
CREATE POLICY "Users can update report parts"
ON report_parts
FOR UPDATE
TO authenticated
USING (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_parts.report_id 
    AND reports.deleted_at IS NULL
  )
)
WITH CHECK (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_parts.report_id 
    AND reports.deleted_at IS NULL
  )
);

-- ✅ Permitir DELETE em report_parts
CREATE POLICY "Users can delete report parts"
ON report_parts
FOR DELETE
TO authenticated
USING (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_parts.report_id 
    AND reports.deleted_at IS NULL
  )
);

-- ✅ Permitir UPDATE em report_photos
CREATE POLICY "Users can update report photos"
ON report_photos
FOR UPDATE
TO authenticated
USING (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_photos.report_id 
    AND reports.deleted_at IS NULL
  )
)
WITH CHECK (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_photos.report_id 
    AND reports.deleted_at IS NULL
  )
);

-- ✅ Permitir DELETE em report_photos
CREATE POLICY "Users can delete report photos"
ON report_photos
FOR DELETE
TO authenticated
USING (
  can_user_edit_reports(auth.uid()) 
  AND EXISTS (
    SELECT 1 FROM reports 
    WHERE reports.id = report_photos.report_id 
    AND reports.deleted_at IS NULL
  )
);
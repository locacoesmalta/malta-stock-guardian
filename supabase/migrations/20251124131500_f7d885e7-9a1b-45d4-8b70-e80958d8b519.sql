-- Função para reabrir problemas de integridade (marcar como pendente)
CREATE OR REPLACE FUNCTION public.mark_integrity_problem_pending(
  p_problem_type text,
  p_problem_identifier text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_resolution_id UUID;
BEGIN
  -- Check if system owner
  IF NOT is_system_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only system owner can reopen problems';
  END IF;

  -- Update resolution to pending status
  UPDATE public.system_integrity_resolutions
  SET 
    status = 'pending',
    updated_at = now()
  WHERE problem_type = p_problem_type
    AND problem_identifier = p_problem_identifier
  RETURNING id INTO v_resolution_id;

  RETURN v_resolution_id;
END;
$function$;
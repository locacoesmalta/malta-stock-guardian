-- Fix security warnings: Add search_path to functions
CREATE OR REPLACE FUNCTION mark_integrity_problem_resolved(
  p_problem_type TEXT,
  p_problem_identifier TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_resolution_id UUID;
BEGIN
  -- Check if system owner
  IF NOT is_system_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only system owner can resolve problems';
  END IF;

  -- Insert or update resolution
  INSERT INTO public.system_integrity_resolutions (
    problem_type,
    problem_identifier,
    status,
    resolved_by,
    resolved_at,
    resolution_notes
  ) VALUES (
    p_problem_type,
    p_problem_identifier,
    'resolved',
    auth.uid(),
    now(),
    p_notes
  )
  ON CONFLICT (problem_type, problem_identifier)
  DO UPDATE SET
    status = 'resolved',
    resolved_by = auth.uid(),
    resolved_at = now(),
    resolution_notes = p_notes,
    updated_at = now()
  RETURNING id INTO v_resolution_id;

  RETURN v_resolution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION mark_integrity_problem_ignored(
  p_problem_type TEXT,
  p_problem_identifier TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_resolution_id UUID;
BEGIN
  -- Check if system owner
  IF NOT is_system_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only system owner can ignore problems';
  END IF;

  -- Insert or update resolution
  INSERT INTO public.system_integrity_resolutions (
    problem_type,
    problem_identifier,
    status,
    resolved_by,
    resolved_at,
    resolution_notes
  ) VALUES (
    p_problem_type,
    p_problem_identifier,
    'ignored',
    auth.uid(),
    now(),
    p_notes
  )
  ON CONFLICT (problem_type, problem_identifier)
  DO UPDATE SET
    status = 'ignored',
    resolved_by = auth.uid(),
    resolved_at = now(),
    resolution_notes = p_notes,
    updated_at = now()
  RETURNING id INTO v_resolution_id;

  RETURN v_resolution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION mark_integrity_problem_pending(
  p_problem_type TEXT,
  p_problem_identifier TEXT
)
RETURNS UUID AS $$
DECLARE
  v_resolution_id UUID;
BEGIN
  -- Check if system owner
  IF NOT is_system_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only system owner can reopen problems';
  END IF;

  -- Update resolution
  UPDATE public.system_integrity_resolutions
  SET
    status = 'pending',
    resolved_by = NULL,
    resolved_at = NULL,
    updated_at = now()
  WHERE problem_type = p_problem_type
    AND problem_identifier = p_problem_identifier
  RETURNING id INTO v_resolution_id;

  RETURN v_resolution_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
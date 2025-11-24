-- Create table to track system integrity problem resolutions
CREATE TABLE IF NOT EXISTS public.system_integrity_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_type TEXT NOT NULL, -- 'product', 'session', 'audit', 'asset', etc.
  problem_identifier TEXT NOT NULL, -- unique identifier for the problem (e.g., product_id, session combo)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'resolved', 'ignored'
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  priority TEXT DEFAULT 'medium', -- 'critical', 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'resolved', 'ignored')),
  CONSTRAINT valid_priority CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  UNIQUE(problem_type, problem_identifier)
);

-- Enable RLS
ALTER TABLE public.system_integrity_resolutions ENABLE ROW LEVEL SECURITY;

-- Only system owner can view resolutions
CREATE POLICY "Only system owner can view resolutions"
ON public.system_integrity_resolutions
FOR SELECT
USING (is_system_owner(auth.uid()));

-- Only system owner can insert resolutions
CREATE POLICY "Only system owner can insert resolutions"
ON public.system_integrity_resolutions
FOR INSERT
WITH CHECK (is_system_owner(auth.uid()) AND resolved_by = auth.uid());

-- Only system owner can update resolutions
CREATE POLICY "Only system owner can update resolutions"
ON public.system_integrity_resolutions
FOR UPDATE
USING (is_system_owner(auth.uid()));

-- Only system owner can delete resolutions
CREATE POLICY "Only system owner can delete resolutions"
ON public.system_integrity_resolutions
FOR DELETE
USING (is_system_owner(auth.uid()));

-- Create indices for performance
CREATE INDEX idx_resolutions_status ON public.system_integrity_resolutions(status);
CREATE INDEX idx_resolutions_type ON public.system_integrity_resolutions(problem_type);
CREATE INDEX idx_resolutions_priority ON public.system_integrity_resolutions(priority);
CREATE INDEX idx_resolutions_created_at ON public.system_integrity_resolutions(created_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_integrity_resolutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_integrity_resolutions_updated_at
BEFORE UPDATE ON public.system_integrity_resolutions
FOR EACH ROW
EXECUTE FUNCTION update_system_integrity_resolutions_updated_at();

-- Function to mark problem as resolved
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark problem as ignored
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark problem as pending (reopen)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
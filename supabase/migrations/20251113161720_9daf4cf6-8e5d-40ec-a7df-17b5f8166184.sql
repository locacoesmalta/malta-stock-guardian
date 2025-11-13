-- Completar políticas RLS para dados financeiros
-- (As políticas foram criadas parcialmente antes, completando agora)

-- Políticas para cash_boxes
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can view cash boxes" ON public.cash_boxes;
  CREATE POLICY "Only users with financial permission can view cash boxes"
  ON public.cash_boxes FOR SELECT
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can create cash boxes" ON public.cash_boxes;
  CREATE POLICY "Only users with financial permission can create cash boxes"
  ON public.cash_boxes FOR INSERT
  TO authenticated
  WITH CHECK (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can update cash boxes" ON public.cash_boxes;
  CREATE POLICY "Only users with financial permission can update cash boxes"
  ON public.cash_boxes FOR UPDATE
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can delete cash boxes" ON public.cash_boxes;
  CREATE POLICY "Only users with financial permission can delete cash boxes"
  ON public.cash_boxes FOR DELETE
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Políticas para cash_box_transactions
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can view transactions" ON public.cash_box_transactions;
  CREATE POLICY "Only users with financial permission can view transactions"
  ON public.cash_box_transactions FOR SELECT
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can create transactions" ON public.cash_box_transactions;
  CREATE POLICY "Only users with financial permission can create transactions"
  ON public.cash_box_transactions FOR INSERT
  TO authenticated
  WITH CHECK (can_user_view_financial_data(auth.uid()) AND auth.uid() = created_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can update transactions" ON public.cash_box_transactions;
  CREATE POLICY "Only users with financial permission can update transactions"
  ON public.cash_box_transactions FOR UPDATE
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Only users with financial permission can delete transactions" ON public.cash_box_transactions;
  CREATE POLICY "Only users with financial permission can delete transactions"
  ON public.cash_box_transactions FOR DELETE
  TO authenticated
  USING (can_user_view_financial_data(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
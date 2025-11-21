-- ============================================
-- FASE 1: EXPANSÃO DE VALIDAÇÕES DE INTEGRIDADE
-- ============================================

-- 1. RECRIAR check_withdrawals_integrity COM VALIDAÇÕES EXPANDIDAS
DROP FUNCTION IF EXISTS check_withdrawals_integrity();

CREATE OR REPLACE FUNCTION check_withdrawals_integrity()
RETURNS TABLE(
  withdrawal_id uuid,
  product_code text,
  product_name text,
  equipment_code text,
  quantity integer,
  withdrawal_date date,
  issue_type text,
  details text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  
  -- 1. VALIDAÇÃO: Quantidade inválida (<=0)
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Quantidade inválida'::text,
    format('Retirada com quantidade %s (deve ser > 0)', mw.quantity)::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  WHERE mw.quantity <= 0
  
  UNION ALL
  
  -- 2. VALIDAÇÃO: Produto órfão (produto deletado mas retirada ativa)
  SELECT 
    mw.id,
    COALESCE(p.code, 'PRODUTO DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Produto órfão'::text,
    'Retirada vinculada a produto deletado ou inexistente'::text
  FROM material_withdrawals mw
  LEFT JOIN products p ON p.id = mw.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- 3. VALIDAÇÃO: Equipamento órfão (PAT deletado mas retirada ativa)
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Equipamento órfão'::text,
    format('PAT %s não encontrado ou deletado no sistema', mw.equipment_code)::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  LEFT JOIN assets a ON a.asset_code = mw.equipment_code AND a.deleted_at IS NULL
  WHERE a.id IS NULL 
    AND mw.equipment_code IS NOT NULL 
    AND mw.equipment_code != ''
  
  UNION ALL
  
  -- 4. VALIDAÇÃO: Retirada sem lifecycle_cycle quando deveria ter
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Ciclo de vida ausente'::text,
    'Retirada sem lifecycle_cycle definido (pode causar problemas de rastreabilidade)'::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  WHERE mw.lifecycle_cycle IS NULL
    AND mw.equipment_code IS NOT NULL
    AND mw.equipment_code != ''
  
  UNION ALL
  
  -- 5. VALIDAÇÃO: Retirada vinculada a relatório deletado
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Relatório órfão'::text,
    format('Retirada marcada como usada no relatório %s que foi deletado', mw.used_in_report_id)::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  LEFT JOIN reports r ON r.id = mw.used_in_report_id
  WHERE mw.used_in_report_id IS NOT NULL 
    AND (r.id IS NULL OR r.deleted_at IS NOT NULL)
  
  UNION ALL
  
  -- 6. VALIDAÇÃO: Colaboradores órfãos (retirada sem colaboradores cadastrados)
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Colaboradores ausentes'::text,
    'Retirada sem colaboradores cadastrados (rastreabilidade comprometida)'::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  WHERE NOT EXISTS (
    SELECT 1 FROM material_withdrawal_collaborators mwc 
    WHERE mwc.withdrawal_id = mw.id
  )
  
  UNION ALL
  
  -- 7. VALIDAÇÃO: Retirada arquivada mas ainda marcada como não usada
  SELECT 
    mw.id,
    p.code,
    p.name,
    mw.equipment_code,
    mw.quantity,
    mw.withdrawal_date,
    'Estado inconsistente'::text,
    'Retirada arquivada mas sem relatório vinculado (deveria ter usado ou não estar arquivada)'::text
  FROM material_withdrawals mw
  INNER JOIN products p ON p.id = mw.product_id
  WHERE mw.is_archived = true 
    AND mw.used_in_report_id IS NULL
  
  ORDER BY withdrawal_date DESC;
END;
$$;

-- 2. CRIAR FUNÇÃO PARA VALIDAR PRODUTOS EM GERAL
CREATE OR REPLACE FUNCTION check_products_orphan_references()
RETURNS TABLE(
  reference_type text,
  reference_id uuid,
  product_code text,
  product_name text,
  issue_type text,
  details text
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  
  -- 1. Retiradas com produtos órfãos
  SELECT 
    'material_withdrawal'::text,
    mw.id,
    COALESCE(p.code, 'DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    'Produto órfão em retirada'::text,
    format('Retirada do PAT %s referencia produto inexistente ou deletado', mw.equipment_code)::text
  FROM material_withdrawals mw
  LEFT JOIN products p ON p.id = mw.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- 2. Relatórios com produtos órfãos
  SELECT 
    'report_part'::text,
    rp.id,
    COALESCE(p.code, 'DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    'Produto órfão em relatório'::text,
    format('Relatório referencia produto inexistente ou deletado')::text
  FROM report_parts rp
  LEFT JOIN products p ON p.id = rp.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- 3. Peças de mobilização com produtos órfãos
  SELECT 
    'asset_mobilization_part'::text,
    amp.id,
    COALESCE(p.code, 'DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    'Produto órfão em mobilização'::text,
    'Peça de mobilização referencia produto inexistente ou deletado'::text
  FROM asset_mobilization_parts amp
  LEFT JOIN products p ON p.id = amp.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- 4. Peças de manutenção com produtos órfãos
  SELECT 
    'asset_maintenance_part'::text,
    amp.id,
    COALESCE(p.code, 'DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    'Produto órfão em manutenção'::text,
    'Peça de manutenção referencia produto inexistente ou deletado'::text
  FROM asset_maintenance_parts amp
  LEFT JOIN products p ON p.id = amp.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL
  
  UNION ALL
  
  -- 5. Peças reserva com produtos órfãos
  SELECT 
    'asset_spare_part'::text,
    asp.id,
    COALESCE(p.code, 'DELETADO'),
    COALESCE(p.name, 'Produto não encontrado'),
    'Produto órfão em peças reserva'::text,
    'Peça reserva referencia produto inexistente ou deletado'::text
  FROM asset_spare_parts asp
  LEFT JOIN products p ON p.id = asp.product_id
  WHERE p.id IS NULL OR p.deleted_at IS NOT NULL;
END;
$$;

-- 3. ADICIONAR COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION check_withdrawals_integrity() IS 
'FASE 1: Validação expandida de retiradas incluindo:
- Quantidades inválidas
- Produtos órfãos (deletados)
- Equipamentos órfãos (PAT deletado)
- Ciclos de vida ausentes
- Relatórios órfãos
- Colaboradores ausentes
- Estados inconsistentes (arquivado sem uso)';

COMMENT ON FUNCTION check_products_orphan_references() IS
'FASE 1: Valida referências órfãs de produtos em todo o sistema:
- Retiradas de material
- Partes de relatórios
- Peças de mobilização
- Peças de manutenção
- Peças reserva';
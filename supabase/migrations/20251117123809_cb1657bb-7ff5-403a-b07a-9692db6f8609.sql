-- Inserir produto especial "Produto Não Catalogado"
-- Este produto não controla estoque (quantity = -1) e permite descrições customizadas

INSERT INTO products (
  id,
  code,
  name,
  quantity,
  min_quantity,
  manufacturer,
  comments,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'NAO-CATALOGADO',
  'Produto Não Catalogado',
  -1,
  0,
  'Sistema',
  'Produto especial para itens ainda não cadastrados no sistema. Não controla estoque. A descrição do produto deve ser informada no campo withdrawal_reason da retirada.',
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;
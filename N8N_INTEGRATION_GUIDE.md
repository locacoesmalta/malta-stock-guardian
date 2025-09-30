# Guia de Integração N8N

## 📋 Informações da API

**URL Base:** `https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api`

**Autenticação:** Todas as requisições devem incluir o header:
```
x-api-key: [SUA_API_KEY_CONFIGURADA]
```

---

## 🔌 Endpoints Disponíveis

### 1. Listar Produtos
**Endpoint:** `GET /products`

**Parâmetros de Query:**
- `search` (opcional) - Busca por nome ou código
- `min_stock` (opcional) - Filtrar produtos com estoque mínimo
- `low_stock` (opcional) - `true` para produtos com estoque baixo

**Exemplo de Requisição:**
```
GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/products?search=parafuso&low_stock=true
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PROD001",
      "name": "Parafuso M10",
      "quantity": 15,
      "min_quantity": 20,
      "purchase_price": 2.50,
      "sale_price": 5.00
    }
  ],
  "count": 1
}
```

---

### 2. Buscar Produto Específico
**Endpoint:** `GET /product-{id}`

**Exemplo:**
```
GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/product-123e4567-e89b-12d3-a456-426614174000
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "code": "PROD001",
    "name": "Parafuso M10",
    "quantity": 15,
    "min_quantity": 20
  }
}
```

---

### 3. Produtos com Estoque Baixo
**Endpoint:** `GET /low-stock`

**Exemplo:**
```
GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/low-stock
```

**Resposta:**
```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "critical": 2
}
```

---

### 4. Histórico de Retiradas
**Endpoint:** `GET /withdrawals`

**Parâmetros de Query:**
- `work_site` (opcional) - Filtrar por obra
- `company` (opcional) - Filtrar por empresa
- `equipment_code` (opcional) - Filtrar por código de equipamento (PAT)
- `product_id` (opcional) - Filtrar por produto específico
- `start_date` (opcional) - Data inicial (YYYY-MM-DD)
- `end_date` (opcional) - Data final (YYYY-MM-DD)
- `limit` (opcional) - Limite de resultados (padrão: 100)

**Exemplo:**
```
GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/withdrawals?company=Malta&start_date=2025-01-01&limit=50
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "product_id": "uuid",
      "quantity": 10,
      "work_site": "Obra Centro",
      "company": "Malta Locações",
      "equipment_code": "PAT12345",
      "withdrawal_date": "2025-01-15",
      "withdrawal_reason": "Manutenção",
      "products": {
        "id": "uuid",
        "code": "PROD001",
        "name": "Parafuso M10"
      },
      "profiles": {
        "full_name": "João Silva",
        "email": "joao@example.com"
      }
    }
  ],
  "count": 1
}
```

---

### 5. Resumo de Estoque
**Endpoint:** `GET /stock-summary`

**Exemplo:**
```
GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/stock-summary
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_products": 150,
    "total_stock_value": 25000.50,
    "low_stock_count": 12,
    "out_of_stock_count": 3,
    "healthy_stock_count": 135
  }
}
```

---

## 🔧 Configuração no N8N

### Passo 1: Criar Workflow
1. Crie um novo workflow no N8N
2. Adicione um nó **"HTTP Request"**

### Passo 2: Configurar HTTP Request
**Configurações básicas:**
- **Method:** GET
- **URL:** Cole a URL do endpoint desejado
- **Authentication:** None

**Headers:**
- **Name:** `x-api-key`
- **Value:** [SUA_API_KEY_CONFIGURADA]

### Passo 3: Testar
Execute o workflow para testar a conexão.

---

## 💡 Casos de Uso Comuns

### Alerta de Estoque Baixo
Configure um workflow agendado que:
1. Chama `/low-stock` a cada 6 horas
2. Se `count > 0`, envia email/notificação
3. Lista os produtos críticos

### Relatório Diário de Retiradas
Workflow agendado que:
1. Chama `/withdrawals` com data do dia anterior
2. Gera relatório em Excel/PDF
3. Envia por email

### Sincronização com ERP
Workflow que:
1. Chama `/products` periodicamente
2. Sincroniza dados com sistema externo
3. Atualiza preços/estoque

### Dashboard em Tempo Real
Workflow que:
1. Chama `/stock-summary`
2. Envia dados para Google Sheets
3. Atualiza dashboard automaticamente

---

## 🔒 Segurança

- A API key é obrigatória para todas as requisições
- Use HTTPS sempre
- Mantenha a API key secreta
- Configure Rate Limiting no N8N se necessário

---

## ⚠️ Tratamento de Erros

**401 Unauthorized:**
```json
{
  "error": "Unauthorized - Invalid API Key"
}
```

**404 Not Found:**
```json
{
  "error": "Endpoint not found",
  "available_endpoints": [...]
}
```

**500 Internal Server Error:**
```json
{
  "error": "Error message"
}
```

---

## 📞 Suporte

Para dúvidas ou problemas, verifique:
1. Se a API key está correta
2. Se a URL está completa e correta
3. Se os parâmetros estão no formato correto
4. Os logs da edge function no backend

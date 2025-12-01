# Configuração do Relatório Diário Automático

## 📋 Resumo
Relatório automático de equipamentos disponíveis para locação enviado diariamente às **7h da manhã** via WhatsApp.

---

## ✅ Implementação Completa

### 1. Endpoint API
**URL:** `GET https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/daily-report`

**Headers necessários:**
```
x-api-key: [SUA_N8N_API_KEY]
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "report_type": "daily_availability",
    "report_date": "2025-12-01T10:00:00Z",
    "phone": "+5591996280080",
    "summary": {
      "total": 527,
      "deposito_malta": 403,
      "locacao": 118,
      "em_manutencao": 4,
      "aguardando_laudo": 2
    },
    "total_equipment": 403,
    "total_types": 71,
    "available_equipment": [
      { "name": "BETONEIRA 400L", "quantity": 5 },
      { "name": "MARTELETE 23 KG", "quantity": 31 }
    ]
  }
}
```

---

### 2. Agendamento Automático (pg_cron)
**Horário:** Todos os dias às **10:00 UTC** (07:00 BRT)

**Job configurado:**
- Nome: `daily-equipment-report`
- Função SQL: `send_daily_equipment_report()`
- Webhook: `https://webhook.7arrows.pro/webhook/diamalta`

**Status:** ✅ **ATIVO E CONFIGURADO**

---

### 3. Dados Enviados ao Webhook

O webhook N8N recebe o seguinte payload JSON:

```json
{
  "report_type": "daily_availability",
  "report_date": "2025-12-01T10:00:00.000Z",
  "phone": "+5591996280080",
  "summary": {
    "total": 527,
    "deposito_malta": 403,
    "locacao": 118,
    "em_manutencao": 4,
    "aguardando_laudo": 2
  },
  "total_equipment": 403,
  "total_types": 71,
  "available_equipment": [
    { "name": "BETONEIRA 400L", "quantity": 5 },
    { "name": "COMPACTADOR DE SOLO", "quantity": 12 },
    { "name": "GERADOR 9000 KVA", "quantity": 23 },
    { "name": "MARTELETE 23 KG", "quantity": 31 }
  ]
}
```

---

## 🔧 Workflow N8N Sugerido

### Estrutura do Workflow

```
[Webhook Trigger: diamalta]
        ↓
[Code: Formatar Mensagem WhatsApp]
        ↓
[WhatsApp Business Cloud: Enviar Mensagem]
```

### Node 1: Webhook Trigger
- **URL:** `https://webhook.7arrows.pro/webhook/diamalta`
- **Method:** POST
- **Authentication:** None (público, mas único)

### Node 2: Code (Formatar Mensagem)
```javascript
// Receber dados do webhook
const data = $json;

// Montar mensagem formatada
let message = `📋 *RELATÓRIO DIÁRIO - EQUIPAMENTOS DISPONÍVEIS*\n`;
message += `📅 ${new Date(data.report_date).toLocaleDateString('pt-BR')} às 07:00\n\n`;

message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
message += `📊 *RESUMO GERAL*\n`;
message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

message += `✅ Depósito Malta: ${data.summary.deposito_malta} unidades\n`;
message += `🔧 Em Manutenção: ${data.summary.em_manutencao} unidades\n`;
message += `📦 Em Locação: ${data.summary.locacao} unidades\n`;
message += `⏳ Aguardando Laudo: ${data.summary.aguardando_laudo} unidades\n`;
message += `📍 Total no Sistema: ${data.summary.total} unidades\n\n`;

message += `━━━━━━━━━━━━━━━━━━━━━━\n`;
message += `🏗️ *EQUIPAMENTOS DISPONÍVEIS PARA LOCAÇÃO*\n`;
message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

// Adicionar cada tipo de equipamento
data.available_equipment.forEach(eq => {
  message += `${eq.name} - ${eq.quantity} unidades\n`;
});

message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
message += `Total de tipos disponíveis: ${data.total_types}\n`;
message += `Total de unidades: ${data.total_equipment}\n`;

return { phone: data.phone, message };
```

### Node 3: WhatsApp Business Cloud
- **Phone Number:** `{{$json.phone}}`
- **Message:** `{{$json.message}}`
- **Type:** Text Message

---

## 🧪 Como Testar

### Teste Manual do Endpoint
```bash
curl -X GET \
  'https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/daily-report' \
  -H 'x-api-key: SUA_N8N_API_KEY'
```

### Teste Manual do Webhook N8N
```bash
curl -X POST \
  'https://webhook.7arrows.pro/webhook/diamalta' \
  -H 'Content-Type: application/json' \
  -d '{
    "report_type": "daily_availability",
    "phone": "+5591996280080",
    "total_equipment": 403,
    "available_equipment": [
      {"name": "BETONEIRA 400L", "quantity": 5}
    ]
  }'
```

### Teste Manual da Função SQL
```sql
-- Executar função manualmente para teste
SELECT send_daily_equipment_report();
```

---

## 📊 Exemplo de Mensagem WhatsApp

```
📋 *RELATÓRIO DIÁRIO - EQUIPAMENTOS DISPONÍVEIS*
📅 01/12/2025 às 07:00

━━━━━━━━━━━━━━━━━━━━━━
📊 *RESUMO GERAL*
━━━━━━━━━━━━━━━━━━━━━━

✅ Depósito Malta: 403 unidades
🔧 Em Manutenção: 4 unidades
📦 Em Locação: 118 unidades
⏳ Aguardando Laudo: 2 unidades
📍 Total no Sistema: 527 unidades

━━━━━━━━━━━━━━━━━━━━━━
🏗️ *EQUIPAMENTOS DISPONÍVEIS PARA LOCAÇÃO*
━━━━━━━━━━━━━━━━━━━━━━

BETONEIRA 400L - 5 unidades
COMPACTADOR DE SOLO - 12 unidades
GERADOR 9000 KVA - 23 unidades
MARTELETE 23 KG - 31 unidades
... (todos os 71 tipos)

━━━━━━━━━━━━━━━━━━━━━━
Total de tipos disponíveis: 71
Total de unidades: 403
```

---

## 🎯 Alterações Futuras

### Para enviar para um grupo do WhatsApp:
No N8N, altere o campo **Phone Number** para o ID do grupo:
```
120363123456789012@g.us
```

### Para alterar o horário:
Editar o cron schedule no SQL:
```sql
-- Alterar horário (exemplo: 8h = 11:00 UTC)
SELECT cron.unschedule('daily-equipment-report');
SELECT cron.schedule(
  'daily-equipment-report',
  '0 11 * * *',  -- 8h BRT
  'SELECT send_daily_equipment_report();'
);
```

---

## 🔍 Monitoramento

### Ver logs do cron job:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'daily-equipment-report')
ORDER BY start_time DESC 
LIMIT 10;
```

### Ver status do job:
```sql
SELECT * FROM cron.job WHERE jobname = 'daily-equipment-report';
```

---

## ✅ Checklist de Implementação

- [x] Endpoint GET /daily-report criado na edge function n8n-api
- [x] Função SQL send_daily_equipment_report() criada
- [x] pg_cron job agendado para 10:00 UTC (07:00 BRT)
- [x] Documentação atualizada (N8N_INTEGRATION_GUIDE.md)
- [x] Webhook URL configurada: https://webhook.7arrows.pro/webhook/diamalta
- [ ] **Workflow N8N configurado e testado** ⚠️ (próximo passo)
- [ ] **Teste de envio real no WhatsApp** ⚠️ (próximo passo)

---

## 📞 Próximos Passos

1. **Configurar o workflow no N8N** usando a estrutura sugerida acima
2. **Testar o envio manual** executando `SELECT send_daily_equipment_report();`
3. **Verificar recebimento no WhatsApp** (+5591996280080)
4. **Aguardar o envio automático** amanhã às 7h para confirmar funcionamento
5. **Migrar para grupo** quando estiver funcionando perfeitamente

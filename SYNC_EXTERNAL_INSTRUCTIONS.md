# 🔄 Guia de Sincronização com Supabase Externo

## ✅ Status da Implementação

A infraestrutura de sincronização foi criada com sucesso:

- ✅ **Secrets configurados**: `EXTERNAL_SUPABASE_URL` e `EXTERNAL_SUPABASE_SERVICE_KEY`
- ✅ **Edge Function criada**: `sync-to-external` com 4 endpoints
- ✅ **Script SQL gerado**: `EXTERNAL_SUPABASE_SETUP.sql` (39 tabelas)

---

## 📋 Próximos Passos

### 1️⃣ Executar o Script SQL no Supabase Externo

1. Acesse o **SQL Editor** do seu Supabase externo:
   ```
   https://supabase.com/dashboard/project/anajebsgyafthwjrbhhc/sql
   ```

2. Abra o arquivo `EXTERNAL_SUPABASE_SETUP.sql` deste projeto

3. Copie **todo o conteúdo** do arquivo e cole no SQL Editor

4. Clique em **"Run"** para executar

5. Aguarde a confirmação: **"Success. No rows returned"**

✅ Isso criará todas as 39 tabelas no banco externo (sem dados ainda)

---

### 2️⃣ Executar Sincronização Inicial

Após criar as tabelas, execute a sincronização completa:

#### Opção A: Via Curl (Terminal)
```bash
curl -X POST https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/full
```

#### Opção B: Via Postman/Insomnia
```
POST https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/full
Headers: (nenhum necessário)
Body: (vazio)
```

#### Opção C: Via JavaScript (Console do Navegador)
```javascript
fetch('https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/full', {
  method: 'POST'
})
.then(res => res.json())
.then(data => console.log('Sincronização completa:', data))
```

**⏱️ Tempo esperado**: 2-5 minutos (dependendo da quantidade de dados)

**📊 Resposta esperada**:
```json
{
  "success": true,
  "message": "Sincronização completa: 39/39 tabelas",
  "total_records_synced": 15000,
  "total_duration_ms": 120000,
  "tables": [
    {
      "table": "profiles",
      "records_synced": 25,
      "success": true,
      "duration_ms": 1200
    },
    ...
  ]
}
```

---

## 🔧 Endpoints Disponíveis

### 1. **Sincronização Completa** (use este primeiro)
```
POST /sync-to-external/full
```
Sincroniza todas as 39 tabelas na ordem correta de dependências.

---

### 2. **Sincronizar Tabela Específica**
```
POST /sync-to-external/table/:nome_tabela
```

Exemplo:
```bash
curl -X POST https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/table/products
```

---

### 3. **Status da Sincronização**
```
GET /sync-to-external/status
```

Mostra contagem de registros em ambos os bancos:
```bash
curl https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/status
```

---

### 4. **Sincronização Incremental** (para atualizações futuras)
```
POST /sync-to-external/incremental
Body: { "since": "2025-01-15T00:00:00Z" }
```

Sincroniza apenas dados novos/alterados desde a data especificada:
```bash
curl -X POST https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/incremental \
  -H "Content-Type: application/json" \
  -d '{"since": "2025-01-15T00:00:00Z"}'
```

---

## 📊 Ordem de Sincronização (39 tabelas)

A sincronização completa respeita esta ordem de dependências:

### 1. **Tabelas Base** (sem FK)
- profiles
- equipment_rental_catalog

### 2. **Usuários**
- user_roles
- user_permissions
- user_presence

### 3. **Produtos**
- products
- product_purchases
- product_stock_adjustments

### 4. **Empresas de Locação**
- rental_companies

### 5. **Equipamentos (Assets)**
- assets
- asset_collaborators
- asset_lifecycle_history
- asset_maintenances
- asset_maintenance_parts
- asset_mobilization_expenses
- asset_mobilization_parts
- asset_spare_parts

### 6. **Recibos**
- equipment_receipts
- equipment_receipt_items

### 7. **Locação de Equipamentos**
- rental_equipment

### 8. **Relatórios de Avarias**
- reports
- report_parts
- report_photos
- report_external_services

### 9. **Retiradas de Material**
- material_withdrawals
- material_withdrawal_collaborators

### 10. **Chat**
- conversations
- conversation_participants
- chat_groups
- group_permissions
- messages

### 11. **Financeiro**
- cash_boxes
- cash_box_transactions

### 12. **Auditoria** (sempre por último)
- patrimonio_historico
- audit_logs
- error_logs
- receipt_access_logs
- system_integrity_resolutions

---

## 🔐 Segurança

- ✅ Os secrets estão armazenados de forma segura no Lovable Cloud
- ✅ A edge function usa Service Role Key para acesso total
- ✅ Não há autenticação JWT necessária (função interna do sistema)
- ⚠️ **IMPORTANTE**: Não exponha a URL da edge function publicamente

---

## 📈 Monitoramento e Logs

Para monitorar a sincronização em tempo real:

1. Acesse os **Edge Function Logs** no Lovable:
   ```
   Settings → Integrations → Lovable Cloud → View Logs
   ```

2. Filtre por `sync-to-external` para ver os logs detalhados

3. Cada tabela sincronizada exibe:
   - Nome da tabela
   - Quantidade de registros
   - Tempo de execução
   - Status (sucesso/erro)

---

## ❗ Troubleshooting

### Erro: "Error fetching data from table X"
- **Causa**: Tabela não existe no banco interno
- **Solução**: Verifique se a tabela foi criada corretamente

### Erro: "Error inserting data into table X"
- **Causa**: Estrutura da tabela no banco externo difere do interno
- **Solução**: Re-execute o script SQL completo

### Sincronização travada
- **Causa**: Muitos dados ou timeout
- **Solução**: Use sincronização por tabela individual:
  ```bash
  curl -X POST .../sync-to-external/table/products
  curl -X POST .../sync-to-external/table/assets
  # etc...
  ```

### Dados desatualizados
- **Solução**: Execute sincronização incremental diária:
  ```bash
  # Sincronizar últimas 24 horas
  curl -X POST .../sync-to-external/incremental \
    -d '{"since": "'$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)'"}'
  ```

---

## 🎯 Resultado Final

Após executar os passos acima, você terá:

✅ **39 tabelas** sincronizadas no Supabase externo  
✅ **~460 colunas** com estrutura idêntica  
✅ **Todos os dados** copiados do banco interno  
✅ **Pronto para integração** com Metabase, N8N, Power BI, etc.  

---

## 🔄 Sincronização Periódica (Opcional)

Para manter os dados atualizados, configure um cron job:

### Opção 1: N8N Workflow (Recomendado)
1. Criar workflow no N8N
2. Schedule diário às 2h da manhã
3. HTTP Request → POST /sync-to-external/incremental
4. Body: `{"since": "{{$now.minus({days: 1}).toISO()}}"}`

### Opção 2: GitHub Actions
```yaml
name: Sync External Database
on:
  schedule:
    - cron: '0 2 * * *' # Diariamente às 2h
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Database
        run: |
          curl -X POST https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/incremental \
            -H "Content-Type: application/json" \
            -d '{"since": "'$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)'"}'
```

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs da edge function
2. Confirme que o script SQL foi executado completamente
3. Teste a conexão com o Supabase externo via SQL Editor

**URLs importantes**:
- Supabase Externo: https://anajebsgyafthwjrbhhc.supabase.co
- Edge Function: https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/sync-to-external/

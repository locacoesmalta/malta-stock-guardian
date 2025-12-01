# Código JavaScript para N8N - Relatório Diário por Categoria

## 📌 Estrutura do Workflow N8N

1. **HTTP Request** (GET) → Busca dados do endpoint público
2. **Code** → Formata mensagem do WhatsApp (código abaixo)
3. **WhatsApp Business Cloud** → Envia mensagem

---

## 🔧 Código JavaScript para o Nó "Code"

Cole este código no nó "Code" do N8N:

```javascript
// Buscar dados do endpoint /daily-report
const data = $input.first().json.data;

// Formatar data em português
const dataRelatorio = new Date(data.report_date).toLocaleDateString('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric'
});

// Construir mensagem do WhatsApp
let message = `📊 *RELATÓRIO DIÁRIO - EQUIPAMENTOS DISPONÍVEIS*\n`;
message += `📅 Data: ${dataRelatorio}\n\n`;

// Resumo geral
message += `📦 *RESUMO GERAL*\n`;
message += `• Total de Equipamentos: ${data.total_equipment} unidades\n`;
message += `• Tipos Diferentes: ${data.total_types}\n`;
message += `• Categorias: ${data.categories.length}\n\n`;
message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

// Iterar por categorias
for (const category of data.categories) {
  message += `${category.emoji} *${category.name}*\n`;
  message += `📊 ${category.total_types} tipos | ${category.total_quantity} unidades\n\n`;
  
  // Listar equipamentos da categoria
  for (const equipment of category.equipment) {
    message += `   ├ ${equipment.name}: *${equipment.quantity} un*\n`;
  }
  
  message += `\n`;
}

// Rodapé
message += `━━━━━━━━━━━━━━━━━━━━\n`;
message += `🏢 *Malta Equipamentos*\n`;
message += `📞 Contato: ${data.phone}\n`;
message += `\n_Relatório gerado automaticamente às 07:00_`;

// Retornar dados formatados para o WhatsApp
return [{
  json: {
    phone: data.phone,
    message: message
  }
}];
```

---

## 📋 Exemplo de Mensagem Formatada

```
📊 *RELATÓRIO DIÁRIO - EQUIPAMENTOS DISPONÍVEIS*
📅 Data: 01 de dezembro de 2025

📦 *RESUMO GERAL*
• Total de Equipamentos: 403 unidades
• Tipos Diferentes: 71
• Categorias: 13

━━━━━━━━━━━━━━━━━━━━

🔨 *MARTELETES*
📊 8 tipos | 85 unidades

   ├ MARTELETE 23 KG: *31 un*
   ├ MARTELETE 10 KG: *18 un*
   ├ MARTELETE 11 KG: *12 un*
   ├ MARTELETE 5 KG: *10 un*
   ├ MARTELETE 30 KG: *8 un*
   ├ MARTELETE 17 KG: *3 un*
   ├ MARTELETE 8 KG: *2 un*
   ├ MARTELETE 3 KG: *1 un*

⚡ *GERADORES*
📊 4 tipos | 15 unidades

   ├ GERADOR 2.2 KVA: *7 un*
   ├ GERADOR 5 KVA: *4 un*
   ├ INVERSOR DE SOLDA 250A: *3 un*
   ├ GERADOR 12 KVA: *1 un*

🪣 *BETONEIRAS*
📊 2 tipos | 45 unidades

   ├ BETONEIRA 400L: *40 un*
   ├ BETONEIRA 150L: *5 un*

⚙️ *ESMERILHADEIRAS*
📊 3 tipos | 32 unidades

   ├ ESMERILHADEIRA 9": *18 un*
   ├ ESMERILHADEIRA 7": *12 un*
   ├ ESMERILHADEIRA 4 1/2": *2 un*

📳 *PLACAS VIBRATÓRIAS*
📊 2 tipos | 28 unidades

   ├ PLACA VIBRATÓRIA 90 KG: *20 un*
   ├ PLACA VIBRATÓRIA 140 KG: *8 un*

🪚 *SERRAS*
📊 3 tipos | 22 unidades

   ├ SERRA MÁRMORE: *12 un*
   ├ SERRA CIRCULAR: *8 un*
   ├ SERRA TICO-TICO: *2 un*

〰️ *MANGOTES VIBRATÓRIOS*
📊 2 tipos | 18 unidades

   ├ MANGOTE VIBRATÓRIO 45 MM: *10 un*
   ├ MANGOTE VIBRATÓRIO 35 MM: *8 un*

🔥 *MÁQUINAS DE SOLDA*
📊 2 tipos | 15 unidades

   ├ MÁQUINA DE SOLDA MIG: *9 un*
   ├ MÁQUINA DE SOLDA TIG: *6 un*

💧 *BOMBAS*
📊 4 tipos | 35 unidades

   ├ MOTOBOMBA 2": *15 un*
   ├ MOTOBOMBA 3": *10 un*
   ├ BOMBA SUBMERSA: *8 un*
   ├ MARACA (BOMBA DE REBOCO): *2 un*

✨ *POLITRIZES/LIXADEIRAS*
📊 2 tipos | 12 unidades

   ├ POLITRIZ 7": *8 un*
   ├ LIXADEIRA ORBITAL: *4 un*

🏗️ *COMPACTADORES*
📊 3 tipos | 25 unidades

   ├ COMPACTADOR DE SOLO (SAPO): *15 un*
   ├ VIBRADOR DE CONCRETO: *8 un*
   ├ COMPACTADOR TIPO CANGURU: *2 un*

🔩 *FURADEIRAS*
📊 2 tipos | 18 unidades

   ├ FURADEIRA DE IMPACTO: *12 un*
   ├ FURADEIRA MAGNÉTICA: *6 un*

🔧 *OUTROS*
📊 34 tipos | 53 unidades

   ├ ANDAIME METÁLICO: *8 un*
   ├ ESCADA EXTENSÍVEL: *5 un*
   ├ ... (demais equipamentos)

━━━━━━━━━━━━━━━━━━━━
🏢 *Malta Equipamentos*
📞 Contato: +5591996280080

_Relatório gerado automaticamente às 07:00_
```

---

## ⚙️ Configuração do Nó HTTP Request

**URL do Endpoint:**
```
https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/daily-report
```

**Método:** `GET`

**Headers:** Não necessário (endpoint público)

**Authentication:** None

---

## 🔄 Estrutura JSON Retornada pela API

```json
{
  "success": true,
  "data": {
    "report_type": "daily_availability",
    "report_date": "2025-12-01",
    "phone": "+5591996280080",
    "summary": {
      "total": 450,
      "deposito_malta": 403,
      "locacao": 30,
      "em_manutencao": 15,
      "aguardando_laudo": 2
    },
    "total_equipment": 403,
    "total_types": 71,
    "categories": [
      {
        "name": "MARTELETES",
        "emoji": "🔨",
        "total_types": 8,
        "total_quantity": 85,
        "equipment": [
          { "name": "MARTELETE 23 KG", "quantity": 31 },
          { "name": "MARTELETE 10 KG", "quantity": 18 }
        ]
      }
    ]
  }
}
```

---

## 📌 Notas Importantes

1. ✅ **Endpoint público** - Não requer autenticação
2. ✅ **Categorias ordenadas** por quantidade total (maior → menor)
3. ✅ **Equipamentos ordenados** por quantidade dentro de cada categoria
4. ✅ **Categoria "OUTROS"** sempre aparece por último
5. ✅ **Emojis automáticos** para cada categoria
6. ✅ **Data formatada** em português brasileiro

---

## 🧪 Teste Rápido

Acesse no navegador para ver o JSON completo:
```
https://lybclzqgvnlphltjlmwg.supabase.co/functions/v1/n8n-api/daily-report
```

---

## 📞 Suporte

Para dúvidas ou ajustes no formato da mensagem, contate o administrador do sistema.

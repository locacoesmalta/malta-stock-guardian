# Configuração de Fuso Horário do Sistema

## ⚠️ DOCUMENTAÇÃO CRÍTICA - LEIA ATENTAMENTE

Este documento define como o sistema **DEVE** trabalhar com datas e horas.

---

## 📍 Fuso Horário Configurado

```
Fuso Horário: America/Belem (UTC-3)
Localização: Belém, Pará, Brasil
Data de Referência: 17/11/2025 (17 de novembro de 2025)
```

---

## 🚫 O QUE NUNCA FAZER

**NUNCA USE:**
- ❌ `new Date()` diretamente
- ❌ `Date.now()` diretamente
- ❌ Funções de data sem considerar o fuso horário
- ❌ Datas hardcoded
- ❌ Assumir fuso horário do servidor/navegador

---

## ✅ O QUE SEMPRE FAZER

**SEMPRE USE:**
- ✅ Funções de `src/config/timezone.ts`
- ✅ Fuso horário configurado: `America/Belem`
- ✅ Importar e usar as funções utilitárias

---

## 📚 Funções Disponíveis

### Arquivo: `src/config/timezone.ts`

#### 1. `getCurrentDateTime()`
Retorna a data e hora atual no fuso horário de Belém.

```typescript
import { getCurrentDateTime } from "@/config/timezone";

const agora = getCurrentDateTime();
// Retorna: Date object com horário de Belém
// Exemplo: 2025-11-17 10:30:00 (UTC-3)
```

---

#### 2. `getCurrentDate()`
Retorna apenas a data atual no formato ISO (YYYY-MM-DD).

```typescript
import { getCurrentDate } from "@/config/timezone";

const hoje = getCurrentDate();
// Retorna: "2025-11-17"
```

---

#### 3. `getCurrentDateTimeBR()`
Retorna data e hora formatada no padrão brasileiro.

```typescript
import { getCurrentDateTimeBR } from "@/config/timezone";

const dataHora = getCurrentDateTimeBR();
// Retorna: "17/11/2025 10:30:00"
```

---

#### 4. `getCurrentDateBR()`
Retorna apenas a data formatada no padrão brasileiro.

```typescript
import { getCurrentDateBR } from "@/config/timezone";

const data = getCurrentDateBR();
// Retorna: "17/11/2025"
```

---

#### 5. `toBelemTime(date)`
Converte uma data UTC para o horário de Belém.

```typescript
import { toBelemTime } from "@/config/timezone";

const dataUTC = new Date('2025-11-17T13:30:00Z');
const dataBelem = toBelemTime(dataUTC);
// Retorna: 2025-11-17 10:30:00 (UTC-3)
```

---

#### 6. `formatBelemDate(date, format)`
Formata uma data no fuso horário de Belém.

```typescript
import { formatBelemDate } from "@/config/timezone";

const data = new Date('2025-11-17T13:30:00Z');
const formatada = formatBelemDate(data, 'dd/MM/yyyy HH:mm');
// Retorna: "17/11/2025 10:30"
```

---

#### 7. `isFutureDate(date)`
Verifica se uma data está no futuro (considerando Belém).

```typescript
import { isFutureDate } from "@/config/timezone";

const amanha = new Date('2025-11-18');
console.log(isFutureDate(amanha)); // true
```

---

#### 8. `isPastDate(date)`
Verifica se uma data está no passado (considerando Belém).

```typescript
import { isPastDate } from "@/config/timezone";

const ontem = new Date('2025-11-16');
console.log(isPastDate(ontem)); // true
```

---

#### 9. `getTimezoneInfo()`
Retorna informações completas sobre o fuso horário.

```typescript
import { getTimezoneInfo } from "@/config/timezone";

const info = getTimezoneInfo();
// Retorna:
// {
//   timezone: 'America/Belem',
//   name: 'Horário de Belém',
//   location: 'Belém, Pará, Brasil',
//   utcOffset: 'UTC-3',
//   currentDate: '2025-11-17',
//   currentDateTime: '17/11/2025 10:30:00'
// }
```

---

## 🔧 Função Existente Atualizada

### `getTodayLocalDate()` (src/lib/dateUtils.ts)

Agora usa internamente `getCurrentDate()` do timezone.ts:

```typescript
import { getTodayLocalDate } from "@/lib/dateUtils";

const hoje = getTodayLocalDate();
// Retorna: "2025-11-17" (horário de Belém)
```

---

## 📋 Exemplos de Uso Correto

### ✅ Exemplo 1: Obter data atual para input
```typescript
import { getCurrentDate } from "@/config/timezone";

const [formData, setFormData] = useState({
  report_date: getCurrentDate(), // "2025-11-17"
});
```

### ✅ Exemplo 2: Verificar se data é futura
```typescript
import { isFutureDate } from "@/config/timezone";

const substitutionDate = new Date(dateStr);
if (isFutureDate(substitutionDate)) {
  toast.error("❌ Data não pode ser futura");
  return false;
}
```

### ✅ Exemplo 3: Formatar data para exibição
```typescript
import { formatBelemDate } from "@/config/timezone";

const dataFormatada = formatBelemDate(report.report_date, 'dd/MM/yyyy');
// "17/11/2025"
```

### ✅ Exemplo 4: Registrar timestamp com hora
```typescript
import { getCurrentDateTimeBR } from "@/config/timezone";

const registro = {
  created_at: getCurrentDateTime(), // Date object
  created_at_display: getCurrentDateTimeBR(), // "17/11/2025 10:30:00"
};
```

---

## ❌ Exemplos de Uso INCORRETO

### ❌ ERRADO: Usar new Date() diretamente
```typescript
// ❌ NÃO FAÇA ISSO
const hoje = new Date();
const dataStr = hoje.toISOString().split('T')[0];
```

### ❌ ERRADO: Manipular datas sem fuso horário
```typescript
// ❌ NÃO FAÇA ISSO
const agora = Date.now();
const data = new Date(agora);
```

### ❌ ERRADO: Hardcoded dates
```typescript
// ❌ NÃO FAÇA ISSO
const hoje = "2025-11-17"; // Nunca hardcode datas!
```

---

## 🔍 Como Migrar Código Existente

### Antes (❌ Incorreto):
```typescript
const today = new Date();
const dateStr = today.toISOString().split('T')[0];
```

### Depois (✅ Correto):
```typescript
import { getCurrentDate } from "@/config/timezone";

const dateStr = getCurrentDate();
```

---

## 📝 Checklist para Desenvolvedores

Ao trabalhar com datas, verifique:

- [ ] Estou importando funções de `@/config/timezone`?
- [ ] Estou usando o fuso horário correto (America/Belem)?
- [ ] Não estou usando `new Date()` diretamente?
- [ ] As validações de data consideram o fuso horário?
- [ ] Os timestamps no banco estão corretos?
- [ ] As datas exibidas ao usuário estão no padrão brasileiro?

---

## 🎯 Resumo Executivo

1. **SEMPRE** importe de `@/config/timezone.ts`
2. **NUNCA** use `new Date()` diretamente
3. **Fuso Horário:** America/Belem (UTC-3)
4. **Data Atual:** 17/11/2025
5. **Formato Brasileiro:** DD/MM/YYYY
6. **Formato ISO:** YYYY-MM-DD

---

## 📞 Dúvidas?

Em caso de dúvida sobre como usar datas corretamente:
1. Consulte este documento
2. Veja exemplos em `src/config/timezone.ts`
3. Verifique a implementação em `src/lib/dateUtils.ts`
4. Use `getTimezoneInfo()` para debug

---

**Última atualização:** 17/11/2025  
**Mantenedor:** Sistema Malta Stock Guardian  
**Fuso Horário:** America/Belem (UTC-3)

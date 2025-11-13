# 🔒 Guia de Validação e Sanitização de Inputs

## Índice
- [Visão Geral](#visão-geral)
- [Bibliotecas de Sanitização](#bibliotecas-de-sanitização)
- [Frontend: Validação com Zod](#frontend-validação-com-zod)
- [Backend: Edge Functions](#backend-edge-functions)
- [Database: Triggers e RLS](#database-triggers-e-rls)
- [Monitoramento de Segurança](#monitoramento-de-segurança)
- [Testes](#testes)
- [Checklist de Segurança](#checklist-de-segurança)

---

## Visão Geral

Este projeto implementa **defesa em profundidade** contra ataques de injeção (XSS, SQL Injection) através de múltiplas camadas:

1. **Frontend**: Sanitização em tempo real + validação Zod
2. **Backend**: Validação em Edge Functions + Rate Limiting
3. **Database**: Triggers de sanitização + RLS Policies
4. **Monitoramento**: Log de tentativas de ataque

---

## Bibliotecas de Sanitização

### Frontend: `src/lib/inputSanitization.ts`

#### `sanitizeHTML(input: string): string`
**Uso**: Campos que podem ter rich text mas precisam ser seguros.

```typescript
import { sanitizeHTML } from '@/lib/inputSanitization';

const clean = sanitizeHTML('<script>alert("XSS")</script>Hello');
// Retorna: 'Hello'
```

#### `sanitizeText(input: string): string`
**Uso**: Campos de texto simples (nomes, descrições).

```typescript
import { sanitizeText } from '@/lib/inputSanitization';

const clean = sanitizeText('João <script>alert(1)</script> Silva');
// Retorna: 'João  Silva'
```

#### `sanitizeFileName(input: string): string`
**Uso**: Upload de arquivos.

```typescript
const safeName = sanitizeFileName('../../etc/passwd.jpg');
// Retorna: 'etcpasswd.jpg'
```

#### `validateAndSanitizeEmail(email: string): string | null`
**Uso**: Formulários de email.

```typescript
const email = validateAndSanitizeEmail('user@example.com');
// Retorna: 'user@example.com' ou null se inválido
```

#### `sanitizeURL(url: string): string | null`
**Uso**: Links externos, redirects.

```typescript
const url = sanitizeURL('javascript:alert(1)');
// Retorna: null (bloqueado)

const url2 = sanitizeURL('https://example.com');
// Retorna: 'https://example.com'
```

---

### Backend: `supabase/functions/_shared/sanitization.ts`

#### `sanitizeInput(input: string): string`
Sanitização geral para Edge Functions.

```typescript
import { sanitizeInput } from '../_shared/sanitization.ts';

const cleanName = sanitizeInput(req.body.name);
```

#### `validateEmail(email: string): string | null`
Validação rigorosa de email.

```typescript
import { validateEmail } from '../_shared/sanitization.ts';

const email = validateEmail(userInput);
if (!email) {
  return new Response('Email inválido', { status: 400 });
}
```

#### `validateUUID(uuid: string): boolean`
Valida formato UUID v4.

```typescript
import { validateUUID } from '../_shared/sanitization.ts';

if (!validateUUID(productId)) {
  return new Response('ID inválido', { status: 400 });
}
```

---

## Frontend: Validação com Zod

### ❌ Código Inseguro (ANTES)

```typescript
const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  comments: z.string().optional(),
});
```

**Problema**: Aceita HTML e scripts maliciosos.

### ✅ Código Seguro (DEPOIS)

```typescript
import { sanitizeText, containsXSSPatterns } from '@/lib/inputSanitization';

const schema = z.object({
  name: z.string()
    .min(1, "Nome obrigatório")
    .max(200, "Máximo 200 caracteres")
    .transform(val => sanitizeText(val))
    .refine(
      val => !containsXSSPatterns(val),
      "Entrada contém código malicioso"
    ),
  
  comments: z.string()
    .max(1000, "Máximo 1000 caracteres")
    .transform(val => sanitizeHTML(val))
    .optional(),
});
```

**Benefícios**:
- Remove HTML automaticamente
- Detecta padrões de ataque
- Limita comprimento
- Mensagens de erro claras

---

## Backend: Edge Functions

### ❌ Código Inseguro (ANTES)

```typescript
const { email, name } = await req.json();

// Usa diretamente sem validação
const { data, error } = await supabase
  .from('users')
  .insert({ email, name });
```

**Problemas**:
- Sem validação de formato
- Sem limite de comprimento
- Vulnerável a XSS no banco

### ✅ Código Seguro (DEPOIS)

```typescript
import { sanitizeInput, validateEmail } from '../_shared/sanitization.ts';
import { checkRateLimit, getClientIP } from '../_shared/rateLimit.ts';

export default async (req: Request) => {
  // 1. Rate Limiting
  const ip = getClientIP(req);
  if (!checkRateLimit(ip, 10, 60000)) {
    return new Response('Too many requests', { status: 429 });
  }

  // 2. Parse e sanitização
  const body = await req.json();
  const email = validateEmail(body.email);
  const name = sanitizeInput(body.name);

  // 3. Validação
  if (!email) {
    return new Response('Email inválido', { status: 400 });
  }
  
  if (!name || name.length < 3 || name.length > 100) {
    return new Response('Nome inválido (3-100 caracteres)', { status: 400 });
  }

  // 4. Inserção segura
  const { data, error } = await supabase
    .from('users')
    .insert({ email, name });

  if (error) throw error;
  return new Response(JSON.stringify(data), { status: 201 });
};
```

---

## Database: Triggers e RLS

### Trigger de Sanitização Automática

O banco de dados possui triggers que sanitizam automaticamente campos de texto:

```sql
CREATE FUNCTION sanitize_text_fields() RETURNS TRIGGER AS $$
BEGIN
  -- Remove tags HTML
  NEW.service_comments := regexp_replace(NEW.service_comments, '<[^>]+>', '', 'g');
  NEW.observations := regexp_replace(COALESCE(NEW.observations, ''), '<[^>]+>', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sanitize_reports_trigger
BEFORE INSERT OR UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION sanitize_text_fields();
```

**Tabelas protegidas**:
- `public.reports`
- `public.products`
- `public.assets`

---

## Monitoramento de Segurança

### Registro de Tentativas de Ataque

```typescript
import { logSecurityIncident } from '@/lib/securityMonitoring';

// Em validações de formulário
if (containsXSSPatterns(userInput)) {
  await logSecurityIncident('xss_attempt', userInput, window.location.pathname);
  toast.error('Entrada inválida detectada');
  return;
}
```

### Tabela `security_incidents`

Armazena:
- Tipo de incidente (XSS, SQL Injection, Rate Limit)
- Payload malicioso
- User ID e IP
- Timestamp
- Endpoint afetado

**Acesso**: Apenas administradores podem visualizar.

---

## Testes

### Executar Testes de Segurança

```bash
npm run test src/tests/security/xss.test.ts
```

### Payloads de Teste XSS

```typescript
const testPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '<iframe src="javascript:alert(1)">',
];
```

### Payloads de Teste SQL Injection

```typescript
const sqlPayloads = [
  "' OR '1'='1",
  "'; DROP TABLE users; --",
  "1' UNION SELECT * FROM passwords--",
];
```

---

## Checklist de Segurança

### ✅ Para Desenvolvedores

Antes de fazer commit de código com inputs de usuário:

- [ ] Todos os campos de texto usam schemas Zod com `.transform(sanitizeText)`?
- [ ] Campos que aceitam rich text usam `sanitizeHTML` ao invés de `sanitizeText`?
- [ ] Schemas incluem `.refine()` com `containsXSSPatterns`?
- [ ] Todos os schemas têm limites de comprimento (`.max()`)?
- [ ] Edge Functions validam TODOS os inputs antes de usar?
- [ ] Edge Functions usam `validateEmail()` para emails?
- [ ] Edge Functions usam `validateUUID()` para IDs?
- [ ] Rate limiting está implementado em endpoints públicos?
- [ ] Não há uso de `dangerouslySetInnerHTML` sem sanitização?
- [ ] Uploads de arquivo usam `sanitizeFileName()`?
- [ ] URLs externas usam `sanitizeURL()` antes de redirect?

### ✅ Para Code Review

- [ ] PR adiciona novos inputs de usuário? → Exigir sanitização
- [ ] PR modifica Edge Functions? → Verificar validação de inputs
- [ ] PR usa innerHTML ou dangerouslySetInnerHTML? → Exigir DOMPurify
- [ ] PR adiciona queries SQL dinâmicas? → REJEITAR (usar Supabase client)
- [ ] PR desabilita validação Zod? → Exigir justificativa

### ✅ Testes Manuais

1. **Teste XSS em Todos os Formulários**:
   - Inserir: `<script>alert('XSS')</script>`
   - Verificar que:
     - Não executa na página
     - Não salva no banco com tags
     - Mostra erro de validação

2. **Teste SQL Injection em Buscas**:
   - Inserir: `'; DROP TABLE products; --`
   - Verificar que:
     - Busca retorna vazio ou erro
     - Banco permanece intacto
     - Incidente é logado

3. **Teste de Nomes de Arquivo**:
   - Upload: `<script>.jpg`, `../../etc/passwd.jpg`
   - Verificar que nomes são sanitizados

4. **Teste de Rate Limiting**:
   - Fazer 15+ requisições em 1 minuto
   - Verificar resposta 429 (Too Many Requests)

---

## Recursos Adicionais

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Zod Documentation](https://zod.dev/)

---

## Contato

Para reportar vulnerabilidades de segurança, contate o administrador do sistema.

**NÃO** crie issues públicas com detalhes de vulnerabilidades.

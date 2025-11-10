# Guia: Painel de Sessões Ativas

## 📊 Visão Geral

O **Painel de Sessões Ativas** é uma funcionalidade exclusiva para administradores que permite monitorar em tempo real todos os usuários conectados ao sistema Malta Stock Guardian, incluindo seus tempos de inatividade e localização atual no aplicativo.

---

## 🎯 Características Principais

### 1. **Rastreamento em Tempo Real**
- Atualização automática a cada 10 segundos
- Sincronização via Supabase Realtime
- Precisão de atividade com intervalos de 30 segundos

### 2. **Indicadores de Inatividade**
O sistema classifica os usuários em 4 níveis de atividade:

- **Ativo** (< 5 minutos de inatividade)
  - Badge verde
  - Indica usuário ativamente utilizando o sistema

- **Pouco Inativo** (5-15 minutos)
  - Badge amarelo
  - Usuário pode estar consultando informações

- **Inativo** (15-20 minutos)
  - Badge laranja
  - Alerta de possível logout automático

- **Muito Inativo** (> 20 minutos)
  - Badge vermelho
  - Usuário será deslogado automaticamente

### 3. **Informações Detalhadas**
Para cada sessão ativa, o painel exibe:
- Nome e e-mail do usuário
- Tempo desde a última atividade
- Página atual que está visualizando
- Informações do navegador/plataforma
- Status online/offline

---

## 🔧 Implementação Técnica

### Arquitetura

```
┌─────────────────────┐
│   AuthContext       │ ← Inicializa rastreamento de presença
│                     │
│ useRealtimePresence │ ← Hook de rastreamento
└──────────┬──────────┘
           │
           ↓
    ┌──────────────┐
    │  Supabase    │
    │ user_presence│ ← Tabela de presença
    │   (tabela)   │
    └──────┬───────┘
           │
           ↓ Realtime
    ┌──────────────┐
    │  ActiveSessions │ ← Painel Admin
    │     (página)    │
    │                 │
    │ useActiveUsers  │ ← Hook de monitoramento
    └─────────────────┘
```

### Componentes Criados

#### 1. **Tabela: `user_presence`**
```sql
CREATE TABLE public.user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_email TEXT NOT NULL,
  user_name TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL,
  current_route TEXT,
  browser_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);
```

**RLS Policies:**
- Apenas administradores podem visualizar todas as presenças
- Usuários podem inserir/atualizar/deletar apenas sua própria presença

#### 2. **Hook: `useRealtimePresence`**
Localizado em: `src/hooks/useRealtimePresence.ts`

**Responsabilidades:**
- Registrar presença do usuário no banco
- Atualizar last_activity a cada 30 segundos
- Marcar como offline ao fechar o navegador
- Rastrear rota atual do usuário

**Uso:**
```typescript
useRealtimePresence({
  user: currentUser,
  isEnabled: isUserLoggedIn,
});
```

#### 3. **Hook: `useActiveUsers`**
Localizado em: `src/hooks/useActiveUsers.ts`

**Responsabilidades:**
- Buscar todos os usuários e suas presenças
- Atualizar automaticamente via Realtime
- Classificar por última atividade
- Restringir acesso apenas para admins

**Retorna:**
```typescript
{
  activeUsers: ActiveUser[],
  loading: boolean,
  error: string | null,
  refetch: () => void
}
```

#### 4. **Página: `ActiveSessions`**
Localizado em: `src/pages/admin/ActiveSessions.tsx`

**Recursos:**
- Cards estatísticos (online, offline, total)
- Listagem de usuários online com detalhes
- Listagem de usuários offline
- Alertas de logout iminente (15+ min de inatividade)
- Botão de atualização manual
- Design responsivo e acessível

---

## 🚀 Como Usar

### Acesso ao Painel

1. **Faça login como administrador**
2. No menu lateral, acesse: **Administração → Sessões Ativas**
3. O painel carregará automaticamente

### Interpretando os Dados

#### Cards de Estatísticas
- **Usuários Online**: Total de usuários com `is_online = true`
- **Usuários Offline**: Total de usuários desconectados
- **Total de Sessões**: Número de registros na tabela de presença

#### Lista de Usuários Online
Cada card de usuário mostra:
- **Avatar**: Ícone colorido do usuário
- **Nome e Email**: Identificação do usuário
- **Badge de Status**: Indicador colorido de atividade
- **Última Atividade**: Tempo relativo (ex: "há 2 minutos")
- **Página Atual**: Rota que o usuário está visualizando
- **Navegador**: Informações da plataforma
- **Alerta**: Se inativo por 15+ minutos, mostra aviso de logout

#### Lista de Usuários Offline
Cards simplificados com:
- Avatar cinza
- Nome e email
- Badge "Offline"
- Última vez online

---

## ⚙️ Configurações e Manutenção

### Intervalos de Atualização

| Componente | Intervalo | Configurável em |
|------------|-----------|-----------------|
| Presença do usuário | 30 segundos | `useRealtimePresence.ts` |
| Refresh do painel | 10 segundos | `useActiveUsers.ts` |
| Limpeza automática | 30 minutos | Função `cleanup_inactive_sessions()` |

### Função de Limpeza Automática

```sql
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_presence
  SET is_online = false
  WHERE is_online = true 
    AND last_activity < now() - interval '30 minutes';
END;
$$;
```

**Nota**: Esta função pode ser executada via cron ou manualmente para manter a tabela atualizada.

---

## 🔐 Segurança

### Políticas de Acesso (RLS)

1. **SELECT (Admins only)**
   ```sql
   CREATE POLICY "Admins can view all user presence"
   ON public.user_presence
   FOR SELECT
   TO authenticated
   USING (is_admin_or_superuser(auth.uid()));
   ```

2. **INSERT (Próprio usuário)**
   ```sql
   CREATE POLICY "Users can insert their own presence"
   ON public.user_presence
   FOR INSERT
   TO authenticated
   WITH CHECK (auth.uid() = user_id);
   ```

3. **UPDATE (Próprio usuário)**
   ```sql
   CREATE POLICY "Users can update their own presence"
   ON public.user_presence
   FOR UPDATE
   TO authenticated
   USING (auth.uid() = user_id)
   WITH CHECK (auth.uid() = user_id);
   ```

4. **DELETE (Próprio usuário)**
   ```sql
   CREATE POLICY "Users can delete their own presence"
   ON public.user_presence
   FOR DELETE
   TO authenticated
   USING (auth.uid() = user_id);
   ```

### Privacidade

- Apenas administradores podem visualizar sessões de outros usuários
- Usuários comuns não têm acesso ao painel
- Dados sensíveis do navegador são armazenados de forma segura
- Sessões antigas são automaticamente marcadas como offline

---

## 📈 Casos de Uso

### 1. Monitoramento de Equipe
- Verificar quais usuários estão ativos no sistema
- Identificar padrões de uso
- Planejar manutenções em horários de baixa atividade

### 2. Suporte Técnico
- Ver em qual página o usuário está tendo problemas
- Verificar se o usuário está realmente online
- Auxiliar remotamente baseado na localização no sistema

### 3. Auditoria e Segurança
- Detectar sessões incomuns ou não autorizadas
- Monitorar atividade em horários fora do expediente
- Validar comportamento de acesso dos usuários

### 4. Gestão de Recursos
- Entender picos de uso do sistema
- Otimizar performance baseado em uso real
- Planejar upgrades de infraestrutura

---

## 🐛 Troubleshooting

### Problema: Usuários não aparecem no painel

**Possíveis causas:**
1. Usuário não fez login após a implementação
2. RLS não está configurada corretamente
3. Realtime não está habilitado na tabela

**Solução:**
```sql
-- Verificar se realtime está habilitado
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Verificar registros na tabela
SELECT * FROM user_presence WHERE is_online = true;
```

### Problema: Presença não atualiza

**Possíveis causas:**
1. Hook não está sendo executado no AuthContext
2. Erro de permissão no banco
3. Session ID duplicado

**Solução:**
1. Verificar console do navegador por erros
2. Confirmar que `useRealtimePresence` está no `AuthContext`
3. Limpar sessões antigas:
   ```sql
   DELETE FROM user_presence WHERE last_activity < now() - interval '1 day';
   ```

### Problema: Painel não carrega (apenas admin)

**Possíveis causas:**
1. Usuário não é admin
2. Erro de permissão RLS
3. Função helper `is_admin_or_superuser` não existe

**Solução:**
```sql
-- Verificar se função existe
SELECT proname FROM pg_proc WHERE proname = 'is_admin_or_superuser';

-- Testar manualmente a query
SELECT * FROM user_presence WHERE is_online = true;
```

---

## 🔄 Integração com Auto-Logout

O painel de Sessões Ativas está integrado com o sistema de auto-logout por inatividade:

- **15 minutos de inatividade**: Usuário recebe aviso
- **18 minutos de inatividade**: Modal aparece com countdown
- **20 minutos de inatividade**: Logout automático

No painel, administradores veem alertas quando usuários estão próximos de serem deslogados automaticamente, permitindo intervenção se necessário.

---

## 📊 Métricas e Estatísticas

### Dados Coletados
- Total de usuários online no momento
- Total de usuários offline
- Tempo médio de sessão (pode ser calculado)
- Rotas mais acessadas (via análise do `current_route`)
- Horários de pico de atividade

### Queries Úteis

```sql
-- Usuários online agora
SELECT COUNT(*) FROM user_presence WHERE is_online = true;

-- Usuários por página
SELECT current_route, COUNT(*) as total
FROM user_presence
WHERE is_online = true
GROUP BY current_route
ORDER BY total DESC;

-- Média de tempo de inatividade
SELECT 
  AVG(EXTRACT(EPOCH FROM (now() - last_activity))/60) as avg_minutes_inactive
FROM user_presence
WHERE is_online = true;
```

---

## 🎨 Personalização

### Modificar Intervalos

**Atualização de presença (padrão: 30s)**
```typescript
// src/hooks/useRealtimePresence.ts
updateIntervalRef.current = setInterval(() => {
  updatePresence();
}, 30000); // Altere aqui (em milissegundos)
```

**Refresh do painel (padrão: 10s)**
```typescript
// src/hooks/useActiveUsers.ts
const interval = setInterval(() => {
  fetchActiveUsers();
}, 10000); // Altere aqui (em milissegundos)
```

### Customizar Badges de Inatividade

```typescript
// src/pages/admin/ActiveSessions.tsx
const getInactivityBadge = (minutes: number) => {
  if (minutes < 5) {
    return <Badge className="bg-green-500">Ativo</Badge>;
  } else if (minutes < 15) {
    return <Badge className="bg-yellow-500">Pouco Inativo</Badge>;
  } 
  // Adicione mais níveis aqui...
};
```

---

## ✅ Checklist de Implementação

- [x] Tabela `user_presence` criada no Supabase
- [x] RLS policies configuradas
- [x] Realtime habilitado na tabela
- [x] Hook `useRealtimePresence` criado
- [x] Hook `useActiveUsers` criado
- [x] Página `ActiveSessions` criada
- [x] Integração no `AuthContext`
- [x] Rota adicionada no `App.tsx`
- [x] Link no menu lateral (`AppSidebar`)
- [x] Função de limpeza automática
- [x] Testes de permissões RLS
- [x] Documentação completa

---

## 📚 Referências

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [date-fns Documentation](https://date-fns.org/)

---

**Versão**: 1.0.0  
**Última Atualização**: 2025-11-10  
**Autor**: Malta Stock Guardian Development Team


## Plano: Desativar Temporariamente Escritas de Presença no Banco

### Problema Identificado
O hook `useRealtimePresence` (em `src/hooks/useRealtimePresence.ts`) esta fazendo **upsert na tabela `user_presence` a cada 30 segundos** para cada usuario logado. Com multiplas sessoes abertas, isso acumulou **140.785 updates** no banco. E chamado direto no `AuthContext.tsx` (linha 447), ou seja, esta ativo para TODOS os usuarios logados.

### Solucao: Desativar o Hook Temporariamente

**Arquivo: `src/contexts/AuthContext.tsx`**

Desativar o hook passando `isEnabled: false`:

```typescript
// ANTES:
useRealtimePresence({
  user,
  isEnabled: !!user && !loading,
});

// DEPOIS (temporariamente desativado):
useRealtimePresence({
  user,
  isEnabled: false, // TEMPORARIAMENTE DESATIVADO - sobrecarregando BD
});
```

Isso e uma alteracao de 1 linha que:
- Para IMEDIATAMENTE todas as escritas de presenca no banco
- Nao quebra nenhuma funcionalidade critica do sistema
- Pode ser reativado depois mudando `false` de volta para `!!user && !loading`

### Impacto
- A funcionalidade de "usuarios online" no chat ficara temporariamente indisponivel
- Todas as outras funcionalidades do sistema continuam normais
- Nenhum dado sera perdido

### Limpeza Adicional (Opcional)
Apos desativar, podemos limpar os registros antigos de presenca para liberar espaco:
```sql
DELETE FROM user_presence WHERE is_online = false;
```

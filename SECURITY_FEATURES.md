# Recursos de Segurança - Malta Stock Guardian

## 🔒 Sistema de Auto-Logout por Inatividade

### Descrição
O sistema detecta automaticamente quando um usuário fica inativo por mais de 20 minutos e o desloga por segurança.

### Como Funciona

1. **Rastreamento de Atividade**
   - O sistema monitora eventos: `mousedown`, `mousemove`, `keypress`, `scroll`, `touchstart`, `click`
   - Cada interação reseta o timer de 20 minutos
   - Implementado em: `src/hooks/useIdleTimeout.ts`

2. **Aviso ao Usuário**
   - **18 minutos de inatividade**: Modal de aviso aparece
   - **Countdown de 2 minutos**: Usuário vê quanto tempo resta
   - **Botão "Continuar Conectado"**: Permite resetar o timer e continuar trabalhando
   - Implementado em: `src/components/IdleWarningDialog.tsx`

3. **Logout Automático**
   - Após 20 minutos completos sem interação, o usuário é deslogado automaticamente
   - Toast de notificação: "Sessão Encerrada - Você foi desconectado por inatividade"
   - Redirecionamento para página de login

### Configurações
Edite os tempos em `src/config/security.ts`:
```typescript
export const SECURITY_CONFIG = {
  IDLE_TIMEOUT_MS: 20 * 60 * 1000,    // Tempo total (20 min)
  IDLE_WARNING_MS: 18 * 60 * 1000,    // Quando mostrar aviso (18 min)
};
```

---

## 🔄 Sistema de Forçar Re-login Após Atualizações

### Descrição
Quando uma nova versão do sistema é implantada, todos os usuários são automaticamente forçados a fazer logout e login novamente. Isso garante que todos estejam usando a versão mais recente.

### Como Funciona

1. **Versionamento**
   - Cada deploy tem uma versão única definida em `src/lib/appVersion.ts`
   - Exemplo: `export const APP_VERSION = "1.0.0";`
   - A versão é armazenada no `localStorage` após cada login bem-sucedido

2. **Verificação Periódica**
   - A cada 5 minutos, o sistema verifica se a versão atual é diferente da armazenada
   - Se detectar diferença, significa que houve uma atualização
   - Implementado em: `src/hooks/useVersionCheck.ts`

3. **Notificação ao Usuário**
   - **Modal não-dismissível**: Aparece quando atualização é detectada
   - **Countdown de 30 segundos**: Tempo para o usuário salvar trabalho
   - **Botão "Atualizar Agora"**: Permite atualizar imediatamente
   - **Logout Automático**: Após 30s ou clique, usuário é deslogado
   - Implementado em: `src/components/UpdateAvailableDialog.tsx`

4. **Processo de Atualização**
   - Logout do usuário
   - Limpeza do localStorage (exceto `app_version`)
   - Reload da página para carregar nova versão
   - Redirecionamento para login

### Como Usar em Cada Deploy

**IMPORTANTE**: A cada deploy de atualização, você DEVE incrementar a versão em `src/lib/appVersion.ts`

#### Exemplo de Incremento de Versão

```typescript
// ANTES DO DEPLOY
export const APP_VERSION = "1.0.0";

// DEPOIS DO DEPLOY (escolha baseado no tipo de mudança)
export const APP_VERSION = "1.0.1";  // Patch: Correções de bugs
export const APP_VERSION = "1.1.0";  // Minor: Novas funcionalidades
export const APP_VERSION = "2.0.0";  // Major: Mudanças significativas
```

#### Tipos de Versão (Semantic Versioning)

- **MAJOR (X.0.0)**: Mudanças incompatíveis ou grandes refatorações
  - Exemplo: Redesign completo, mudança de banco de dados
  
- **MINOR (1.X.0)**: Novas funcionalidades compatíveis
  - Exemplo: Novo módulo de relatórios, nova tela
  
- **PATCH (1.0.X)**: Correções de bugs e pequenas melhorias
  - Exemplo: Fix de validação, correção de layout

#### Processo de Deploy

1. **Antes de fazer deploy:**
   ```bash
   # Editar src/lib/appVersion.ts
   export const APP_VERSION = "1.0.1"; // Incrementar versão
   ```

2. **Commit e deploy:**
   ```bash
   git add src/lib/appVersion.ts
   git commit -m "chore: bump version to 1.0.1"
   git push
   ```

3. **O que acontece:**
   - Deploy é realizado
   - Usuários que estão usando a versão antiga recebem notificação
   - Após logout, eles fazem login novamente na versão nova

### Configurações
Edite os tempos em `src/config/security.ts`:
```typescript
export const SECURITY_CONFIG = {
  VERSION_CHECK_INTERVAL_MS: 5 * 60 * 1000,  // Verificar a cada 5 min
  UPDATE_GRACE_PERIOD_MS: 30 * 1000,         // 30s para atualizar
};
```

---

## 🧹 Limpeza de LocalStorage

### Descrição
Ao fazer logout (manual, por inatividade ou por atualização), o sistema limpa automaticamente todos os dados sensíveis do `localStorage`.

### O que é Limpo
- Cache de dados do React Query
- Estados salvos localmente
- Informações de sessão temporárias
- **Mantido**: `app_version` (para controle de versionamento)

### Implementação
Localizado em: `src/contexts/AuthContext.tsx` na função `signOut()`

```typescript
const signOut = async () => {
  // Salvar versão atual
  const currentVersion = localStorage.getItem('app_version');
  
  // Limpar tudo
  localStorage.clear();
  
  // Restaurar apenas versão
  if (currentVersion) {
    localStorage.setItem('app_version', currentVersion);
  }
  
  // ... resto do logout
};
```

---

## 📊 Eventos de Segurança

### Logs Gerados

1. **Logout por Inatividade**
   - Toast: "Sessão Encerrada - Você foi desconectado por inatividade"
   
2. **Logout por Atualização**
   - Toast: "Sistema Atualizado - Uma nova versão está disponível. Por favor, faça login novamente"

---

## 🔧 Arquitetura Técnica

### Arquivos Criados

1. **Configuração**
   - `src/config/security.ts` - Configurações centralizadas de segurança

2. **Versionamento**
   - `src/lib/appVersion.ts` - Gerenciamento de versão do app

3. **Hooks**
   - `src/hooks/useIdleTimeout.ts` - Rastreamento de inatividade
   - `src/hooks/useVersionCheck.ts` - Verificação de versão

4. **Componentes**
   - `src/components/IdleWarningDialog.tsx` - Modal de aviso de inatividade
   - `src/components/UpdateAvailableDialog.tsx` - Modal de atualização

### Integração

- **AuthContext**: Integra ambos os sistemas de segurança
- **Auth.tsx**: Armazena versão após login bem-sucedido
- Ambos os modais são renderizados globalmente no `AuthContext`

---

## ✅ Checklist de Deploy

- [ ] Incrementar versão em `src/lib/appVersion.ts`
- [ ] Commit com mensagem descritiva: `chore: bump version to X.Y.Z`
- [ ] Fazer deploy
- [ ] Verificar se usuários recebem notificação de atualização
- [ ] Testar login após atualização

---

## 🚨 Importante

- **NUNCA** esqueça de incrementar a versão antes de um deploy importante
- **SEMPRE** teste o sistema de logout em ambiente de desenvolvimento
- **COMUNIQUE** aos usuários sobre atualizações importantes via outros canais (email, WhatsApp) se necessário

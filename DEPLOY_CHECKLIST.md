# 📋 Checklist de Deploy - Malta Stock Guardian

Este documento é **OBRIGATÓRIO** antes de qualquer atualização do sistema em produção.

---

## ⚠️ REGRA DE OURO
**NUNCA faça deploy direto em produção. Sempre teste em ambiente de homologação primeiro.**

---

## 🏗️ AMBIENTE DE HOMOLOGAÇÃO

### Como Criar o Ambiente de Teste
1. Abrir o projeto principal no Lovable
2. Clicar no nome do projeto (canto superior esquerdo)
3. Selecionar "Settings" → "Remix this project"
4. Renomear para: **"Malta Stock Guardian - TESTE"**
5. Este ambiente será sua área de testes segura

### Quando Usar o Ambiente de Teste
- ✅ **SEMPRE** antes de qualquer mudança em produção
- ✅ Para testar novas funcionalidades
- ✅ Para validar correções de bugs
- ✅ Para treinar novos usuários
- ✅ Para simular cenários complexos

---

## 📝 ANTES DE PUBLICAR (Botão "Update" no Lovable)

### 1️⃣ Ambiente de Teste
- [ ] Testei TODAS as mudanças no ambiente de homologação?
- [ ] Validei com dados reais (cópia de produção se possível)?
- [ ] Testei os principais fluxos: Cadastro, Relatórios, Retiradas, Substituições?

### 2️⃣ Validações de Banco de Dados
- [ ] Revisei todas as migrations SQL antes de executar?
- [ ] Verifiquei se não há DROP TABLE ou DELETE sem WHERE?
- [ ] Testei as migrations em ambiente de teste primeiro?
- [ ] Confirmei que RLS policies estão corretas e não bloqueiam usuários?

### 3️⃣ Compatibilidade com Dados Antigos
- [ ] Verifiquei se mudanças não quebram funcionalidades antigas?
- [ ] Testei equipamentos com dados legados (cadastrados há meses)?
- [ ] Confirmei que relatórios antigos continuam acessíveis?
- [ ] Validei que histórico de equipamentos permanece intacto?

### 4️⃣ Versionamento
- [ ] Incrementei `APP_VERSION` em `src/lib/appVersion.ts`?
  - Patch (1.0.0 → 1.0.1): Correções pequenas
  - Minor (1.0.0 → 1.1.0): Novas funcionalidades
  - Major (1.0.0 → 2.0.0): Mudanças estruturais grandes
- [ ] Documentei as mudanças no histórico do chat com o Lovable?

### 5️⃣ Comunicação
- [ ] Avisei a equipe sobre a atualização no grupo do WhatsApp?
- [ ] Informei sobre possíveis impactos (ex: "limpar cache do navegador")?
- [ ] Defini horário de menor uso para deploy (final de expediente)?

### 6️⃣ Backup e Rollback
- [ ] Tenho backup do banco de dados antes do deploy?
- [ ] Sei como reverter mudanças via History do Lovable se necessário?
- [ ] Tenho plano B caso algo dê errado?

---

## 🚀 DURANTE O DEPLOY

### Momento Ideal
- ✅ **Preferencial:** Final de expediente (após 17h)
- ✅ **Aceitável:** Horário de almoço (12h-13h)
- ❌ **Evitar:** Horário de pico (9h-11h, 14h-16h)

### Ações
1. Avisar equipe: "Deploy em andamento, aguardem 5 minutos"
2. Clicar no botão "Update" no Lovable (canto superior direito)
3. Aguardar confirmação de deploy bem-sucedido
4. Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

---

## ✅ DEPOIS DO DEPLOY (CRÍTICO!)

### Testes Pós-Deploy (Primeiros 30 minutos)
- [ ] Testei as páginas principais em produção?
  - [ ] /welcome (Dashboard)
  - [ ] /assets (Lista de Equipamentos)
  - [ ] /reports/new (Criar Relatório)
  - [ ] /inventory/material-withdrawal (Retirada de Material)
- [ ] Monitorei error_logs em /admin/error-logs?
- [ ] Verifiquei console do navegador (F12) em busca de erros?
- [ ] Pedi para 1-2 usuários testarem funcionalidades críticas?

### Monitoramento Contínuo (Próximas 2 horas)
- [ ] Equipe confirmou que sistema está funcionando normalmente?
- [ ] Não houve relatos de páginas em branco ou erros?
- [ ] Não houve aumento anormal de erros em /admin/error-logs?

### Caso Algo Dê Errado
1. **NÃO ENTRE EM PÂNICO**
2. Acesse: Project → Settings → History
3. Clique em "Restore" na versão anterior estável
4. Aguarde restauração (pode levar 2-3 minutos)
5. Avise equipe que sistema foi revertido
6. Documente o que deu errado para análise posterior

---

## 📊 TIPOS DE MUDANÇAS E NÍVEIS DE RISCO

### 🟢 BAIXO RISCO (Deploy rápido OK)
- Correções de texto/labels
- Ajustes de estilo/cores
- Melhorias de UI sem lógica de negócio
- Novos botões/links que não afetam dados

### 🟡 MÉDIO RISCO (Testar bem antes)
- Novas funcionalidades
- Mudanças em formulários
- Alterações em validações
- Novos filtros/relatórios

### 🔴 ALTO RISCO (MÁXIMA ATENÇÃO!)
- Mudanças em banco de dados (migrations)
- Alterações em fluxo de substituição de equipamentos
- Modificações em cálculo de estoque
- Mudanças em sistema de permissões
- Atualizações que afetam dados históricos

---

## 🎯 CASOS ESPECIAIS

### Se for Migration Automática
- [ ] Desabilitei execução automática?
- [ ] Transformei em botão manual no Admin → System Integrity?
- [ ] Exibe preview do que será alterado?
- [ ] Pede confirmação explícita antes de executar?

### Se for Mudança em Substitution Flow
- [ ] Testei com equipamento real em teste?
- [ ] Validei que dados de locação são copiados corretamente?
- [ ] Confirmei que histórico é preservado?
- [ ] Verifiquei que ciclos de vida funcionam?

### Se for Alteração de RLS (Row Level Security)
- [ ] Testei com usuário comum (não-admin)?
- [ ] Confirmei que usuário continua vendo seus dados?
- [ ] Verifiquei que não há acesso indevido a dados de outros?

---

## 📞 CONTATOS DE EMERGÊNCIA

**Em caso de problemas graves:**
1. Reverter para versão anterior (History)
2. Avisar no grupo do WhatsApp
3. Contatar desenvolvedor responsável
4. Documentar incidente para análise

---

## 📚 RECURSOS ÚTEIS

- **History do Projeto:** Settings → History
- **Logs de Erro:** /admin/error-logs
- **Integridade do Sistema:** /admin/system-integrity
- **Documentação Lovable:** https://docs.lovable.dev/

---

## ✍️ REGISTRO DE DEPLOYS

Mantenha um registro simples:

```
Data: 21/11/2024 - 17:30
Versão: 1.0.0 → 1.1.0
Mudanças: Implementado sistema de confiabilidade em deploys
Responsável: [Seu Nome]
Problemas: Nenhum
Status: ✅ Sucesso
```

---

**Lembre-se:** É melhor perder 30 minutos testando do que 3 horas corrigindo um erro em produção! 🎯

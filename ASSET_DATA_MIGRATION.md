# Sistema de Migração Automática de Dados de Equipamentos

## 📋 Visão Geral

Este documento descreve o sistema de migração automática implementado para garantir que equipamentos antigos sejam atualizados quando houver modificações importantes no sistema.

## 🎯 Objetivo

Sempre que houver melhorias ou mudanças estruturais no sistema (novos campos, novos status, novas regras de negócio), os equipamentos já cadastrados devem ser automaticamente atualizados para refletir essas mudanças, garantindo consistência e integridade dos dados.

## 🔧 Como Funciona

### Execução Automática
- O sistema de migração é executado **automaticamente** ao abrir a página de Gestão de Patrimônio (`/assets`)
- Roda apenas uma vez por sessão do usuário
- Valida cada equipamento antes de aplicar qualquer mudança
- Exibe notificações ao usuário sobre o resultado das migrações

### Estrutura do Sistema

#### Hook: `useAssetDataMigration.ts`
Localização: `src/hooks/useAssetDataMigration.ts`

Este hook gerencia todo o processo de migração:
- Detecta quando executar as migrações
- Executa múltiplas migrações em paralelo
- Coleta resultados e estatísticas
- Exibe notificações apropriadas ao usuário

#### Integração na Interface
A página `AssetsList.tsx` importa e utiliza o hook:
```typescript
const { isMigrating } = useAssetDataMigration();
```

Durante a migração, o sistema exibe "Atualizando sistema..." ao usuário.

## 📊 Migrações Implementadas

### Migração 1: Equipamentos Substituídos sem Informações de Locação
**Problema:** Quando um equipamento substitui outro, ele deve herdar as informações de empresa, obra e contrato. Em alguns casos antigos, essas informações não foram copiadas corretamente.

**Solução:** 
- Detecta equipamentos em locação sem empresa/obra definida
- Busca o equipamento antigo que foi substituído
- Copia as informações de locação do equipamento antigo para o novo
- Registra o resultado no console

**Exemplo:**
```
PAT 2425 substituiu PAT 2424, mas estava sem empresa/obra
✅ Sistema detecta automaticamente
✅ Copia: Empresa, Obra, Datas de Locação, Número de Contrato
✅ PAT 2425 agora tem todas as informações corretas
```

### Migração 2: Equipamentos com Status Inconsistente
**Problema:** Equipamentos que foram marcados como substituídos (`was_replaced = true`) mas não estão no status correto de manutenção.

**Solução:**
- Detecta equipamentos com `was_replaced = true`
- Verifica se o `location_type` não é `"em_manutencao"`
- Corrige o status automaticamente para `"em_manutencao"`

**Exemplo:**
```
PAT 2424 foi substituído mas estava em status incorreto
✅ Sistema detecta automaticamente
✅ Atualiza status para "Em Manutenção"
✅ Consistência restaurada
```

## 🔔 Notificações ao Usuário

### Sucesso
Quando equipamentos são migrados com sucesso:
```
✅ Sistema atualizado: X equipamento(s) migrado(s) com sucesso
```

### Avisos
Quando algum equipamento não pode ser atualizado automaticamente:
```
⚠️ X equipamento(s) requerem atualização manual
Verifique os equipamentos destacados na lista
```

### Erros
Se houver erro geral no processo:
```
❌ Erro ao atualizar sistema. Algumas atualizações podem não ter sido aplicadas.
```

## 🚀 Adicionando Novas Migrações

Para adicionar uma nova migração quando houver mudanças no sistema:

### Passo 1: Criar a Função de Migração
No arquivo `useAssetDataMigration.ts`, adicione uma nova função:

```typescript
const migrateNomeDaSuaMigracao = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    // 1. Buscar equipamentos que precisam de migração
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .filter("sua_condição", "eq", "seu_valor");

    if (error) throw error;
    if (!data || data.length === 0) return result;

    // 2. Para cada equipamento, aplicar a migração
    for (const asset of data) {
      try {
        const { error: updateError } = await supabase
          .from("assets")
          .update({
            // Suas atualizações aqui
          })
          .eq("id", asset.id);

        if (updateError) throw updateError;
        
        result.migratedCount++;
        console.log(`✅ PAT ${asset.asset_code}: Sua mensagem de sucesso`);
      } catch (error) {
        result.failedCount++;
        result.errors.push(`PAT ${asset.asset_code}: ${error.message}`);
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Erro geral: ${error.message}`);
  }

  return result;
};
```

### Passo 2: Adicionar ao Array de Migrações
Na função `runMigrations`, adicione sua nova migração:

```typescript
const results = await Promise.all([
  migrateReplacedAssetsWithoutRentalInfo(),
  migrateAssetsWithInconsistentStatus(),
  migrateNomeDaSuaMigracao(), // ← Adicione aqui
]);
```

## ✅ Validações e Segurança

1. **Validação Antes da Atualização**: Cada migração valida se o equipamento realmente precisa ser atualizado antes de fazer qualquer mudança
2. **Transações Independentes**: Cada equipamento é atualizado em sua própria transação. Se um falhar, os outros continuam
3. **Log Detalhado**: Todos os sucessos e erros são registrados no console para auditoria
4. **Execução Única**: Cada usuário executa as migrações apenas uma vez por sessão
5. **Sem Bloqueio**: A interface permanece responsiva durante as migrações

## 📝 Exemplo Prático: Caso PAT 2424 e 2425

### Situação Inicial (Antes da Migração)
```
PAT 2424: 
  - location_type: "aguardando_laudo" ❌ (deveria ser "em_manutencao")
  - was_replaced: true
  - rental_company: "Empresa X"
  - rental_work_site: "Obra Y"

PAT 2425:
  - location_type: "locacao"
  - rental_company: null ❌ (deveria herdar de 2424)
  - rental_work_site: null ❌ (deveria herdar de 2424)
  - replaced_by_asset_id: "uuid-do-2424"
```

### Após a Migração Automática
```
PAT 2424: 
  - location_type: "em_manutencao" ✅ (corrigido)
  - was_replaced: true
  - rental_company: "Empresa X" (preservado)
  - rental_work_site: "Obra Y" (preservado)

PAT 2425:
  - location_type: "locacao"
  - rental_company: "Empresa X" ✅ (herdado)
  - rental_work_site: "Obra Y" ✅ (herdado)
  - rental_start_date: [copiado] ✅
  - rental_end_date: [copiado] ✅
  - rental_contract_number: [copiado] ✅
```

## 🎯 Regra de Ouro

**Sempre que houver mudanças estruturais ou melhorias no sistema que afetem como os dados devem ser armazenados ou relacionados, adicione uma migração correspondente para atualizar equipamentos existentes.**

Isso garante que:
- ✅ Todos os equipamentos seguem as mesmas regras
- ✅ Não há inconsistências entre equipamentos novos e antigos
- ✅ O sistema mantém integridade de dados
- ✅ Usuários não precisam corrigir dados manualmente

## 🔍 Monitoramento

Para verificar o resultado das migrações, consulte o console do navegador (F12 → Console):
```
✅ PAT XXXX: Informações de locação restauradas
✅ PAT YYYY: Status corrigido para manutenção
```

Erros também são registrados:
```
❌ Erro ao migrar PAT ZZZZ: [mensagem do erro]
```

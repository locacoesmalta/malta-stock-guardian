

## Plano: Limpar TODOS os registros da tabela user_presence

### O que sera feito
Executar o comando SQL para deletar todos os registros da tabela `user_presence`, ja que o hook de presenca esta desativado e esses dados sao apenas temporarios (quem esta online).

```sql
DELETE FROM user_presence;
```

### Por que limpar tudo (e nao so is_online = false)
- O hook ja esta desativado, entao nenhum registro novo sera criado
- Mesmo registros com `is_online = true` estao desatualizados e inuteis
- Libera mais espaco no banco de dados

### Seguranca
- Zero impacto em dados de negocio (equipamentos, estoque, relatorios, auditoria)
- Tabela contem apenas dados temporarios de sessao
- Quando reativarmos o hook futuramente, os registros serao recriados automaticamente


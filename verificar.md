# Sistema de Verificação e Liberação Automática de Resultados

## Visão Geral

Este sistema automatiza o processo de liberação de resultados para clientes que completaram todos os requisitos necessários na plataforma "Área do Aluno - Alê Grimaldi".

## Funcionamento

### Critérios para Liberação

Um cliente será automaticamente liberado quando atender **TODOS** os seguintes critérios:

1. ✅ **Avaliação Física Completa**
   - Deve existir um registro na tabela `avaliacao_fisica` para o `user_id` do cliente

2. ✅ **Avaliação Nutricional Completa**
   - Deve existir um registro na tabela `avaliacao_nutricional` (masculina) OU
   - Deve existir um registro na tabela `avaliacao_nutricional_feminino` (feminina)

3. ✅ **4 Fotos de Progresso Enviadas**
   - `foto_frente_url` preenchida (não NULL e não vazia)
   - `foto_costas_url` preenchida (não NULL e não vazia)
   - `foto_lateral_direita_url` preenchida (não NULL e não vazia)
   - `foto_lateral_esquerda_url` preenchida (não NULL e não vazia)

4. ✅ **Laudo Médico Aprovado (se aplicável)**
   - Se `laudo_aprovado` é NULL: cliente sem laudo (pode ser liberado)
   - Se `laudo_aprovado` existe: deve estar com valor "aprovado" (não "pendente")

### Processo Automático

O sistema verifica diariamente às **8h da manhã** via N8n:

1. Executa o RPC `verificar_clientes_liberacao()`
2. Identifica clientes que atendem todos os critérios
3. Atualiza a coluna `liberado` de "nao" para "sim" na tabela `perfis`
4. Retorna lista com telefones dos clientes liberados

## RPC Function: `verificar_clientes_liberacao()`

### Parâmetros
- **Entrada**: Nenhum parâmetro necessário
- **Tipo**: RPC (Remote Procedure Call)
- **Execução**: SECURITY DEFINER (executa com privilégios elevados)

### Retorno
Retorna uma tabela com as seguintes colunas:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `telefone` | TEXT | Telefone do cliente liberado |
| `nome_completo` | TEXT | Nome completo do cliente |
| `user_id` | UUID | ID único do usuário |
| `liberado_anteriormente` | TEXT | Status anterior ("nao" ou NULL) |
| `liberado_agora` | TEXT | Novo status ("sim") |

### Exemplo de Uso

#### Via SQL
```sql
SELECT * FROM verificar_clientes_liberacao();
```

#### Via API REST (N8n)
```http
POST https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_clientes_liberacao
Content-Type: application/json
Authorization: Bearer [SUPABASE_ANON_KEY]

{}
```

#### Via cURL (Exemplo prático)
```bash
curl -X POST 'https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_clientes_liberacao' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0' \
  -H 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0' \
  -d '{}'
```

#### Resposta de Exemplo
```json
[
  {
    "telefone": "11999887766",
    "nome_completo": "João Silva",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "liberado_anteriormente": "nao",
    "liberado_agora": "sim"
  },
  {
    "telefone": "11888776655", 
    "nome_completo": "Maria Santos",
    "user_id": "987f6543-e21b-98d7-b654-321098765432",
    "liberado_anteriormente": null,
    "liberado_agora": "sim"
  }
]
```

## Configuração N8n

### Workflow Diário

1. **Trigger**: Cron - Todos os dias às 8:00 AM
2. **HTTP Request Node**: 
   - Method: POST
   - URL: `https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_clientes_liberacao`
   - Headers:
     ```
     Content-Type: application/json
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0
     apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0
     ```
   - Body: `{}`

3. **Processamento de Resposta**:
   - Filtra apenas clientes que foram realmente liberados
   - Extrai telefones para possível notificação
   - Registra log da execução

### Exemplo de N8n Workflow

```json
{
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "hour": 8,
          "minute": 0
        }
      }
    },
    {
      "name": "Verificar Clientes",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_clientes_liberacao",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0"
        },
        "body": "{}"
      }
    }
  ]
}
```

## Segurança e Permissões

### RLS (Row Level Security)
- A function possui `SECURITY DEFINER`, executando com privilégios do proprietário
- Permissões concedidas para usuários `anon` e `authenticated`
- Não expõe dados sensíveis além dos necessários para o N8n

### Logs de Auditoria
O sistema mantém registro através de:
- Timestamps nas tabelas de perfis
- Retorno detalhado da function com status anterior e atual
- Logs do N8n para acompanhamento das execuções

## Troubleshooting

### Problemas Comuns

#### Cliente não foi liberado automaticamente
1. Verificar se todas as avaliações foram preenchidas
2. Confirmar se as 4 fotos foram enviadas corretamente
3. Verificar se o status atual não é "sim"

#### RPC retorna erro
1. Verificar permissões da function
2. Confirmar se as tabelas existem
3. Validar estrutura do banco de dados

#### N8n não executa
1. Verificar credenciais do Supabase
2. Confirmar URL do endpoint
3. Validar configuração do cron

### Comandos de Verificação

```sql
-- Verificar clientes elegíveis manualmente
SELECT 
  p.nome_completo,
  p.telefone,
  p.liberado,
  p.laudo_aprovado,
  CASE WHEN af.id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_avaliacao_fisica,
  CASE WHEN (an.id IS NOT NULL OR anf.id IS NOT NULL) THEN 'SIM' ELSE 'NÃO' END as tem_avaliacao_nutricional,
  CASE WHEN (
    p.foto_frente_url IS NOT NULL AND p.foto_frente_url != '' AND
    p.foto_costas_url IS NOT NULL AND p.foto_costas_url != '' AND
    p.foto_lateral_direita_url IS NOT NULL AND p.foto_lateral_direita_url != '' AND
    p.foto_lateral_esquerda_url IS NOT NULL AND p.foto_lateral_esquerda_url != ''
  ) THEN 'SIM' ELSE 'NÃO' END as tem_4_fotos_validas,
  CASE WHEN (
    p.laudo_aprovado IS NULL OR p.laudo_aprovado = 'aprovado'
  ) THEN 'SIM' ELSE 'NÃO' END as laudo_ok
FROM perfis p
LEFT JOIN avaliacao_fisica af ON af.user_id = p.user_id
LEFT JOIN avaliacao_nutricional an ON an.user_id = p.user_id  
LEFT JOIN avaliacao_nutricional_feminino anf ON anf.user_id = p.user_id
WHERE p.role = 'cliente'
  AND p.liberado != 'sim'
ORDER BY p.created_at DESC;
```

## Histórico de Alterações

### v1.1 - Correções de Bugs
- **CORRIGIDO**: Verificação de fotos vazias (URLs `""` não são mais aceitas)
- **ADICIONADO**: Verificação de laudo médico aprovado
- **ATUALIZADO**: RPC `verificar_clientes_liberacao()` com critérios corretos
- **ATUALIZADO**: Documentação com novos critérios e comandos de verificação

### v1.0 - Implementação Inicial
- Criação do RPC `verificar_clientes_liberacao()`
- Documentação técnica completa
- Configuração para integração N8n
- Critérios de liberação definidos

---

## Contato Técnico

Para dúvidas sobre a implementação ou configuração, consulte o desenvolvedor responsável pelo sistema.

**Projeto ID Supabase**: `nbzblkwylsgnafsegzot`
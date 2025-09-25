# Sistema RPC de Acompanhamento Automático de Clientes

## Resumo do Projeto

Sistema automatizado para acompanhamento e lembretes personalizados de clientes que completaram formulários e precisam enviar fotos de progresso. Executa diariamente via N8n/WhatsApp.

## Implementações Realizadas

### 1. Tabela `acompanhamento_clientes`

Nova tabela para controle de progresso individual com sistema de follow-up:

```sql
CREATE TABLE acompanhamento_clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telefone TEXT NOT NULL,
    data_ultimo_formulario TIMESTAMP WITH TIME ZONE,
    proxima_acao TEXT,
    contador_fotos INTEGER DEFAULT 0,
    status_atual TEXT DEFAULT 'aguardando_formularios',
    data_ultima_verificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultima_acao_pedida TEXT,
    data_ultima_solicitacao TIMESTAMP WITH TIME ZONE,
    numero_follow_ups INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

### 2. RPC `verificar_acompanhamento_clientes()`

**Função**: Verificação diária automática de clientes elegíveis para próximas ações

**Parâmetros**: Nenhum

**Lógica de Verificação**:
- Verifica apenas clientes não liberados (`liberado != 'sim'`)
- Checa formulário físico: tabela `avaliacao_fisica`
- Checa formulário nutricional baseado no sexo:
  - Masculino: `avaliacao_nutricional`
  - Feminino: `avaliacao_nutricional_feminino`
- Conta fotos enviadas nos campos `foto_*_url` da tabela `perfis`
- Executa apenas se passou 1+ dias desde última solicitação

**Sistema de Follow-up Inteligente**:
- **Primeira Solicitação**: Quando é uma nova ação (ex: primeira vez pedindo foto frente)
- **Follow-up**: Quando a mesma ação já foi pedida antes mas não foi cumprida
- Mensagens diferentes para cada tipo (inicial vs. follow-up)
- Escalação de tom nas mensagens de follow-up (1º, 2º, 3º+ tentativas)

**Cronograma de Ações**:
1. Após ambos formulários preenchidos (1+ dias) → Solicitar foto frente
2. Se foto frente não enviada → Follow-ups diários da foto frente
3. Após foto frente enviada → Solicitar foto costas (reset follow-ups)
4. Se foto costas não enviada → Follow-ups diários da foto costas
5. Processo continua até todas 4 fotos serem enviadas

### 3. Sistema de Triggers Automáticos

Triggers criados para atualização automática:

- `trigger_acompanhamento_fisica` - Na tabela `avaliacao_fisica`
- `trigger_acompanhamento_nutricional` - Na tabela `avaliacao_nutricional`
- `trigger_acompanhamento_nutricional_fem` - Na tabela `avaliacao_nutricional_feminino`
- `trigger_acompanhamento_fotos` - Na tabela `perfis` (campos de foto)

## Configuração da API

- **URL Base**: `https://nbzblkwylsgnafsegzot.supabase.co`
- **Endpoint**: `/rest/v1/rpc/verificar_acompanhamento_clientes`
- **Método**: POST
- **Headers necessários**:
  - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0`
  - `Content-Type`: `application/json`

## Exemplo de Uso

### CURL (Exemplo para N8n)

```bash
curl -X POST 'https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_acompanhamento_clientes' \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Content-Type: application/json" \
-d '{}'
```

### Resposta de Exemplo

```json
[
  {
    "telefone": "11999887766",
    "nome_completo": "João Silva",
    "sexo": "masculino",
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "proxima_acao": "solicitar_foto_frente",
    "mensagem": "Oi João Silva! Vi que você preencheu os formulários físico e nutricional. Agora preciso da primeira foto - de frente, braços ao lado do corpo.",
    "status_anterior": "aguardando_formularios",
    "status_atual": "solicitando_fotos",
    "tipo_solicitacao": "inicial",
    "numero_follow_up": 0
  },
  {
    "telefone": "11888776655",
    "nome_completo": "Maria Santos",
    "sexo": "feminino", 
    "user_id": "987f6543-e21b-98d7-b654-321098765432",
    "proxima_acao": "solicitar_foto_frente",
    "mensagem": "Oi Maria Santos! Ainda estou aguardando sua foto de frente. É importante para criarmos seu plano personalizado!",
    "status_anterior": "solicitando_fotos",
    "status_atual": "solicitando_fotos",
    "tipo_solicitacao": "followup",
    "numero_follow_up": 1
  }
]
```

### Resposta Vazia

```json
[]
```
*(Quando não há clientes elegíveis para ações)*

## Configuração N8n

### Workflow Diário

1. **Trigger**: Cron - Todos os dias às 8:00 AM
2. **HTTP Request Node**: 
   - Method: POST
   - URL: `https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_acompanhamento_clientes`
   - Headers:
     ```
     Content-Type: application/json
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0
     apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0
     ```
   - Body: `{}`

3. **Processamento de Respostas**:
   - Para cada item retornado, enviar WhatsApp com `mensagem`
   - Usar `telefone` como destinatário
   - Registrar log da execução

### Exemplo de Workflow N8n

```javascript
// No nó Function do n8n - Processar resposta do RPC
const acompanhamentos = $json;

if (Array.isArray(acompanhamentos) && acompanhamentos.length > 0) {
  const mensagens = [];
  
  acompanhamentos.forEach(cliente => {
    mensagens.push({
      telefone: cliente.telefone,
      mensagem: cliente.mensagem,
      nome: cliente.nome_completo,
      acao: cliente.proxima_acao
    });
  });
  
  return mensagens;
} else {
  // Nenhum cliente elegível hoje
  return [{ 
    log: "Nenhum cliente elegível para acompanhamento hoje",
    timestamp: new Date().toISOString()
  }];
}
```

## Mensagens Automáticas

### Sistema de Mensagens Inteligentes

O sistema diferencia entre **mensagens iniciais** (primeira vez pedindo) e **mensagens de follow-up** (cobrança da mesma ação).

### Templates de Mensagem - Foto Frente

**Inicial** (`tipo_solicitacao: "inicial"`, `numero_follow_up: 0`):
> "Oi [NOME]! Vi que você preencheu os formulários físico e nutricional. Agora preciso da primeira foto - de frente, braços ao lado do corpo."

**1º Follow-up** (`tipo_solicitacao: "followup"`, `numero_follow_up: 1`):
> "Oi [NOME]! Ainda estou aguardando sua foto de frente. É importante para criarmos seu plano personalizado!"

**2º Follow-up** (`tipo_solicitacao: "followup"`, `numero_follow_up: 2`):
> "Oi [NOME]! Lembrete: preciso da sua foto de frente para continuar com sua análise. Pode enviar quando conseguir?"

**3º+ Follow-up** (`tipo_solicitacao: "followup"`, `numero_follow_up: 3+`):
> "Oi [NOME]! Ainda preciso da foto de frente. Se tiver alguma dúvida sobre como tirar, pode me perguntar!"

### Templates de Mensagem - Foto Costas

**Inicial**:
> "Oi [NOME]! Foto de frente recebida! Agora preciso da foto de costas."

**1º Follow-up**:
> "Oi [NOME]! Ainda preciso da sua foto de costas para completar a análise."

**2º+ Follow-up**:
> "Oi [NOME]! Lembrete: ainda estou aguardando a foto de costas. É a próxima etapa!"

### Templates de Mensagem - Demais Fotos

**Foto Lateral Direita**:
- Inicial: "Oi [NOME]! Ótimo progresso! Agora preciso da foto do lado direito."
- Follow-up: "Oi [NOME]! Ainda preciso da foto do seu lado direito para continuar."

**Foto Lateral Esquerda**:
- Inicial: "Oi [NOME]! Quase lá! Última foto - lado esquerdo, por favor."
- Follow-up: "Oi [NOME]! Última foto faltando - lado esquerdo. Vamos finalizar?"

**Completo**:
> "Perfeito [NOME]! Todas as fotos recebidas. Estou analisando seu perfil e em breve você receberá seu plano personalizado!"

## Integração com Outros Sistemas

### Funciona em conjunto com:

1. **RPC `get_customer_summary_by_phone`** - Status geral do cliente
2. **RPC `upload_progress_photo`** - Upload de fotos  
3. **RPC `verificar_clientes_liberacao`** - Liberação automática
4. **Sistema de fotos de progresso** - Controle de uploads

### Fluxo Integrado:

```
Compra → Formulários → RPC Acompanhamento → Fotos → Liberação Automática
```

## Estados dos Clientes

| Status | Descrição | Próxima Ação |
|--------|-----------|---------------|
| `aguardando_formularios` | Ainda não preencheu ambos formulários | Aguardar preenchimento |
| `solicitando_fotos` | Formulários OK, coletando fotos | Solicitar próxima foto |
| `completo` | Todas fotos enviadas | Análise e criação do plano |

## Segurança e Permissões

### RLS (Row Level Security)
- Função possui `SECURITY DEFINER`, executando com privilégios elevados
- Permissões concedidas para usuários `anon` e `authenticated`
- Acesso limitado apenas aos dados necessários

### Proteções Implementadas
- Validação de sexo para tabela nutricional correta
- Verificação de timing (1+ dias entre ações)
- Prevenção de spam/execução excessiva
- Logs automáticos de auditoria

## Troubleshooting

### Problemas Comuns

#### RPC retorna vazio
1. Verificar se há clientes não liberados (`liberado != 'sim'`)
2. Confirmar se clientes têm ambos formulários preenchidos
3. Verificar se passou 1+ dias desde última verificação

#### Cliente não aparece na lista
1. Verificar se `liberado = 'nao'` ou `NULL`
2. Confirmar preenchimento correto dos formulários:
   - Masculino: `avaliacao_fisica` + `avaliacao_nutricional`
   - Feminino: `avaliacao_fisica` + `avaliacao_nutricional_feminino`
3. Verificar se não passou para status `completo`

#### Mensagens duplicadas
1. Verificar se N8n não está executando múltiplas vezes
2. Confirmar que o RPC respeita o timing de 1+ dias
3. Verificar logs da tabela `acompanhamento_clientes`

### Comandos de Verificação

```sql
-- Ver clientes elegíveis manualmente
SELECT 
  p.nome_completo,
  p.telefone,
  p.sexo,
  p.liberado,
  CASE WHEN af.id IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_fisica,
  CASE WHEN (an.id IS NOT NULL OR anf.id IS NOT NULL) THEN 'SIM' ELSE 'NÃO' END as tem_nutricional,
  (CASE WHEN p.foto_frente_url IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN p.foto_costas_url IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN p.foto_lateral_direita_url IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN p.foto_lateral_esquerda_url IS NOT NULL THEN 1 ELSE 0 END) as contador_fotos,
  ac.status_atual,
  ac.data_ultima_verificacao
FROM perfis p
LEFT JOIN avaliacao_fisica af ON af.user_id = p.user_id
LEFT JOIN avaliacao_nutricional an ON an.user_id = p.user_id  
LEFT JOIN avaliacao_nutricional_feminino anf ON anf.user_id = p.user_id
LEFT JOIN acompanhamento_clientes ac ON ac.user_id = p.user_id
WHERE p.role = 'cliente'
  AND (p.liberado != 'sim' OR p.liberado IS NULL)
ORDER BY p.created_at DESC;

-- Ver histórico de acompanhamento
SELECT * FROM acompanhamento_clientes ORDER BY updated_at DESC;
```

## Monitoramento

### Métricas Importantes
- Taxa de resposta dos clientes às solicitações
- Tempo médio entre formulários e primeira foto
- Taxa de completude do processo (4 fotos)
- Eficácia das mensagens automáticas

### Logs Disponíveis
- Tabela `acompanhamento_clientes` - Histórico completo
- Timestamps de `data_ultima_verificacao` 
- Status transitions na coluna `status_atual`

## Cenários de Exemplo

### Cenário 1: Cliente Novo
**Dia 1**: Cliente preenche formulários físico e nutricional
- Sistema registra na tabela `acompanhamento_clientes`

**Dia 2**: RPC executa às 8h
- Retorna: `tipo_solicitacao: "inicial"`, `numero_follow_up: 0`
- Mensagem: "Oi João! Vi que você preencheu os formulários... primeira foto de frente"

### Cenário 2: Cliente Não Responde
**Dia 3**: Cliente não enviou foto de frente
- Retorna: `tipo_solicitacao: "followup"`, `numero_follow_up: 1`
- Mensagem: "Oi João! Ainda estou aguardando sua foto de frente..."

**Dia 4**: Cliente ainda não enviou
- Retorna: `tipo_solicitacao: "followup"`, `numero_follow_up: 2`
- Mensagem: "Oi João! Lembrete: preciso da sua foto de frente..."

### Cenário 3: Cliente Responde
**Dia 5**: Cliente envia foto de frente
- Sistema detecta mudança, reseta follow-ups
- Retorna: `tipo_solicitacao: "inicial"`, `numero_follow_up: 0`
- Mensagem: "Oi João! Foto de frente recebida! Agora a de costas"

### Cenário 4: Processo Completo
O ciclo continua para cada foto até todas serem enviadas, sempre diferenciando entre primeira solicitação e follow-ups.

## Histórico de Alterações

### v2.0 - Sistema de Follow-up Inteligente
- Adicionados campos `ultima_acao_pedida`, `data_ultima_solicitacao`, `numero_follow_ups`
- RPC atualizado com lógica de follow-up diferenciada
- Mensagens específicas para inicial vs. follow-up
- Escalação de tom nas mensagens de follow-up
- Documentação completa com exemplos

### v1.0 - Implementação Inicial
- Criação da tabela `acompanhamento_clientes`
- RPC `verificar_acompanhamento_clientes()` com lógica nutricional por sexo
- Sistema de triggers automáticos
- Integração preparada para N8n
- Documentação técnica completa

---

## Contato Técnico

Para dúvidas sobre implementação ou configuração, consulte o desenvolvedor responsável.

**Projeto ID Supabase**: `nbzblkwylsgnafsegzot`  
**Sistema**: Área do Aluno - Alê Grimaldi
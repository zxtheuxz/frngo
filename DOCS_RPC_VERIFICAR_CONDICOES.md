# Documentação - RPC verificar_condicoes_analise_corporal

## Descrição
Função RPC que verifica se um usuário está apto para realizar análise corporal, checando se possui as fotos necessárias e avaliação nutricional preenchida.

## Parâmetros
- `p_user_id` (UUID): ID do usuário a ser verificado

## Retorno
Retorna um objeto JSON com a seguinte estrutura:

```json
{
  "status": "APTO" | "NAO_APTO",
  "tem_fotos": boolean,
  "tem_avaliacao_nutricional": boolean,
  "detalhes": {
    "foto_lateral": boolean,
    "foto_abertura": boolean,
    "tipo_avaliacao": "masculino" | "feminino" | "ambos" | null,
    "sexo_perfil": string,
    "avaliacao_masculina": boolean,
    "avaliacao_feminina": boolean
  }
}
```

### Campos:
- **status**: "APTO" se o usuário tem ambas as fotos E avaliação nutricional, "NAO_APTO" caso contrário
- **tem_fotos**: true se tem ambas as fotos (lateral e abertura)
- **tem_avaliacao_nutricional**: true se tem pelo menos uma avaliação nutricional
- **detalhes**: Informações detalhadas sobre cada condição

## Como usar via cURL

### Exemplo de requisição:

```bash
curl -X POST 'https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/verificar_condicoes_analise_corporal' \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
  -H "Content-Type: application/json" \
  -d '{"p_user_id": "123e4567-e89b-12d3-a456-426614174000"}'
```

### Exemplo com variáveis (mais fácil de usar):

```bash
# Definir variáveis
SUPABASE_URL="https://nbzblkwylsgnafsegzot.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0"
USER_ID="seu-user-id-aqui"

# Fazer a requisição
curl -X POST "$SUPABASE_URL/rest/v1/rpc/verificar_condicoes_analise_corporal" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"p_user_id\": \"$USER_ID\"}"
```

## Exemplos de resposta

### Usuário APTO (tem tudo necessário):
```json
{
  "status": "APTO",
  "tem_fotos": true,
  "tem_avaliacao_nutricional": true,
  "detalhes": {
    "foto_lateral": true,
    "foto_abertura": true,
    "tipo_avaliacao": "feminino",
    "sexo_perfil": "feminino",
    "avaliacao_masculina": false,
    "avaliacao_feminina": true
  }
}
```

### Usuário NAO_APTO (faltam fotos):
```json
{
  "status": "NAO_APTO",
  "tem_fotos": false,
  "tem_avaliacao_nutricional": true,
  "detalhes": {
    "foto_lateral": false,
    "foto_abertura": false,
    "tipo_avaliacao": "masculino",
    "sexo_perfil": "masculino",
    "avaliacao_masculina": true,
    "avaliacao_feminina": false
  }
}
```

### Perfil não encontrado:
```json
{
  "status": "NAO_APTO",
  "tem_fotos": false,
  "tem_avaliacao_nutricional": false,
  "detalhes": {
    "erro": "Perfil não encontrado"
  }
}
```

## Integração com aplicações

### JavaScript/TypeScript:
```javascript
const verificarCondicoes = async (userId) => {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/rpc/verificar_condicoes_analise_corporal`,
    {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_user_id: userId })
    }
  );
  
  const data = await response.json();
  return data;
};
```

### Python:
```python
import requests

def verificar_condicoes(user_id):
    url = f"{SUPABASE_URL}/rest/v1/rpc/verificar_condicoes_analise_corporal"
    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {ANON_KEY}",
        "Content-Type": "application/json"
    }
    data = {"p_user_id": user_id}
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()
```
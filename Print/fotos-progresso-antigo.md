# Sistema de Fotos de Progresso - WhatsApp + Supabase

## Resumo do Projeto

Sistema completo para coleta de fotos de progresso físico via WhatsApp/n8n, com armazenamento automático no Supabase Storage e controle de completude.

## Implementações Realizadas

### 1. Modificações na Tabela `perfis`

Adicionadas 4 novas colunas para armazenar URLs das fotos:

```sql
ALTER TABLE perfis 
ADD COLUMN foto_frente_url TEXT,
ADD COLUMN foto_costas_url TEXT,
ADD COLUMN foto_lateral_direita_url TEXT,
ADD COLUMN foto_lateral_esquerda_url TEXT;
```

### 2. RPC `upload_progress_photo`

**Função**: Upload de fotos via Base64 (formato recebido do WhatsApp/n8n)

**Parâmetros:**
- `user_phone` (TEXT) - Telefone do usuário
- `photo_base64` (TEXT) - Imagem em Base64
- `photo_position` (TEXT) - Posição: 'frente', 'costas', 'lateral_direita', 'lateral_esquerda'

**Funcionalidades:**
- Valida posição da foto
- Busca usuário pelo telefone
- Decodifica Base64 automaticamente
- Gera nome único com timestamp
- **Upload real no Supabase Storage** (estrutura: `{user_id}/posicao_timestamp.jpg`)
- Cria registro na tabela `storage.objects`
- Atualiza coluna correspondente na tabela perfis
- Retorna status de progresso

### 3. RPC `get_user_progress_photos`

**Função**: Consulta status das fotos do usuário

**Parâmetros:**
- `user_phone` (TEXT) - Telefone do usuário

**Retorno:**
- URLs de todas as 4 fotos
- Status de completude
- Fotos restantes
- Próxima ação sugerida

## Configuração da API

- **URL Base**: `https://nbzblkwylsgnafsegzot.supabase.co`
- **Headers necessários**:
  - `apikey`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0`
  - `Authorization`: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0`
  - `Content-Type`: `application/json`

## Exemplos de Uso

### 1. Upload de Foto (CURL)


```bash
# Upload foto de costas (exemplo real testado)
curl -X POST 'https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/upload_progress_photo' \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Content-Type: application/json" \
-d '{
  "user_phone": "11960297621",
  "photo_base64": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=",
  "photo_position": "costas"
}'
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "photo_url": "https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/progress-photos/70ac0b64-619d-4a1b-8358-7859633a23f7/costas_1750821753.jpg",
  "photo_position": "costas",
  "photos_completed": 2,
  "total_photos": 4,
  "remaining_photos": ["lateral_esquerda", "lateral_direita"],
  "all_photos_completed": false,
  "message": "Foto de costas salva! Faltam 2 fotos."
}
```

### 2. Consultar Status das Fotos (CURL)

```bash
curl -X POST 'https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/get_user_progress_photos' \
-H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzOTY1NzEsImV4cCI6MjA1NTk3MjU3MX0.i5nSGgaKz0e31JKvqteBPW0vC8hCVLYBpGPpmbOLPU0" \
-H "Content-Type: application/json" \
-d '{
  "user_phone": "11960297621"
}'
```

**Resposta (usuário sem fotos):**
```json
{
  "success": true,
  "user_info": {
    "nome": "Alessandra Grimaldi",
    "telefone": "21979701880",
    "user_id": "bff2a248-bc10-40a7-b7f5-71005ea63ba0"
  },
  "photos": {
    "frente": {
      "url": null,
      "uploaded": false
    },
    "costas": {
      "url": null,
      "uploaded": false
    },
    "lateral_direita": {
      "url": null,
      "uploaded": false
    },
    "lateral_esquerda": {
      "url": null,
      "uploaded": false
    }
  },
  "summary": {
    "photos_completed": 0,
    "total_photos": 4,
    "remaining_photos": ["frente", "costas", "lateral_direita", "lateral_esquerda"],
    "all_photos_completed": false,
    "completion_percentage": 0
  },
  "next_action": "Solicitar primeira foto (frente)"
}
```

## Integração com n8n

### Estrutura do Workflow Sugerida:

1. **Receber Mensagem WhatsApp**
   - Extrair número do telefone
   - Verificar se contém imagem

2. **Verificar Status do Cliente**
   - Chamar `get_customer_summary_by_phone` (do primeiro RPC)
   - Verificar se já comprou e preencheu avaliações

3. **Gerenciar Coleta de Fotos**
   - Chamar `get_user_progress_photos` para ver status atual
   - Se não completou as 4 fotos, solicitar próxima

4. **Processar Upload**
   - Quando receber foto, chamar `upload_progress_photo`
   - Verificar resposta para determinar próxima ação

### Exemplo de Lógica n8n (JavaScript):

```javascript
// No nó Function do n8n
const phoneNumber = $json.from; // número do WhatsApp
const hasImage = $json.type === 'image';
const imageBase64 = $json.body; // imagem em base64

if (hasImage) {
  // Primeiro, verificar qual posição solicitar
  const statusResponse = await fetch('https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/get_user_progress_photos', {
    method: 'POST',
    headers: {
      'apikey': 'SUA_API_KEY',
      'Authorization': 'Bearer SUA_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_phone: phoneNumber })
  });
  
  const status = await statusResponse.json();
  
  if (status.remaining_photos.length > 0) {
    // Determinar qual posição esta foto representa
    const photoPosition = status.remaining_photos[0]; // ou lógica mais complexa
    
    // Fazer upload
    const uploadResponse = await fetch('https://nbzblkwylsgnafsegzot.supabase.co/rest/v1/rpc/upload_progress_photo', {
      method: 'POST',
      headers: {
        'apikey': 'SUA_API_KEY',
        'Authorization': 'Bearer SUA_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_phone: phoneNumber,
        photo_base64: imageBase64,
        photo_position: photoPosition
      })
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResult.success) {
      if (uploadResult.all_photos_completed) {
        return [{ 
          message: "Perfeito! Todas as 4 fotos foram recebidas. Agora vou analisar e em breve você receberá seu plano personalizado!" 
        }];
      } else {
        const nextPhoto = uploadResult.remaining_photos[0];
        return [{ 
          message: `${uploadResult.message} Agora envie sua foto de ${nextPhoto}.` 
        }];
      }
    }
  }
}
```

## Estrutura no Storage

```
progress-photos/
├── 70ac0b64-619d-4a1b-8358-7859633a23f7/    # Cliente 11960297621 (Matheus)
│   ├── frente_1750782328.jpg                 # ✅ Uploaded
│   ├── costas_1750821753.jpg                 # ✅ Uploaded  
│   ├── lateral_direita_[timestamp].jpg       # ⏳ Pendente
│   └── lateral_esquerda_[timestamp].jpg      # ⏳ Pendente
└── bff2a248-bc10-40a7-b7f5-71005ea63ba0/    # Outros usuários
    ├── frente_1750771600.jpg
    └── ...
```

## Casos de Uso para o Agente

### 1. Cliente Novo
- Verificar se já comprou
- Se comprou, verificar se preencheu avaliações
- Se tudo OK, iniciar coleta de fotos

### 2. Coleta de Fotos
```
Agente: "Para criar seu plano personalizado, preciso de 4 fotos suas. Vamos começar pela foto de frente. Fique em pé, de frente para a câmera, braços ao lado do corpo."

Cliente: [envia foto]

Agente: "Foto de frente recebida! Agora envie a foto de costas."

Cliente: [envia foto]

Agente: "Foto de costas recebida! Agora preciso da foto do seu lado direito."

...

Agente: "Perfeito! Todas as fotos foram recebidas. Analisando seu físico agora..."
```

### 3. Controle de Estado
- O sistema automaticamente sabe qual foto solicitar next
- Previne uploads duplicados
- Mantém progresso mesmo se conversa for interrompida

## Melhorias Futuras

1. ✅ **Storage Real**: ~~Integrar com API real do Supabase Storage~~ (CONCLUÍDO)
2. **Validação de Imagem**: Verificar se é realmente uma foto válida
3. **Compressão**: Reduzir tamanho das imagens automaticamente
4. **Backup**: Sistema de backup das fotos
5. **Analytics**: Acompanhar taxa de completude das fotos

## Notas Importantes

- ✅ Sistema testado e funcionando **EM PRODUÇÃO**
- ✅ Suporta Base64 direto do WhatsApp/n8n
- ✅ Controle automático de progresso
- ✅ URLs públicas para acesso às fotos **FUNCIONAIS** (HTTP 200)
- ✅ Validação de dados de entrada
- ✅ **Storage real integrado** (Supabase Storage funcionando)
- ✅ **Bucket `progress-photos` criado**
- ✅ **Políticas RLS configuradas**
- ✅ **Edge Function `upload-progress-photo` deployada**
- ✅ **Extensão HTTP habilitada**
- ✅ **Upload binário real de arquivos Base64**

## Logs de Teste Realizados

```sql
-- Teste 1: Verificação cliente existente
SELECT * FROM perfis WHERE telefone = '11960297621';
-- Resultado: Cliente Matheus Henrique encontrado

-- Teste 2: Upload foto lateral_direita (25/06/2025 - Upload REAL)
SELECT upload_progress_photo('11960297621', '/9j/4AAQSkZJRg...', 'lateral_direita');
-- Resultado: Sucesso, 3/4 fotos, faltam 1 foto
-- URL: https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/progress-photos/70ac0b64-619d-4a1b-8358-7859633a23f7/lateral_direita_1750822910.jpg

-- Teste 3: Upload foto lateral_esquerda (completar set)
SELECT upload_progress_photo('11960297621', '/9j/4AAQSkZJRg...', 'lateral_esquerda');
-- Resultado: Sucesso, 4/4 fotos, "Todas as fotos foram enviadas com sucesso!"
-- URL: https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/progress-photos/70ac0b64-619d-4a1b-8358-7859633a23f7/lateral_esquerda_1750822936.jpg

-- Teste 4: Verificação da URL pública (HTTP 200 OK)
curl -I "https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/progress-photos/70ac0b64-619d-4a1b-8358-7859633a23f7/lateral_direita_1750822910.jpg"
-- Resultado: HTTP/2 200, content-type: image/jpeg, content-length: 287

-- Teste 5: Status final das fotos
SELECT foto_frente_url, foto_costas_url, foto_lateral_direita_url, foto_lateral_esquerda_url 
FROM perfis WHERE telefone = '11960297621';
-- Resultado: Todas as 4 fotos ✅ com URLs válidas e acessíveis
```

---

**✅ SISTEMA FUNCIONANDO EM PRODUÇÃO!** 🚀📸

### URLs Funcionais Testadas:
- Cliente 11960297621 (Matheus): **4/4 fotos** ✅
- Todas as URLs retornam HTTP 200 e servem as imagens corretamente
- Upload real via Edge Function + RPC funcionando
- Pronto para integração com n8n/WhatsApp!
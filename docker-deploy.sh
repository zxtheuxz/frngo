#!/bin/bash

# Script de deploy Docker com versionamento automático
echo "🐳 Iniciando processo de deploy Docker..."

# Variáveis de configuração
IMAGE_NAME="extermina_frango"
DOCKER_USERNAME="zxtheuxz"
DEFAULT_VERSION="1.0.0"
REPOSITORY_FULL="$DOCKER_USERNAME/$IMAGE_NAME"

# Obter versão via parâmetro ou usar padrão
VERSION=${1:-$DEFAULT_VERSION}

echo "📋 Configuração do Deploy:"
echo "   📦 Imagem: $IMAGE_NAME"
echo "   👤 Usuario: $DOCKER_USERNAME"
echo "   🏷️  Versão: $VERSION"
echo "   📍 Repositório: $REPOSITORY_FULL"

# Validar formato da versão (semântico: x.y.z)
if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "❌ Formato de versão inválido!"
    echo "💡 Use o formato semântico: x.y.z (exemplo: 1.0.0, 1.2.3)"
    echo "📖 Uso: ./docker-deploy.sh [versão]"
    echo "   Exemplo: ./docker-deploy.sh 1.0.1"
    exit 1
fi

# Extrair major.minor para tag adicional
MAJOR_MINOR=$(echo $VERSION | cut -d. -f1-2)

echo "🏷️  Tags que serão criadas:"
echo "   - $REPOSITORY_FULL:$VERSION (versão específica)"
echo "   - $REPOSITORY_FULL:$MAJOR_MINOR (major.minor)"
echo "   - $REPOSITORY_FULL:latest (sempre a mais recente)"

echo "📦 Fazendo build da imagem..."

# Ler variáveis do arquivo .env
if [ -f .env ]; then
    source .env
    echo "✅ Variáveis carregadas do arquivo .env"
else
    echo "❌ Arquivo .env não encontrado"
    echo "💡 Crie um arquivo .env com:"
    echo "   VITE_SUPABASE_URL=sua_url"
    echo "   VITE_SUPABASE_ANON_KEY=sua_chave"
    exit 1
fi

# Verificar se as variáveis estão definidas
echo "🔍 Verificando variáveis de ambiente..."
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ VITE_SUPABASE_URL não está definida"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ VITE_SUPABASE_ANON_KEY não está definida"
    exit 1
fi

echo "✅ URL Supabase: $VITE_SUPABASE_URL"
echo "✅ Chave Supabase: ${VITE_SUPABASE_ANON_KEY:0:10}..."

# Build com build args
echo "🔨 Construindo imagem com variáveis de ambiente..."
docker build \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    -t $IMAGE_NAME:$VERSION .

if [ $? -eq 0 ]; then
    echo "✅ Build concluído com sucesso!"
    
    echo "🏷️  Criando tags múltiplas..."
    # Tag versão específica
    docker tag $IMAGE_NAME:$VERSION $REPOSITORY_FULL:$VERSION
    echo "   ✅ $REPOSITORY_FULL:$VERSION"
    
    # Tag major.minor
    docker tag $IMAGE_NAME:$VERSION $REPOSITORY_FULL:$MAJOR_MINOR
    echo "   ✅ $REPOSITORY_FULL:$MAJOR_MINOR"
    
    # Tag latest
    docker tag $IMAGE_NAME:$VERSION $REPOSITORY_FULL:latest
    echo "   ✅ $REPOSITORY_FULL:latest"
    
    echo "🔐 Fazendo push para repositório..."
    echo "📍 Repositório: $REPOSITORY_FULL"
    echo "⚠️  Certifique-se de estar logado: docker login"
    echo ""
    
    # Push de todas as tags
    echo "📤 Enviando tag versão específica ($VERSION)..."
    docker push $REPOSITORY_FULL:$VERSION
    if [ $? -ne 0 ]; then
        echo "❌ Erro no push da versão $VERSION"
        exit 1
    fi
    
    echo "📤 Enviando tag major.minor ($MAJOR_MINOR)..."
    docker push $REPOSITORY_FULL:$MAJOR_MINOR
    if [ $? -ne 0 ]; then
        echo "❌ Erro no push da versão $MAJOR_MINOR"
        exit 1
    fi
    
    echo "📤 Enviando tag latest..."
    docker push $REPOSITORY_FULL:latest
    if [ $? -ne 0 ]; then
        echo "❌ Erro no push da tag latest"
        exit 1
    fi
    
    echo ""
    echo "🎉 Deploy concluído com sucesso!"
    echo "📋 Imagens disponíveis no Docker Hub:"
    echo "   - $REPOSITORY_FULL:$VERSION"
    echo "   - $REPOSITORY_FULL:$MAJOR_MINOR"
    echo "   - $REPOSITORY_FULL:latest"
    echo ""
    echo "💡 Para próximas versões, use:"
    echo "   ./docker-deploy.sh 1.0.1  # Próximo patch"
    echo "   ./docker-deploy.sh 1.1.0  # Próximo minor"
    echo "   ./docker-deploy.sh 2.0.0  # Próximo major"
    
    echo ""
    echo "🧪 Para testar localmente:"
    echo "   docker run -p 3000:80 $REPOSITORY_FULL:$VERSION"
    echo "   Depois acesse: http://localhost:3000"
    echo ""
    echo "🚀 Para produção:"
    echo "   docker run -d -p 80:80 --name extermina-frango-app --restart unless-stopped $REPOSITORY_FULL:$VERSION"
    echo ""
    echo "📋 Para uso em produção (EasyPanel, etc):"
    echo "   - Registry: docker.io"
    echo "   - Repository: $REPOSITORY_FULL"
    echo "   - Tag: $VERSION (ou latest)"
    echo "   - Username: $DOCKER_USERNAME"
    echo "   - Password: [sua senha do Docker Hub]"
    
else
    echo "❌ Erro no build da imagem"
    exit 1
fi

# Multi-stage build para otimizar tamanho da imagem
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Argumentos para variáveis de ambiente em build time
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Definir as variáveis de ambiente para o build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Debug: verificar se as variáveis foram passadas corretamente
RUN echo "🔍 Verificando variáveis de ambiente durante build:" && \
    echo "VITE_SUPABASE_URL: $VITE_SUPABASE_URL" && \
    echo "VITE_SUPABASE_ANON_KEY: ${VITE_SUPABASE_ANON_KEY:0:10}..." && \
    if [ -z "$VITE_SUPABASE_URL" ]; then echo "❌ VITE_SUPABASE_URL está vazia"; exit 1; fi && \
    if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then echo "❌ VITE_SUPABASE_ANON_KEY está vazia"; exit 1; fi && \
    echo "✅ Variáveis de ambiente OK"

# Copiar arquivos de dependência
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci && npm cache clean --force

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta 80
EXPOSE 80

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
param(
    [Parameter(Position=0)]
    [string]$Version = "1.0.0"
)

# Script de deploy Docker com versionamento automatico para Windows PowerShell
Write-Host "DOCKER: Iniciando processo de deploy Docker..." -ForegroundColor Cyan

# Variaveis de configuracao
$ImageName = "extermina_frango"
$DockerUsername = "zxtheuxz"
$RepositoryFull = "$DockerUsername/$ImageName"

Write-Host "Configuracao do Deploy:" -ForegroundColor Yellow
Write-Host "   Imagem: $ImageName" -ForegroundColor White
Write-Host "   Usuario: $DockerUsername" -ForegroundColor White
Write-Host "   Versao: $Version" -ForegroundColor White
Write-Host "   Repositorio: $RepositoryFull" -ForegroundColor White

# Validar formato da versao (semantico: x.y.z)
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "ERRO: Formato de versao invalido!" -ForegroundColor Red
    Write-Host "Use o formato semantico: x.y.z (exemplo: 1.0.0, 1.2.3)" -ForegroundColor Yellow
    Write-Host "Uso: .\docker-deploy.ps1 [versao]" -ForegroundColor Yellow
    Write-Host "   Exemplo: .\docker-deploy.ps1 1.0.1" -ForegroundColor Yellow
    exit 1
}

# Extrair major.minor para tag adicional
$VersionParts = $Version.Split('.')
$MajorMinor = "$($VersionParts[0]).$($VersionParts[1])"

Write-Host "Tags que serao criadas:" -ForegroundColor Yellow
Write-Host "   - $RepositoryFull`:$Version (versao especifica)" -ForegroundColor White
Write-Host "   - $RepositoryFull`:$MajorMinor (major.minor)" -ForegroundColor White
Write-Host "   - $RepositoryFull`:latest (sempre a mais recente)" -ForegroundColor White

Write-Host "BUILD: Fazendo build da imagem..." -ForegroundColor Cyan

# Verificar se arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Host "ERRO: Arquivo .env nao encontrado" -ForegroundColor Red
    Write-Host "Crie um arquivo .env com:" -ForegroundColor Yellow
    Write-Host "   VITE_SUPABASE_URL=sua_url" -ForegroundColor Yellow
    Write-Host "   VITE_SUPABASE_ANON_KEY=sua_chave" -ForegroundColor Yellow
    exit 1
}

# Ler variaveis do arquivo .env
Write-Host "OK: Variaveis carregadas do arquivo .env" -ForegroundColor Green
$EnvVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#][^=]*)=(.*)$') {
        $EnvVars[$matches[1]] = $matches[2]
    }
}

$SupabaseUrl = $EnvVars['VITE_SUPABASE_URL']
$SupabaseKey = $EnvVars['VITE_SUPABASE_ANON_KEY']

# Verificar se as variaveis estao definidas
Write-Host "VERIFICANDO: Variaveis de ambiente..." -ForegroundColor Cyan
if (-not $SupabaseUrl) {
    Write-Host "ERRO: VITE_SUPABASE_URL nao esta definida" -ForegroundColor Red
    exit 1
}

if (-not $SupabaseKey) {
    Write-Host "ERRO: VITE_SUPABASE_ANON_KEY nao esta definida" -ForegroundColor Red
    exit 1
}

Write-Host "OK: URL Supabase: $SupabaseUrl" -ForegroundColor Green
Write-Host "OK: Chave Supabase: $($SupabaseKey.Substring(0, 10))..." -ForegroundColor Green

# Build com build args
Write-Host "BUILD: Construindo imagem com variaveis de ambiente..." -ForegroundColor Cyan
$BuildArgs = @(
    "--build-arg", "VITE_SUPABASE_URL=$SupabaseUrl",
    "--build-arg", "VITE_SUPABASE_ANON_KEY=$SupabaseKey",
    "-t", "$ImageName`:$Version",
    "."
)

try {
    $BuildResult = & docker build @BuildArgs
    if ($LASTEXITCODE -ne 0) {
        throw "Build falhou"
    }
    
    Write-Host "SUCCESS: Build concluido com sucesso!" -ForegroundColor Green
    
    Write-Host "TAGS: Criando tags multiplas..." -ForegroundColor Cyan
    
    # Tag versao especifica
    & docker tag "$ImageName`:$Version" "$RepositoryFull`:$Version"
    Write-Host "   OK: $RepositoryFull`:$Version" -ForegroundColor Green
    
    # Tag major.minor
    & docker tag "$ImageName`:$Version" "$RepositoryFull`:$MajorMinor"
    Write-Host "   OK: $RepositoryFull`:$MajorMinor" -ForegroundColor Green
    
    # Tag latest
    & docker tag "$ImageName`:$Version" "$RepositoryFull`:latest"
    Write-Host "   OK: $RepositoryFull`:latest" -ForegroundColor Green
    
    Write-Host "PUSH: Fazendo push para repositorio..." -ForegroundColor Cyan
    Write-Host "Repositorio: $RepositoryFull" -ForegroundColor White
    Write-Host "ATENCAO: Certifique-se de estar logado: docker login" -ForegroundColor Yellow
    Write-Host ""
    
    # Push de todas as tags
    Write-Host "PUSH: Enviando tag versao especifica ($Version)..." -ForegroundColor Cyan
    & docker push "$RepositoryFull`:$Version"
    if ($LASTEXITCODE -ne 0) {
        throw "Erro no push da versao $Version"
    }
    
    Write-Host "PUSH: Enviando tag major.minor ($MajorMinor)..." -ForegroundColor Cyan
    & docker push "$RepositoryFull`:$MajorMinor"
    if ($LASTEXITCODE -ne 0) {
        throw "Erro no push da versao $MajorMinor"
    }
    
    Write-Host "PUSH: Enviando tag latest..." -ForegroundColor Cyan
    & docker push "$RepositoryFull`:latest"
    if ($LASTEXITCODE -ne 0) {
        throw "Erro no push da tag latest"
    }
    
    Write-Host ""
    Write-Host "SUCCESS: Deploy concluido com sucesso!" -ForegroundColor Green
    Write-Host "Imagens disponiveis no Docker Hub:" -ForegroundColor Yellow
    Write-Host "   - $RepositoryFull`:$Version" -ForegroundColor White
    Write-Host "   - $RepositoryFull`:$MajorMinor" -ForegroundColor White
    Write-Host "   - $RepositoryFull`:latest" -ForegroundColor White
    Write-Host ""
    Write-Host "Para proximas versoes, use:" -ForegroundColor Yellow
    Write-Host "   .\docker-deploy.ps1 1.0.1  # Proximo patch" -ForegroundColor White
    Write-Host "   .\docker-deploy.ps1 1.1.0  # Proximo minor" -ForegroundColor White
    Write-Host "   .\docker-deploy.ps1 2.0.0  # Proximo major" -ForegroundColor White
    
    Write-Host ""
    Write-Host "Para testar localmente:" -ForegroundColor Yellow
    Write-Host "   docker run -p 3000:80 $RepositoryFull`:$Version" -ForegroundColor White
    Write-Host "   Depois acesse: http://localhost:3000" -ForegroundColor White
    Write-Host ""
    Write-Host "Para producao:" -ForegroundColor Yellow
    Write-Host "   docker run -d -p 80:80 --name extermina-frango-app --restart unless-stopped $RepositoryFull`:$Version" -ForegroundColor White
    Write-Host ""
    Write-Host "Para uso em producao (EasyPanel, etc):" -ForegroundColor Yellow
    Write-Host "   - Registry: docker.io" -ForegroundColor White
    Write-Host "   - Repository: $RepositoryFull" -ForegroundColor White
    Write-Host "   - Tag: $Version (ou latest)" -ForegroundColor White
    Write-Host "   - Username: $DockerUsername" -ForegroundColor White
    Write-Host "   - Password: [sua senha do Docker Hub]" -ForegroundColor White

} catch {
    Write-Host "ERRO: Erro no build da imagem: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
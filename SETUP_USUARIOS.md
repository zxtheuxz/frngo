# 🔧 Configuração de Usuários Admin, Preparador e Nutricionista

## 📋 Credenciais dos Usuários

### 👨‍💼 Admin
- **Email**: `admin@alegrimaldi.com`
- **Senha**: `umlC7Hmr32`
- **Role**: `admin`

### 👨‍⚕️ Preparador
- **Email**: `preparador@alegrimaldi.com`
- **Senha**: `umlC7Hmr32`
- **Role**: `preparador`

### 👩‍⚕️ Nutricionista
- **Email**: `nutricionista@alegrimaldi.com`
- **Senha**: `umlC7Hmr32`
- **Role**: `nutricionista`

## 🚀 Passos para Configuração

### 1. Criar Usuários no Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto: `nbzblkwylsgnafsegzot`
3. Vá para **Authentication** → **Users**
4. Clique em **"Add user"**

#### Para o Admin:
- **Email**: `admin@alegrimaldi.com`
- **Password**: `umlC7Hmr32`
- **Auto Confirm User**: ✅ **SIM** (marcar esta opção)
- Clique em **"Add user"**

#### Para o Preparador:
- **Email**: `preparador@alegrimaldi.com`
- **Password**: `umlC7Hmr32`
- **Auto Confirm User**: ✅ **SIM** (marcar esta opção)
- Clique em **"Add user"**

#### Para a Nutricionista:
- **Email**: `nutricionista@alegrimaldi.com`
- **Password**: `umlC7Hmr32`
- **Auto Confirm User**: ✅ **SIM** (marcar esta opção)
- Clique em **"Add user"**

### 2. Configurar Perfis e Roles

Após criar os usuários, execute o script SQL fornecido:

1. No Supabase Dashboard, vá para **SQL Editor**
2. Abra o arquivo `setup_users.sql` e execute o conteúdo
3. Ou execute este comando via MCP:

```sql
-- Inserir perfil para o administrador
INSERT INTO perfis (user_id, nome_completo, telefone, sexo, role) 
SELECT 
  id, 
  'Administrador do Sistema',
  '(11) 99999-9999',
  'masculino',
  'admin'
FROM auth.users 
WHERE email = 'admin@alegrimaldi.com'
ON CONFLICT (user_id) DO UPDATE SET 
  nome_completo = 'Administrador do Sistema',
  role = 'admin';

-- Inserir perfil para o preparador
INSERT INTO perfis (user_id, nome_completo, telefone, sexo, role) 
SELECT 
  id, 
  'Preparador Físico',
  '(11) 88888-8888',
  'masculino',
  'preparador'
FROM auth.users 
WHERE email = 'preparador@alegrimaldi.com'
ON CONFLICT (user_id) DO UPDATE SET 
  nome_completo = 'Preparador Físico',
  role = 'preparador';

-- Inserir perfil para a nutricionista
INSERT INTO perfis (user_id, nome_completo, telefone, sexo, role) 
SELECT 
  id, 
  'Nutricionista',
  '(11) 77777-7777',
  'feminino',
  'nutricionista'
FROM auth.users 
WHERE email = 'nutricionista@alegrimaldi.com'
ON CONFLICT (user_id) DO UPDATE SET 
  nome_completo = 'Nutricionista',
  role = 'nutricionista';
```

### 3. Verificar Configuração

Execute este comando para verificar se tudo foi configurado corretamente:

```sql
SELECT 
  u.email,
  p.nome_completo,
  p.role,
  p.created_at
FROM auth.users u
JOIN perfis p ON u.id = p.user_id
WHERE u.email IN ('admin@alegrimaldi.com', 'preparador@alegrimaldi.com', 'nutricionista@alegrimaldi.com')
ORDER BY p.role;
```

## 🧪 Teste de Login

### Admin:
1. Acesse `/login`
2. Email: `admin@alegrimaldi.com`
3. Senha: `umlC7Hmr32`
4. Deve redirecionar para: `/admin/dashboard`

### Preparador:
1. Acesse `/login`
2. Email: `preparador@alegrimaldi.com`
3. Senha: `umlC7Hmr32`
4. Deve redirecionar para: `/preparador/dashboard`

### Nutricionista:
1. Acesse `/login`
2. Email: `nutricionista@alegrimaldi.com`
3. Senha: `umlC7Hmr32`
4. Deve redirecionar para: `/nutricionista/dashboard`

## 🔐 Funcionalidades por Role

### 👨‍💼 Admin (`/admin/dashboard`)
- ✅ Visualizar todos os usuários
- ✅ Editar roles de usuários
- ✅ Ver estatísticas completas
- ✅ Acessar perfis individuais
- ✅ Visualizar todas as análises
- ✅ Monitorar sistema completo

### 👨‍⚕️ Preparador (`/preparador/dashboard`)
- ✅ Ver avaliações físicas pendentes
- ✅ Aprovar/editar resultados físicos
- ✅ Ver análises médicas pendentes
- ✅ Aprovar/rejeitar medicamentos
- ✅ Visualizar documentos médicos
- ✅ Visualizar análises corporais dos clientes
- ✅ Adicionar observações
- ✅ Ver estatísticas de aprovação

### 👩‍⚕️ Nutricionista (`/nutricionista/dashboard`)
- ✅ Ver avaliações nutricionais pendentes (masculino/feminino)
- ✅ Aprovar/editar resultados nutricionais
- ✅ Editor com templates específicos para nutrição
- ✅ Visualizar análises corporais dos clientes
- ✅ Adicionar orientações e recomendações
- ✅ Ver estatísticas de adesão

## ⚠️ Notas Importantes

1. **Auto Confirm User** deve estar marcado para evitar necessidade de confirmação por email
2. Os usuários serão criados já ativos e prontos para uso
3. As senhas podem ser alteradas pelos próprios usuários após o primeiro login
4. Certifique-se de que a migration do sistema de roles foi aplicada antes de configurar os usuários

## 🎯 Resultado Esperado

Após a configuração, você terá:
- ✅ 1 usuário admin com acesso total ao sistema
- ✅ 1 usuário preparador com acesso às funcionalidades de aprovação física
- ✅ 1 usuário nutricionista com acesso às funcionalidades nutricionais
- ✅ Sistema de roles funcionando completamente
- ✅ Redirecionamento automático baseado no role após login
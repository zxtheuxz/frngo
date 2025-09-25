
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language
Portugues - brazil 

## Project Overview

This is a fitness and nutrition tracking web application called "Área do Aluno - Alê Grimaldi". It's built with React 19, TypeScript, and Vite, featuring user authentication, physical/nutritional assessments, and training program management.

## Development Commands

```bash
npm run dev        # Start development server (Vite)
npm run build      # Build for production
npm run lint       # Run ESLint
npm run preview    # Preview production build
npm start          # Start production server on port 80
```

## Environment Setup

Required environment variables (create `.env` file):
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Architecture Overview

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS with custom purple/dark theme
- **Database/Auth**: Supabase (PostgreSQL)
- **UI Components**: @headlessui/react, Framer Motion, React Three Fiber
- **Icons**: Lucide React
- **Routing**: React Router v6

### Directory Structure
- `/src/components/` - Reusable UI components (Aurora effects, 3D scenes, forms)
- `/src/pages/` - Page components for each route
- `/src/contexts/` - React contexts (currently Theme context)
- `/src/lib/` - External service integrations (Supabase, PWA)
- `/src/utils/` - Business logic utilities (exercises, training methods)
- `/src/routes/` - Route configuration and protected route components
- `/src/styles/` - Global styles and theme configuration
- `/supabase/migrations/` - Database schema migrations

### Key Features
1. **Authentication Flow**: Login/Signup using Supabase Auth with protected routes
2. **Assessment Forms**: 
   - Physical fitness assessments
   - Gender-specific nutritional assessments
3. **Results Tracking**: Visualization of fitness and nutritional data
4. **Training Programs**: Pre-defined training methods and exercise database
5. **PWA Support**: Installable as mobile app with offline capabilities
6. **Dark Mode**: Theme switching with context provider

### Database Schema (Supabase)
- `users` - User profiles linked to auth.users
- `physical_assessments` - Physical fitness evaluation data
- `nutritional_assessments` - Nutritional evaluation data
- `results` - Calculated results from assessments

### Component Patterns
- Components use TypeScript with proper type definitions
- Form components use controlled inputs with React Hook Form patterns
- Protected routes check authentication status via Supabase
- Theme context provides dark/light mode switching
- Animation components use Framer Motion for transitions

### Important Notes
- No test framework is currently configured
- Production runs on port 80 (requires appropriate permissions)
- PWA manifest and service worker are configured for mobile installation
- Custom 3D effects and animations require WebGL support
- All text is in Portuguese (Brazilian)

## MCP Integration

This project has MCP (Model Context Protocol) connections available for Supabase and Stripe integration.

**Project ID**: `nbzblkwylsgnafsegzot`

### Available MCP Commands

#### Supabase Commands

**Gerenciamento de Organizações e Projetos**
- `mcp__supabase__list_organizations` - Lista todas as organizações
- `mcp__supabase__get_organization` - Obtém detalhes de uma organização
- `mcp__supabase__list_projects` - Lista todos os projetos Supabase
- `mcp__supabase__get_project` - Obtém detalhes de um projeto
- `mcp__supabase__create_project` - Cria um novo projeto
- `mcp__supabase__pause_project` - Pausa um projeto
- `mcp__supabase__restore_project` - Restaura um projeto

**Gerenciamento de Branches**
- `mcp__supabase__create_branch` - Cria um branch de desenvolvimento
- `mcp__supabase__list_branches` - Lista todos os branches de um projeto
- `mcp__supabase__delete_branch` - Deleta um branch
- `mcp__supabase__merge_branch` - Faz merge de um branch para produção
- `mcp__supabase__reset_branch` - Reseta migrações de um branch
- `mcp__supabase__rebase_branch` - Rebasa um branch na produção

**Database e Schema**
- `mcp__supabase__list_tables` - Lista tabelas do banco
- `mcp__supabase__list_extensions` - Lista extensões do banco
- `mcp__supabase__execute_sql` - Executa consultas SQL
- `mcp__supabase__apply_migration` - Aplica migrações
- `mcp__supabase__list_migrations` - Lista migrações

**Logs e Monitoramento**
- `mcp__supabase__get_logs` - Obtém logs dos serviços (api, postgres, auth, etc)
- `mcp__supabase__get_advisors` - Obtém avisos de segurança/performance

**Configuração e Utilitários**
- `mcp__supabase__get_project_url` - Obtém URL da API do projeto
- `mcp__supabase__get_anon_key` - Obtém chave anônima do projeto
- `mcp__supabase__generate_typescript_types` - Gera tipos TypeScript do schema
- `mcp__supabase__search_docs` - Pesquisa na documentação Supabase

**Edge Functions**
- `mcp__supabase__list_edge_functions` - Lista Edge Functions
- `mcp__supabase__deploy_edge_function` - Faz deploy de Edge Functions

**Custos**
- `mcp__supabase__get_cost` - Obtém custos de criação de projetos/branches
- `mcp__supabase__confirm_cost` - Confirma entendimento dos custos


### Usage Examples
- To check database tables: Use `mcp__supabase__list_tables` with the project ID
- To run SQL queries: Use `mcp__supabase__execute_sql` with project ID and query
- To generate TypeScript types: Use `mcp__supabase__generate_typescript_types` with project ID
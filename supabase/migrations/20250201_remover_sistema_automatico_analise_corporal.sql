-- ====================================
-- REMOVER SISTEMA AUTOMÁTICO DE ANÁLISE CORPORAL
-- ====================================

-- 1. Remover todos os triggers
DROP TRIGGER IF EXISTS trigger_aval_masc_direto ON avaliacao_nutricional;
DROP TRIGGER IF EXISTS trigger_aval_fem_direto ON avaliacao_nutricional_feminino;
DROP TRIGGER IF EXISTS trigger_fotos_direto ON perfis;
DROP TRIGGER IF EXISTS trigger_verificar_analise_corporal ON perfis;

-- 2. Remover todas as funções relacionadas
DROP FUNCTION IF EXISTS trigger_processar_analise_direto() CASCADE;
DROP FUNCTION IF EXISTS processar_analise_corporal_sql(uuid) CASCADE;
DROP FUNCTION IF EXISTS verificar_e_processar_analise_corporal() CASCADE;
DROP FUNCTION IF EXISTS processar_fila_analise_corporal() CASCADE;

-- 3. Remover tabela de fila (se ainda existir)
DROP TABLE IF EXISTS analise_corporal_queue CASCADE;

-- 4. Remover configurações relacionadas (se existirem)
-- ALTER DATABASE postgres RESET app.supabase_service_key;

-- Comentário explicativo
COMMENT ON TABLE medidas_corporais IS 'Tabela de medidas corporais. A análise deve ser acionada manualmente pela aplicação.';
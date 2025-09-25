-- Migração: Aumentar precisão decimal das medidas corporais
-- Data: 02/02/2025
-- Versão: v11.6
-- Descrição: Permite armazenar medidas com 1 casa decimal para maior precisão

-- Atualizar colunas na tabela medidas_corporais para DECIMAL(5,1)
ALTER TABLE medidas_corporais
  ALTER COLUMN altura TYPE DECIMAL(5,1),
  ALTER COLUMN peso TYPE DECIMAL(5,1),
  ALTER COLUMN braco_direito TYPE DECIMAL(5,1),
  ALTER COLUMN braco_esquerdo TYPE DECIMAL(5,1),
  ALTER COLUMN antebraco_direito TYPE DECIMAL(5,1),
  ALTER COLUMN antebraco_esquerdo TYPE DECIMAL(5,1),
  ALTER COLUMN cintura TYPE DECIMAL(5,1),
  ALTER COLUMN abdomen TYPE DECIMAL(5,1),
  ALTER COLUMN quadril TYPE DECIMAL(5,1),
  ALTER COLUMN coxa_direita TYPE DECIMAL(5,1),
  ALTER COLUMN coxa_esquerda TYPE DECIMAL(5,1),
  ALTER COLUMN panturrilha_direita TYPE DECIMAL(5,1),
  ALTER COLUMN panturrilha_esquerda TYPE DECIMAL(5,1);

-- Adicionar comentário explicativo
COMMENT ON COLUMN medidas_corporais.altura IS 'Altura em metros com precisão de 1 casa decimal';
COMMENT ON COLUMN medidas_corporais.peso IS 'Peso em kg com precisão de 1 casa decimal';
COMMENT ON COLUMN medidas_corporais.cintura IS 'Medida da cintura em cm com precisão de 1 casa decimal';
COMMENT ON COLUMN medidas_corporais.quadril IS 'Medida do quadril em cm com precisão de 1 casa decimal';

-- Índice para melhorar performance em consultas por usuário e data
CREATE INDEX IF NOT EXISTS idx_medidas_corporais_user_date 
ON medidas_corporais(user_id, data_medicao DESC);
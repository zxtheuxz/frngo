-- ====================================
-- CORRIGIR PRECISÃO NUMÉRICA DAS COLUNAS
-- ====================================

-- Alterar colunas que podem ter valores maiores que 9.999
ALTER TABLE medidas_corporais 
  ALTER COLUMN razao_cintura_quadril TYPE numeric(6,4),
  ALTER COLUMN razao_cintura_estatura TYPE numeric(6,4),
  ALTER COLUMN indice_conicidade TYPE numeric(8,4);

-- Comentários explicativos
COMMENT ON COLUMN medidas_corporais.razao_cintura_quadril IS 'Razão cintura/quadril - valor típico entre 0.6 e 1.2';
COMMENT ON COLUMN medidas_corporais.razao_cintura_estatura IS 'Razão cintura/estatura - valor típico entre 0.3 e 0.8';
COMMENT ON COLUMN medidas_corporais.indice_conicidade IS 'Índice de conicidade - pode ter valores maiores, especialmente em casos de obesidade';
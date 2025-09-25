-- Adicionar campo para rastrear quando o resultado_fisica foi editado
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS resultado_fisica_editado_em TIMESTAMP WITH TIME ZONE;

-- Comentário na coluna
COMMENT ON COLUMN perfis.resultado_fisica_editado_em IS 'Data e hora da última edição do resultado físico pelo preparador';
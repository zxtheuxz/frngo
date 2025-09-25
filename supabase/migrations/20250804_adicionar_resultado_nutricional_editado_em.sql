-- Adicionar campo para rastrear quando o resultado nutricional foi editado
ALTER TABLE perfis 
ADD COLUMN IF NOT EXISTS resultado_nutricional_editado_em TIMESTAMP WITH TIME ZONE;

-- Comentário para documentação
COMMENT ON COLUMN perfis.resultado_nutricional_editado_em IS 'Data e hora da última edição do resultado nutricional pelo nutricionista';
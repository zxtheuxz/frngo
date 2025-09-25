-- Atualizar registros antigos com status EM_EDICAO para PENDENTE
UPDATE aprovacoes_nutricionais 
SET status = 'PENDENTE' 
WHERE status = 'EM_EDICAO';

-- Adicionar constraint para garantir que apenas status válidos sejam inseridos
ALTER TABLE aprovacoes_nutricionais 
DROP CONSTRAINT IF EXISTS aprovacoes_nutricionais_status_check;

ALTER TABLE aprovacoes_nutricionais 
ADD CONSTRAINT aprovacoes_nutricionais_status_check 
CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO'));

-- Comentário para documentação
COMMENT ON CONSTRAINT aprovacoes_nutricionais_status_check ON aprovacoes_nutricionais IS 'Garante que apenas status válidos sejam inseridos (PENDENTE, APROVADO, REJEITADO). Status EM_EDICAO foi removido.';
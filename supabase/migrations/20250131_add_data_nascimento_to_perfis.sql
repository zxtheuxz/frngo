-- Adicionar coluna data_nascimento à tabela perfis
ALTER TABLE perfis
ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Atualizar política RLS para incluir a nova coluna
CREATE POLICY "Users can update their own data_nascimento" ON perfis
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comentário sobre a mudança
COMMENT ON COLUMN perfis.data_nascimento IS 'Data de nascimento do usuário, usada para cálculos de idade em avaliações físicas';
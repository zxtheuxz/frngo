-- Adicionar políticas RLS para nutricionistas nas tabelas de avaliação nutricional

-- Política para avaliacao_nutricional - Nutricionistas podem ver todas as avaliações
CREATE POLICY "Nutricionistas podem ver todas as avaliações nutricionais" 
ON public.avaliacao_nutricional 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM perfis 
    WHERE perfis.user_id = auth.uid() 
    AND perfis.role = 'nutricionista'
  )
);

-- Política para avaliacao_nutricional_feminino - Nutricionistas podem ver todas as avaliações
CREATE POLICY "Nutricionistas podem ver todas as avaliações nutricionais femininas" 
ON public.avaliacao_nutricional_feminino 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 
    FROM perfis 
    WHERE perfis.user_id = auth.uid() 
    AND perfis.role = 'nutricionista'
  )
);

-- Verificar e adicionar política para preparadores na tabela avaliacao_fisica se não existir
DO $$ 
BEGIN
    -- Verificar se já existe política para preparadores verem avaliações físicas
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'avaliacao_fisica' 
        AND policyname LIKE '%preparador%podem ver%'
    ) THEN
        -- Criar política se não existir
        CREATE POLICY "Preparadores podem ver todas as avaliações físicas" 
        ON public.avaliacao_fisica 
        FOR SELECT 
        TO authenticated 
        USING (
          EXISTS (
            SELECT 1 
            FROM perfis 
            WHERE perfis.user_id = auth.uid() 
            AND perfis.role = 'preparador'
          )
        );
    END IF;
END $$;
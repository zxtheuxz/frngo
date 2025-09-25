-- Adicionar política RLS para permitir INSERT via trigger
CREATE POLICY "Sistema pode criar aprovações nutricionais via trigger" 
ON aprovacoes_nutricionais 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Atualizar função para usar SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.criar_aprovacao_nutricional()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado TEXT;
  v_tipo TEXT;
BEGIN
  -- Determinar tipo baseado na tabela
  IF TG_TABLE_NAME = 'avaliacao_nutricional' THEN
    v_tipo := 'masculino';
  ELSE
    v_tipo := 'feminino';
  END IF;
  
  -- Buscar resultado do perfil
  SELECT resultado_nutricional INTO v_resultado
  FROM perfis
  WHERE user_id = NEW.user_id;
  
  -- Criar aprovação pendente
  INSERT INTO aprovacoes_nutricionais (
    avaliacao_id,
    user_id,
    tipo_avaliacao,
    status,
    resultado_original
  ) VALUES (
    NEW.id,
    NEW.user_id,
    v_tipo,
    'PENDENTE',
    v_resultado
  );
  
  RETURN NEW;
END;
$$;

-- Adicionar comentário explicativo
COMMENT ON POLICY "Sistema pode criar aprovações nutricionais via trigger" ON aprovacoes_nutricionais 
IS 'Permite que o sistema crie registros via trigger quando uma avaliação nutricional é inserida';

COMMENT ON FUNCTION criar_aprovacao_nutricional() 
IS 'Cria automaticamente uma aprovação pendente quando uma avaliação nutricional é inserida. Usa SECURITY DEFINER para executar com privilégios elevados.';

-- ====================================
-- CORREÇÕES PARA AVALIAÇÕES FÍSICAS
-- ====================================

-- Adicionar política RLS para permitir INSERT via trigger em aprovacoes_fisicas
CREATE POLICY "Sistema pode criar aprovações físicas via trigger" 
ON aprovacoes_fisicas 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Atualizar função criar_aprovacao_fisica para usar SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.criar_aprovacao_fisica()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_resultado TEXT;
BEGIN
  -- Buscar resultado do perfil
  SELECT resultado_fisica INTO v_resultado
  FROM perfis
  WHERE user_id = NEW.user_id;
  
  -- Criar aprovação pendente
  INSERT INTO aprovacoes_fisicas (
    avaliacao_id,
    user_id,
    status,
    resultado_original
  ) VALUES (
    NEW.id,
    NEW.user_id,
    'PENDENTE',
    v_resultado
  );
  
  RETURN NEW;
END;
$$;

-- Adicionar comentários
COMMENT ON POLICY "Sistema pode criar aprovações físicas via trigger" ON aprovacoes_fisicas 
IS 'Permite que o sistema crie registros via trigger quando uma avaliação física é inserida';

COMMENT ON FUNCTION criar_aprovacao_fisica() 
IS 'Cria automaticamente uma aprovação pendente quando uma avaliação física é inserida. Usa SECURITY DEFINER para executar com privilégios elevados.';
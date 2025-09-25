-- ====================================
-- SISTEMA DIRETO DE ANÁLISE CORPORAL
-- Sem filas, processamento instantâneo
-- ====================================

-- 1. Remover sistema antigo de fila
DROP TRIGGER IF EXISTS trigger_verificar_analise_corporal ON perfis;
DROP FUNCTION IF EXISTS verificar_e_processar_analise_corporal() CASCADE;
DROP FUNCTION IF EXISTS processar_fila_analise_corporal() CASCADE;
DROP TABLE IF EXISTS analise_corporal_queue CASCADE;

-- 2. Função que verifica e processa DIRETAMENTE
CREATE OR REPLACE FUNCTION trigger_processar_analise_direto()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tem_avaliacao boolean;
  v_tem_fotos boolean;
  v_ja_processado boolean;
  v_service_key text;
  v_response jsonb;
BEGIN
  -- Pegar user_id do registro
  v_user_id := NEW.user_id;
  
  -- Log para debug
  RAISE NOTICE 'Trigger disparado para user_id: %', v_user_id;
  
  -- Verificar se já foi processado
  SELECT EXISTS (
    SELECT 1 FROM medidas_corporais 
    WHERE user_id = v_user_id
    LIMIT 1
  ) INTO v_ja_processado;
  
  -- Se já processou, não fazer nada
  IF v_ja_processado THEN
    RAISE NOTICE 'Usuário % já tem análise corporal', v_user_id;
    RETURN NEW;
  END IF;
  
  -- Verificar se tem avaliação nutricional (masculino ou feminino)
  SELECT EXISTS (
    SELECT 1 FROM avaliacao_nutricional WHERE user_id = v_user_id
    UNION
    SELECT 1 FROM avaliacao_nutricional_feminino WHERE user_id = v_user_id
  ) INTO v_tem_avaliacao;
  
  -- Verificar se tem ambas as fotos
  SELECT (
    foto_lateral_url IS NOT NULL AND 
    foto_abertura_url IS NOT NULL
  ) INTO v_tem_fotos
  FROM perfis 
  WHERE user_id = v_user_id;
  
  -- Log das verificações
  RAISE NOTICE 'Verificações para %: avaliacao=%, fotos=%', v_user_id, v_tem_avaliacao, v_tem_fotos;
  
  -- Se tem tudo, processar AGORA!
  IF v_tem_avaliacao AND v_tem_fotos THEN
    RAISE NOTICE 'Condições atendidas! Processando análise corporal para %', v_user_id;
    
    -- Obter service key do vault
    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
    
    -- Se não encontrar no vault, tentar configuração alternativa
    IF v_service_key IS NULL THEN
      v_service_key := current_setting('app.supabase_service_key', true);
    END IF;
    
    -- Se ainda não tem key, logar erro mas não falhar
    IF v_service_key IS NULL THEN
      RAISE WARNING 'Service key não encontrada. Análise corporal não será processada automaticamente.';
      RETURN NEW;
    END IF;
    
    -- Chamar Edge Function via pg_net (assíncrono)
    SELECT net.http_post(
      url := 'https://nbzblkwylsgnafsegzot.supabase.co/functions/v1/processar-analise-corporal',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_service_key
      ),
      body := jsonb_build_object('user_id', v_user_id)::text
    ) INTO v_response;
    
    RAISE NOTICE 'Edge Function chamada para user_id: %. Response: %', v_user_id, v_response;
  ELSE
    RAISE NOTICE 'Condições não atendidas para %: avaliacao=%, fotos=%', v_user_id, v_tem_avaliacao, v_tem_fotos;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log erro mas não falhar o trigger
  RAISE WARNING 'Erro no trigger de análise corporal: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 3. Criar os 3 triggers simples

-- Trigger para avaliação nutricional masculino
DROP TRIGGER IF EXISTS trigger_aval_masc_direto ON avaliacao_nutricional;
CREATE TRIGGER trigger_aval_masc_direto
AFTER INSERT OR UPDATE ON avaliacao_nutricional
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

-- Trigger para avaliação nutricional feminino
DROP TRIGGER IF EXISTS trigger_aval_fem_direto ON avaliacao_nutricional_feminino;
CREATE TRIGGER trigger_aval_fem_direto
AFTER INSERT OR UPDATE ON avaliacao_nutricional_feminino
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

-- Trigger para fotos no perfil
DROP TRIGGER IF EXISTS trigger_fotos_direto ON perfis;
CREATE TRIGGER trigger_fotos_direto
AFTER UPDATE OF foto_lateral_url, foto_abertura_url ON perfis
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

-- 4. Comentários explicativos
COMMENT ON FUNCTION trigger_processar_analise_direto() IS 
'Verifica se usuário tem avaliação nutricional e ambas as fotos. Se sim, chama Edge Function para processar análise corporal imediatamente.';

COMMENT ON TRIGGER trigger_aval_masc_direto ON avaliacao_nutricional IS 
'Dispara verificação de análise corporal quando avaliação nutricional masculina é inserida/atualizada';

COMMENT ON TRIGGER trigger_aval_fem_direto ON avaliacao_nutricional_feminino IS 
'Dispara verificação de análise corporal quando avaliação nutricional feminina é inserida/atualizada';

COMMENT ON TRIGGER trigger_fotos_direto ON perfis IS 
'Dispara verificação de análise corporal quando fotos são adicionadas ao perfil';

-- 5. Criar configuração para service key (opcional - admin deve configurar)
-- ALTER DATABASE postgres SET app.supabase_service_key = 'sua_service_key_aqui';

-- 6. Processar usuários existentes que já tem tudo mas não foram processados
DO $$
DECLARE
  v_count integer;
  v_user record;
BEGIN
  -- Contar quantos usuários estão prontos mas não processados
  SELECT COUNT(*) INTO v_count
  FROM perfis p
  WHERE p.foto_lateral_url IS NOT NULL
  AND p.foto_abertura_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM medidas_corporais WHERE user_id = p.user_id
  )
  AND EXISTS (
    SELECT 1 FROM avaliacao_nutricional WHERE user_id = p.user_id
    UNION
    SELECT 1 FROM avaliacao_nutricional_feminino WHERE user_id = p.user_id
  );
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Encontrados % usuários prontos para processamento', v_count;
    
    -- Para cada usuário, disparar o trigger manualmente
    FOR v_user IN 
      SELECT p.user_id
      FROM perfis p
      WHERE p.foto_lateral_url IS NOT NULL
      AND p.foto_abertura_url IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM medidas_corporais WHERE user_id = p.user_id
      )
      AND EXISTS (
        SELECT 1 FROM avaliacao_nutricional WHERE user_id = p.user_id
        UNION
        SELECT 1 FROM avaliacao_nutricional_feminino WHERE user_id = p.user_id
      )
      LIMIT 10 -- Processar até 10 por vez
    LOOP
      -- Forçar update para disparar trigger
      UPDATE perfis 
      SET updated_at = now() 
      WHERE user_id = v_user.user_id;
    END LOOP;
  END IF;
END $$;
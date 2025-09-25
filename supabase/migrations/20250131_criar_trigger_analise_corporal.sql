-- ====================================
-- TRIGGER PARA ANÁLISE CORPORAL AUTOMÁTICA
-- ====================================

-- Criar tabela de fila de processamento
CREATE TABLE IF NOT EXISTS public.analise_corporal_queue (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'processando', 'concluido', 'erro')),
  tentativas integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  error_message text,
  UNIQUE(user_id) -- Apenas uma entrada por usuário
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_analise_corporal_queue_status ON analise_corporal_queue(status);
CREATE INDEX IF NOT EXISTS idx_analise_corporal_queue_user_id ON analise_corporal_queue(user_id);

-- RLS para a tabela de fila
ALTER TABLE analise_corporal_queue ENABLE ROW LEVEL SECURITY;

-- Política para sistema inserir na fila
CREATE POLICY "Sistema pode gerenciar fila de análise corporal" 
ON analise_corporal_queue 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Função para verificar e adicionar à fila de processamento
CREATE OR REPLACE FUNCTION public.verificar_e_processar_analise_corporal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tem_avaliacao_nutricional boolean;
  v_tem_analise_existente boolean;
BEGIN
  -- Só processar se ambas as fotos foram adicionadas
  IF NEW.foto_lateral_url IS NOT NULL 
     AND NEW.foto_abertura_url IS NOT NULL 
     AND (
       (OLD.foto_lateral_url IS NULL AND NEW.foto_lateral_url IS NOT NULL) OR
       (OLD.foto_abertura_url IS NULL AND NEW.foto_abertura_url IS NOT NULL)
     ) THEN
    
    -- Verificar se já existe análise corporal
    SELECT EXISTS (
      SELECT 1 FROM medidas_corporais 
      WHERE user_id = NEW.user_id
      LIMIT 1
    ) INTO v_tem_analise_existente;
    
    -- Se já tem análise, não processar novamente
    IF v_tem_analise_existente THEN
      RETURN NEW;
    END IF;
    
    -- Verificar se tem avaliação nutricional (masculino ou feminino)
    SELECT EXISTS (
      SELECT 1 FROM avaliacao_nutricional 
      WHERE user_id = NEW.user_id
      UNION
      SELECT 1 FROM avaliacao_nutricional_feminino 
      WHERE user_id = NEW.user_id
    ) INTO v_tem_avaliacao_nutricional;
    
    -- Se tem avaliação nutricional, adicionar à fila
    IF v_tem_avaliacao_nutricional THEN
      -- Inserir ou atualizar na fila (upsert)
      INSERT INTO analise_corporal_queue (user_id, status, created_at)
      VALUES (NEW.user_id, 'pendente', now())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        status = 'pendente',
        tentativas = 0,
        created_at = now(),
        processed_at = NULL,
        error_message = NULL;
        
      -- Log para debug
      RAISE NOTICE 'Análise corporal adicionada à fila para user_id: %', NEW.user_id;
    ELSE
      RAISE NOTICE 'Usuário % não tem avaliação nutricional preenchida', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para monitorar mudanças nas fotos
DROP TRIGGER IF EXISTS trigger_verificar_analise_corporal ON perfis;
CREATE TRIGGER trigger_verificar_analise_corporal
AFTER UPDATE OF foto_lateral_url, foto_abertura_url ON perfis
FOR EACH ROW
EXECUTE FUNCTION verificar_e_processar_analise_corporal();

-- Função para processar a fila (chamada por cron job ou manualmente)
DROP FUNCTION IF EXISTS public.processar_fila_analise_corporal();
CREATE OR REPLACE FUNCTION public.processar_fila_analise_corporal()
RETURNS TABLE(processados integer, erros integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record record;
  v_processados integer := 0;
  v_erros integer := 0;
  v_result record;
BEGIN
  -- Processar até 10 itens pendentes por vez
  FOR v_record IN 
    SELECT * FROM analise_corporal_queue 
    WHERE status = 'pendente' 
    AND tentativas < 3
    ORDER BY created_at 
    LIMIT 10
  LOOP
    BEGIN
      -- Marcar como processando
      UPDATE analise_corporal_queue 
      SET status = 'processando', tentativas = tentativas + 1
      WHERE id = v_record.id;
      
      -- Chamar a Edge Function
      -- Nota: Em produção, isso seria feito via pg_net ou similar
      -- Por agora, vamos apenas marcar para processamento manual
      
      -- Verificar se usuário ainda tem as condições necessárias
      SELECT EXISTS (
        SELECT 1 
        FROM perfis p
        WHERE p.user_id = v_record.user_id
        AND p.foto_lateral_url IS NOT NULL
        AND p.foto_abertura_url IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM avaliacao_nutricional WHERE user_id = p.user_id
          UNION
          SELECT 1 FROM avaliacao_nutricional_feminino WHERE user_id = p.user_id
        )
      ) INTO v_result;
      
      IF v_result.exists THEN
        -- Por enquanto, apenas marcar como concluído
        -- Em produção, aqui seria a chamada para Edge Function
        UPDATE analise_corporal_queue 
        SET 
          status = 'pendente', -- Mantém pendente para processamento via Edge Function
          processed_at = now()
        WHERE id = v_record.id;
        
        v_processados := v_processados + 1;
      ELSE
        -- Condições não atendidas mais, remover da fila
        DELETE FROM analise_corporal_queue WHERE id = v_record.id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      -- Em caso de erro, marcar como erro
      UPDATE analise_corporal_queue 
      SET 
        status = 'erro',
        error_message = SQLERRM
      WHERE id = v_record.id;
      
      v_erros := v_erros + 1;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_processados, v_erros;
END;
$$;

-- Comentários explicativos
COMMENT ON TABLE analise_corporal_queue IS 'Fila para processamento automático de análises corporais quando usuário envia ambas as fotos';
COMMENT ON FUNCTION verificar_e_processar_analise_corporal() IS 'Verifica se usuário tem condições para análise corporal e adiciona à fila de processamento';
COMMENT ON FUNCTION processar_fila_analise_corporal() IS 'Processa itens pendentes na fila de análise corporal';

-- Criar job para processar usuários que já tem fotos mas não foram processados
DO $$
DECLARE
  v_count integer;
BEGIN
  -- Contar quantos usuários já tem as condições mas não tem análise
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
    RAISE NOTICE 'Encontrados % usuários com fotos completas sem análise corporal', v_count;
    
    -- Adicionar todos à fila
    INSERT INTO analise_corporal_queue (user_id, status, created_at)
    SELECT p.user_id, 'pendente', now()
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
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
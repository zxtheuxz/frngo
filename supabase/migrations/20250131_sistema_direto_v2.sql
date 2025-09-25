-- ====================================
-- SISTEMA DIRETO V2 - Usando função SQL
-- ====================================

-- Dropar função antiga
DROP FUNCTION IF EXISTS trigger_processar_analise_direto() CASCADE;

-- Criar função que processa análise diretamente via SQL
CREATE OR REPLACE FUNCTION processar_analise_corporal_sql(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_perfil record;
  v_avaliacao record;
  v_dados_corporais record;
  v_medidas record;
  v_imc numeric;
  v_percentual_gordura numeric;
  v_massa_gorda numeric;
  v_massa_magra numeric;
  v_tmb numeric;
  v_razao_cintura_quadril numeric;
  v_razao_cintura_estatura numeric;
  v_indice_conicidade numeric;
  v_indice_grimaldi numeric;
BEGIN
  -- Buscar dados do perfil
  SELECT sexo INTO v_perfil
  FROM perfis
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Buscar avaliação nutricional
  IF v_perfil.sexo IN ('M', 'Masculino', 'masculino') THEN
    SELECT altura, peso, idade, data_nascimento 
    INTO v_avaliacao
    FROM avaliacao_nutricional
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    SELECT altura, peso, idade, data_nascimento
    INTO v_avaliacao
    FROM avaliacao_nutricional_feminino
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Preparar dados corporais
  v_dados_corporais.altura := v_avaliacao.altura::numeric;
  v_dados_corporais.peso := v_avaliacao.peso::numeric;
  v_dados_corporais.idade := COALESCE(
    v_avaliacao.idade::numeric,
    EXTRACT(YEAR FROM age(v_avaliacao.data_nascimento::date))::numeric
  );
  v_dados_corporais.sexo := CASE 
    WHEN v_perfil.sexo IN ('M', 'Masculino', 'masculino') THEN 'M' 
    ELSE 'F' 
  END;
  
  -- Calcular IMC
  v_imc := v_dados_corporais.peso / (v_dados_corporais.altura * v_dados_corporais.altura);
  
  -- Calcular percentual de gordura
  IF v_dados_corporais.sexo = 'M' THEN
    v_percentual_gordura := (1.20 * v_imc) + (0.23 * v_dados_corporais.idade) - 16.2;
  ELSE
    v_percentual_gordura := (1.20 * v_imc) + (0.23 * v_dados_corporais.idade) - 5.4;
  END IF;
  
  -- Limitar percentual
  v_percentual_gordura := GREATEST(3, LEAST(60, v_percentual_gordura));
  
  -- Calcular massas
  v_massa_gorda := (v_dados_corporais.peso * v_percentual_gordura) / 100;
  v_massa_magra := v_dados_corporais.peso - v_massa_gorda;
  
  -- Calcular TMB
  IF v_dados_corporais.sexo = 'M' THEN
    v_tmb := 88.362 + (13.397 * v_dados_corporais.peso) + (4.799 * v_dados_corporais.altura * 100) - (5.677 * v_dados_corporais.idade);
  ELSE
    v_tmb := 447.593 + (9.247 * v_dados_corporais.peso) + (3.098 * v_dados_corporais.altura * 100) - (4.330 * v_dados_corporais.idade);
  END IF;
  
  -- Calcular medidas usando proporções antropométricas
  IF v_dados_corporais.sexo = 'M' THEN
    v_medidas.cintura := (v_dados_corporais.altura * 100) * 0.503;
    v_medidas.quadril := (v_dados_corporais.altura * 100) * 0.556;
    v_medidas.bracos := (v_dados_corporais.altura * 100) * 0.187;
    v_medidas.antebracos := (v_dados_corporais.altura * 100) * 0.169;
    v_medidas.coxas := (v_dados_corporais.altura * 100) * 0.326;
    v_medidas.panturrilhas := (v_dados_corporais.altura * 100) * 0.218;
  ELSE
    v_medidas.cintura := (v_dados_corporais.altura * 100) * 0.485;
    v_medidas.quadril := (v_dados_corporais.altura * 100) * 0.578;
    v_medidas.bracos := (v_dados_corporais.altura * 100) * 0.180;
    v_medidas.antebracos := (v_dados_corporais.altura * 100) * 0.155;
    v_medidas.coxas := (v_dados_corporais.altura * 100) * 0.343;
    v_medidas.panturrilhas := (v_dados_corporais.altura * 100) * 0.210;
  END IF;
  
  -- Aplicar fator de biotipo baseado no IMC
  DECLARE
    v_fator_biotipo numeric;
  BEGIN
    -- Fator para cintura e quadril
    IF v_imc < 26.5 THEN v_fator_biotipo := 1.00;
    ELSIF v_imc < 27.0 THEN v_fator_biotipo := 1.02;
    ELSIF v_imc < 28.0 THEN v_fator_biotipo := 1.04;
    ELSIF v_imc < 29.5 THEN v_fator_biotipo := 1.06;
    ELSIF v_imc < 32.0 THEN v_fator_biotipo := 1.08;
    ELSE v_fator_biotipo := 1.10;
    END IF;
    
    v_medidas.cintura := v_medidas.cintura * v_fator_biotipo;
    v_medidas.quadril := v_medidas.quadril * v_fator_biotipo;
  END;
  
  -- Calcular índices de risco
  v_razao_cintura_quadril := v_medidas.cintura / v_medidas.quadril;
  v_razao_cintura_estatura := v_medidas.cintura / (v_dados_corporais.altura * 100);
  v_indice_conicidade := v_medidas.cintura / (0.109 * SQRT(v_dados_corporais.peso / v_dados_corporais.altura));
  
  -- Índice Grimaldi
  DECLARE
    v_fator_idade numeric;
    v_fator_sexo numeric;
  BEGIN
    IF v_dados_corporais.idade < 30 THEN v_fator_idade := 1.0;
    ELSIF v_dados_corporais.idade < 40 THEN v_fator_idade := 1.1;
    ELSIF v_dados_corporais.idade < 50 THEN v_fator_idade := 1.2;
    ELSIF v_dados_corporais.idade < 60 THEN v_fator_idade := 1.3;
    ELSE v_fator_idade := 1.4;
    END IF;
    
    v_fator_sexo := CASE WHEN v_dados_corporais.sexo = 'M' THEN 1.0 ELSE 0.85 END;
    
    v_indice_grimaldi := ((100 - v_percentual_gordura) * 0.4 + 
      (100 - LEAST(v_imc, 40)) * 0.3 + 
      (100 - LEAST(v_razao_cintura_quadril * 100, 100)) * 0.3) / v_fator_idade * v_fator_sexo;
  END;
  
  -- Inserir resultados
  INSERT INTO medidas_corporais (
    user_id,
    medida_bracos,
    medida_antebracos,
    medida_cintura,
    medida_quadril,
    medida_coxas,
    medida_panturrilhas,
    percentual_gordura,
    massa_magra,
    massa_gorda,
    tmb,
    imc,
    razao_cintura_quadril,
    razao_cintura_estatura,
    indice_conicidade,
    shaped_score,
    altura_usada,
    peso_usado,
    idade_calculada,
    sexo_usado,
    calculado_automaticamente
  ) VALUES (
    p_user_id,
    v_medidas.bracos,
    v_medidas.antebracos,
    v_medidas.cintura,
    v_medidas.quadril,
    v_medidas.coxas,
    v_medidas.panturrilhas,
    v_percentual_gordura,
    v_massa_magra,
    v_massa_gorda,
    v_tmb,
    v_imc,
    v_razao_cintura_quadril,
    v_razao_cintura_estatura,
    v_indice_conicidade,
    v_indice_grimaldi,
    v_dados_corporais.altura,
    v_dados_corporais.peso,
    v_dados_corporais.idade,
    v_dados_corporais.sexo,
    true
  );
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erro ao processar análise corporal: %', SQLERRM;
  RETURN FALSE;
END;
$$;

-- Criar nova função de trigger simplificada
CREATE OR REPLACE FUNCTION trigger_processar_analise_direto()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_tem_avaliacao boolean;
  v_tem_fotos boolean;
  v_ja_processado boolean;
  v_resultado boolean;
BEGIN
  v_user_id := NEW.user_id;
  
  -- Verificar se já foi processado
  SELECT EXISTS (
    SELECT 1 FROM medidas_corporais 
    WHERE user_id = v_user_id
  ) INTO v_ja_processado;
  
  IF v_ja_processado THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se tem avaliação nutricional
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
  
  -- Se tem tudo, processar via SQL
  IF v_tem_avaliacao AND v_tem_fotos THEN
    v_resultado := processar_analise_corporal_sql(v_user_id);
    
    IF v_resultado THEN
      RAISE NOTICE 'Análise corporal processada com sucesso para user_id: %', v_user_id;
    ELSE
      RAISE WARNING 'Falha ao processar análise corporal para user_id: %', v_user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recriar os triggers (caso tenham sido dropados)
DROP TRIGGER IF EXISTS trigger_aval_masc_direto ON avaliacao_nutricional;
CREATE TRIGGER trigger_aval_masc_direto
AFTER INSERT OR UPDATE ON avaliacao_nutricional
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

DROP TRIGGER IF EXISTS trigger_aval_fem_direto ON avaliacao_nutricional_feminino;
CREATE TRIGGER trigger_aval_fem_direto
AFTER INSERT OR UPDATE ON avaliacao_nutricional_feminino
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

DROP TRIGGER IF EXISTS trigger_fotos_direto ON perfis;
CREATE TRIGGER trigger_fotos_direto
AFTER UPDATE OF foto_lateral_url, foto_abertura_url ON perfis
FOR EACH ROW
EXECUTE FUNCTION trigger_processar_analise_direto();

-- Comentários
COMMENT ON FUNCTION processar_analise_corporal_sql(uuid) IS 
'Processa análise corporal usando cálculos SQL puros, sem necessidade de Edge Function';

COMMENT ON FUNCTION trigger_processar_analise_direto() IS 
'Trigger simplificado que chama processamento SQL direto quando condições são atendidas';
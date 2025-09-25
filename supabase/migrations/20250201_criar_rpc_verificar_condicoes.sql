-- ====================================
-- RPC PARA VERIFICAR CONDIÇÕES DE ANÁLISE CORPORAL
-- ====================================

-- Função que verifica se um usuário está apto para análise corporal
CREATE OR REPLACE FUNCTION verificar_condicoes_analise_corporal(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tem_foto_lateral boolean := false;
  v_tem_foto_abertura boolean := false;
  v_tem_fotos boolean := false;
  v_tem_avaliacao_masc boolean := false;
  v_tem_avaliacao_fem boolean := false;
  v_tem_avaliacao_nutricional boolean := false;
  v_tipo_avaliacao text := null;
  v_status text;
  v_sexo text;
BEGIN
  -- Verificar fotos no perfil
  SELECT 
    foto_lateral_url IS NOT NULL,
    foto_abertura_url IS NOT NULL,
    sexo
  INTO 
    v_tem_foto_lateral,
    v_tem_foto_abertura,
    v_sexo
  FROM perfis
  WHERE user_id = p_user_id;
  
  -- Se não encontrou perfil, retornar NAO_APTO
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status', 'NAO_APTO',
      'tem_fotos', false,
      'tem_avaliacao_nutricional', false,
      'detalhes', jsonb_build_object(
        'erro', 'Perfil não encontrado'
      )
    );
  END IF;
  
  -- Verificar se tem ambas as fotos
  v_tem_fotos := v_tem_foto_lateral AND v_tem_foto_abertura;
  
  -- Verificar avaliação nutricional masculina
  SELECT EXISTS (
    SELECT 1 FROM avaliacao_nutricional 
    WHERE user_id = p_user_id
    LIMIT 1
  ) INTO v_tem_avaliacao_masc;
  
  -- Verificar avaliação nutricional feminina
  SELECT EXISTS (
    SELECT 1 FROM avaliacao_nutricional_feminino 
    WHERE user_id = p_user_id
    LIMIT 1
  ) INTO v_tem_avaliacao_fem;
  
  -- Determinar se tem avaliação e qual tipo
  v_tem_avaliacao_nutricional := v_tem_avaliacao_masc OR v_tem_avaliacao_fem;
  
  IF v_tem_avaliacao_masc AND v_tem_avaliacao_fem THEN
    v_tipo_avaliacao := 'ambos';
  ELSIF v_tem_avaliacao_masc THEN
    v_tipo_avaliacao := 'masculino';
  ELSIF v_tem_avaliacao_fem THEN
    v_tipo_avaliacao := 'feminino';
  END IF;
  
  -- Determinar status final
  IF v_tem_fotos AND v_tem_avaliacao_nutricional THEN
    v_status := 'APTO';
  ELSE
    v_status := 'NAO_APTO';
  END IF;
  
  -- Retornar resultado completo
  RETURN jsonb_build_object(
    'status', v_status,
    'tem_fotos', v_tem_fotos,
    'tem_avaliacao_nutricional', v_tem_avaliacao_nutricional,
    'detalhes', jsonb_build_object(
      'foto_lateral', v_tem_foto_lateral,
      'foto_abertura', v_tem_foto_abertura,
      'tipo_avaliacao', v_tipo_avaliacao,
      'sexo_perfil', v_sexo,
      'avaliacao_masculina', v_tem_avaliacao_masc,
      'avaliacao_feminina', v_tem_avaliacao_fem
    )
  );
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION verificar_condicoes_analise_corporal(uuid) IS 
'Verifica se um usuário tem todas as condições necessárias para realizar análise corporal. 
Retorna status APTO ou NAO_APTO junto com detalhes sobre fotos e avaliação nutricional.';

-- Exemplo de uso:
-- SELECT verificar_condicoes_analise_corporal('123e4567-e89b-12d3-a456-426614174000');
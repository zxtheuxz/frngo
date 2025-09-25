-- Corrigir função buscar_avaliacoes_nutricionais_pendentes com tipos de dados corretos
-- Primeiro remover a função existente
DROP FUNCTION IF EXISTS buscar_avaliacoes_nutricionais_pendentes();

-- Recriar a função com tipos varchar(20) para compatibilidade com a tabela
CREATE OR REPLACE FUNCTION buscar_avaliacoes_nutricionais_pendentes()
RETURNS TABLE (
  id uuid,
  avaliacao_id uuid,
  user_id uuid,
  tipo_avaliacao varchar(20),  -- Corrigido de text para varchar(20)
  status varchar(20),           -- Corrigido de text para varchar(20)
  resultado_original text,
  resultado_editado text,
  observacoes text,
  created_at timestamptz,
  updated_at timestamptz,
  usuario jsonb
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    an.id,
    an.avaliacao_id,
    an.user_id,
    an.tipo_avaliacao::varchar(20),  -- Cast explícito para garantir compatibilidade
    an.status::varchar(20),           -- Cast explícito para garantir compatibilidade
    an.resultado_original,
    an.resultado_editado,
    an.observacoes,
    an.created_at,
    an.updated_at,
    json_build_object(
      'id', p.user_id,
      'nome_completo', p.nome_completo,
      'email', au.email,
      'telefone', p.telefone
    )::jsonb as usuario
  FROM aprovacoes_nutricionais an
  JOIN perfis p ON p.user_id = an.user_id
  JOIN auth.users au ON au.id = an.user_id
  WHERE EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.user_id = auth.uid() 
    AND perfis.role IN ('nutricionista', 'admin')
  )
  ORDER BY 
    CASE WHEN an.status = 'PENDENTE' THEN 0 ELSE 1 END,
    an.created_at DESC;
END;
$$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION buscar_avaliacoes_nutricionais_pendentes() IS 'Busca avaliações nutricionais pendentes para nutricionistas e admins. Corrigido tipos de dados para varchar(20) e removida referência a data_nascimento.';
-- Corrigir incompatibilidade de tipos na função buscar_avaliacoes_fisicas_pendentes
-- O campo status é varchar(20) na tabela mas a função retorna text

CREATE OR REPLACE FUNCTION public.buscar_avaliacoes_fisicas_pendentes()
 RETURNS TABLE(
   id uuid, 
   avaliacao_id uuid, 
   user_id uuid, 
   status text, 
   resultado_original text, 
   observacoes text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   usuario json
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    af.id,
    af.avaliacao_id,
    af.user_id,
    af.status::text,  -- Cast explícito para text
    af.resultado_original,
    af.observacoes,
    af.created_at,
    af.updated_at,
    json_build_object(
      'id', p.user_id,
      'nome_completo', p.nome_completo,
      'email', au.email,
      'telefone', p.telefone,
      'data_nascimento', p.data_nascimento
    ) as usuario
  FROM aprovacoes_fisicas af
  JOIN perfis p ON p.user_id = af.user_id
  JOIN auth.users au ON au.id = af.user_id
  WHERE EXISTS (
    SELECT 1 FROM perfis 
    WHERE perfis.user_id = auth.uid() 
    AND perfis.role IN ('preparador', 'admin')
  )
  ORDER BY 
    CASE WHEN af.status = 'PENDENTE' THEN 0 ELSE 1 END,
    af.created_at DESC;
END;
$function$;
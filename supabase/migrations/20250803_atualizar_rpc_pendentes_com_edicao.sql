-- Atualizar função para considerar itens editados como pendentes
DROP FUNCTION IF EXISTS public.buscar_avaliacoes_fisicas_pendentes();

CREATE OR REPLACE FUNCTION public.buscar_avaliacoes_fisicas_pendentes()
 RETURNS TABLE(
   id uuid, 
   avaliacao_id uuid, 
   user_id uuid, 
   status text, 
   resultado_original text, 
   resultado_editado text,
   observacoes text, 
   created_at timestamp with time zone, 
   updated_at timestamp with time zone, 
   resultado_fisica_editado_em timestamp with time zone,
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
    -- Se tem edição e não foi aprovado depois, considera como PENDENTE
    CASE 
      WHEN p.resultado_fisica_editado_em IS NOT NULL 
           AND (af.updated_at IS NULL OR p.resultado_fisica_editado_em > af.updated_at)
           AND af.status != 'APROVADO'
      THEN 'PENDENTE'::text
      ELSE af.status::text
    END as status,
    af.resultado_original,
    af.resultado_editado,
    af.observacoes,
    af.created_at,
    af.updated_at,
    p.resultado_fisica_editado_em,
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
    -- Priorizar pendentes (incluindo editados)
    CASE 
      WHEN af.status = 'PENDENTE' 
           OR (p.resultado_fisica_editado_em IS NOT NULL 
               AND (af.updated_at IS NULL OR p.resultado_fisica_editado_em > af.updated_at)
               AND af.status != 'APROVADO')
      THEN 0 
      ELSE 1 
    END,
    af.created_at DESC;
END;
$function$;

COMMENT ON FUNCTION public.buscar_avaliacoes_fisicas_pendentes() IS 
'Busca avaliações físicas incluindo lógica para considerar itens editados como pendentes';
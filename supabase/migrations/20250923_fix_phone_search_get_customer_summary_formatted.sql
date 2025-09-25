-- ====================================
-- FIX PHONE SEARCH IN get_customer_summary_formatted RPC
-- Permite busca flexível com/sem 9º dígito em compras e perfis
-- ====================================

CREATE OR REPLACE FUNCTION public.get_customer_summary_formatted(phone_number text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    customer_profile RECORD;
    purchase_record RECORD;
    physical_assessment RECORD;
    nutritional_assessment RECORD;
    female_nutritional_assessment RECORD;
    medication_analysis RECORD;
    photos_completed INTEGER := 0;
    remaining_photos TEXT[];
    has_physical_assessment BOOLEAN := FALSE;
    has_nutritional_assessment BOOLEAN := FALSE;
    ja_comprou BOOLEAN := FALSE;
    cliente_cadastrado BOOLEAN := FALSE;
    resumo_formatado TEXT;
BEGIN
    -- PRIMEIRO: Verificar se já comprou (BUSCA FLEXÍVEL)
    SELECT * INTO purchase_record
    FROM compras
    WHERE telefone = phone_number  -- Busca exata primeiro
       OR (
           -- WhatsApp sem 9, banco com 9
           LENGTH(phone_number) = 10 AND LENGTH(telefone) = 11
           AND telefone = (SUBSTRING(phone_number, 1, 2) || '9' || SUBSTRING(phone_number, 3))
       )
       OR (
           -- WhatsApp com 9, banco sem 9
           LENGTH(phone_number) = 11 AND LENGTH(telefone) = 10
           AND SUBSTRING(phone_number, 3, 1) = '9'
           AND telefone = (SUBSTRING(phone_number, 1, 2) || SUBSTRING(phone_number, 4))
       )
       OR (
           -- Mesmo DDD + mesmos 8 últimos dígitos
           LENGTH(telefone) >= 10 AND LENGTH(phone_number) >= 10
           AND SUBSTRING(telefone, 1, 2) = SUBSTRING(phone_number, 1, 2)
           AND RIGHT(telefone, 8) = RIGHT(phone_number, 8)
       )
    LIMIT 1;

    ja_comprou := (purchase_record.id IS NOT NULL);

    -- SEGUNDO: Verificar se tem perfil cadastrado (BUSCA FLEXÍVEL)
    SELECT * INTO customer_profile
    FROM perfis
    WHERE telefone = phone_number  -- Busca exata primeiro
       OR (
           -- WhatsApp sem 9, banco com 9
           LENGTH(phone_number) = 10 AND LENGTH(telefone) = 11
           AND telefone = (SUBSTRING(phone_number, 1, 2) || '9' || SUBSTRING(phone_number, 3))
       )
       OR (
           -- WhatsApp com 9, banco sem 9
           LENGTH(phone_number) = 11 AND LENGTH(telefone) = 10
           AND SUBSTRING(phone_number, 3, 1) = '9'
           AND telefone = (SUBSTRING(phone_number, 1, 2) || SUBSTRING(phone_number, 4))
       )
       OR (
           -- Mesmo DDD + mesmos 8 últimos dígitos
           LENGTH(telefone) >= 10 AND LENGTH(phone_number) >= 10
           AND SUBSTRING(telefone, 1, 2) = SUBSTRING(phone_number, 1, 2)
           AND RIGHT(telefone, 8) = RIGHT(phone_number, 8)
       )
    LIMIT 1;

    cliente_cadastrado := (customer_profile.id IS NOT NULL);

    -- CENÁRIO 1: NÃO COMPROU (não importa se tem cadastro ou não)
    IF NOT ja_comprou THEN
        IF cliente_cadastrado THEN
            -- Tem cadastro mas não comprou
            resumo_formatado := E'RESUMO DO CLIENTE\n====================\n' ||
                'Nome: ' || customer_profile.nome_completo || E'\n' ||
                'Telefone: ' || customer_profile.telefone || E'\n' ||
                'Sexo: ' || customer_profile.sexo || E'\n' ||
                'Data cadastro: ' || customer_profile.created_at || E'\n\n' ||
                E'SITUAÇÃO DE COMPRA:\n❌ NÃO COMPROU - Oportunidade de Venda\n\n' ||
                E'RECOMENDAÇÃO PARA O AGENTE:\nCliente já tem cadastro mas nunca comprou. Reativar interesse, oferecer desconto/promoção e entender objeções.';
        ELSE
            -- Cliente totalmente novo
            resumo_formatado := E'RESUMO DO CLIENTE\n====================\n' ||
                'Telefone: ' || phone_number || E'\n\n' ||
                E'SITUAÇÃO DE COMPRA:\n❌ CLIENTE NOVO - Não encontrado no sistema\n\n' ||
                E'RECOMENDAÇÃO PARA O AGENTE:\nCliente totalmente novo. Direcionar para vendas, oferecer informações sobre produtos e capturar interesse.';
        END IF;

        RETURN json_build_object('resumo_cliente', resumo_formatado);
    END IF;

    -- CENÁRIO 2: JÁ COMPROU MAS NÃO TEM CADASTRO
    IF ja_comprou AND NOT cliente_cadastrado THEN
        resumo_formatado := E'RESUMO DO CLIENTE\n====================\n' ||
            'Telefone: ' || phone_number || E'\n' ||
            'Data da compra: ' || to_char(purchase_record.created_at, 'DD/MM/YYYY HH24:MI') || E'\n\n' ||
            E'SITUAÇÃO DE COMPRA:\n✅ JÁ COMPROU - Mas NÃO se cadastrou no site\n\n' ||
            E'RECOMENDAÇÃO PARA O AGENTE:\n🎉 PARABENIZAR pela compra! Orientar sobre necessidade do cadastro para acessar conteúdo. Ser acolhedor: "Que legal, você comprou conosco!" Focar em resolver acesso ao conteúdo.';

        RETURN json_build_object('resumo_cliente', resumo_formatado);
    END IF;

    -- CENÁRIO 3: JÁ COMPROU E TEM CADASTRO - análise completa

    -- Buscar avaliação física (SECURITY DEFINER bypassa RLS)
    SELECT * INTO physical_assessment
    FROM avaliacao_fisica
    WHERE user_id = customer_profile.user_id;

    has_physical_assessment := (physical_assessment.id IS NOT NULL);

    -- Buscar avaliação nutricional baseada no sexo (SECURITY DEFINER bypassa RLS)
    IF customer_profile.sexo = 'feminino' THEN
        SELECT * INTO female_nutritional_assessment
        FROM avaliacao_nutricional_feminino
        WHERE user_id = customer_profile.user_id;

        has_nutritional_assessment := (female_nutritional_assessment.id IS NOT NULL);
    ELSE
        SELECT * INTO nutritional_assessment
        FROM avaliacao_nutricional
        WHERE user_id = customer_profile.user_id;

        has_nutritional_assessment := (nutritional_assessment.id IS NOT NULL);
    END IF;

    -- Buscar análise de medicamentos
    SELECT * INTO medication_analysis
    FROM analises_medicamentos
    WHERE user_id = customer_profile.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Contar fotos de progresso (NOVO SISTEMA: apenas lateral e abertura)
    SELECT
        CASE WHEN foto_lateral_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN foto_abertura_url IS NOT NULL THEN 1 ELSE 0 END
    INTO photos_completed
    FROM perfis
    WHERE user_id = customer_profile.user_id;

    -- Determinar fotos restantes (NOVO SISTEMA)
    SELECT array_agg(missing_photo) INTO remaining_photos
    FROM (
        SELECT 'lateral' AS missing_photo WHERE customer_profile.foto_lateral_url IS NULL
        UNION ALL
        SELECT 'abertura' AS missing_photo WHERE customer_profile.foto_abertura_url IS NULL
    ) AS missing;

    -- Construir resumo formatado para cliente completo
    resumo_formatado := E'RESUMO DO CLIENTE\n====================\n' ||
        'Nome: ' || customer_profile.nome_completo || E'\n' ||
        'Telefone: ' || customer_profile.telefone || E'\n' ||
        'Sexo: ' || customer_profile.sexo || E'\n' ||
        'Data cadastro: ' || customer_profile.created_at || E'\n' ||
        'Status: ' || customer_profile.liberado || E'\n\n' ||

        E'SITUAÇÃO DE COMPRA:\n✅ JÁ COMPROU - Cliente ativo (' || to_char(purchase_record.created_at, 'DD/MM/YYYY') || E')\n\n' ||

        E'AVALIAÇÕES:\n';

    -- Adicionar status da avaliação física
    IF has_physical_assessment THEN
        resumo_formatado := resumo_formatado || '- Física: ✅ Preenchida (' ||
            COALESCE(physical_assessment.objetivo, 'sem objetivo') || ', ' ||
            COALESCE(physical_assessment.experiencia_musculacao, 'sem experiência') || E')\n';
    ELSE
        resumo_formatado := resumo_formatado || E'- Física: ❌ Pendente\n';
    END IF;

    -- Adicionar status da avaliação nutricional
    IF has_nutritional_assessment THEN
        IF customer_profile.sexo = 'feminino' THEN
            resumo_formatado := resumo_formatado || '- Nutricional: ✅ Preenchida (' ||
                COALESCE(female_nutritional_assessment.objetivo, 'sem objetivo') || E')\n';
        ELSE
            resumo_formatado := resumo_formatado || '- Nutricional: ✅ Preenchida (' ||
                COALESCE(nutritional_assessment.objetivo, 'sem objetivo') || E')\n';
        END IF;
    ELSE
        resumo_formatado := resumo_formatado || E'- Nutricional: ❌ Pendente\n';
    END IF;

    -- Adicionar status das fotos (NOVO SISTEMA: 2 fotos)
    resumo_formatado := resumo_formatado || E'\nFOTOS DE PROGRESSO (' || photos_completed || E'/2):\n';

    resumo_formatado := resumo_formatado || '- Lateral: ' ||
        CASE WHEN customer_profile.foto_lateral_url IS NOT NULL THEN '✅ Enviada' ELSE '❌ Pendente' END || E'\n';

    resumo_formatado := resumo_formatado || '- Abertura: ' ||
        CASE WHEN customer_profile.foto_abertura_url IS NOT NULL THEN '✅ Enviada' ELSE '❌ Pendente' END || E'\n';

    -- Próxima ação para fotos
    resumo_formatado := resumo_formatado || E'\nPRÓXIMA AÇÃO FOTOS: ';
    IF photos_completed = 2 THEN
        resumo_formatado := resumo_formatado || E'Todas as fotos foram enviadas - Pronto para análise\n';
    ELSIF photos_completed = 0 THEN
        resumo_formatado := resumo_formatado || E'Solicitar primeira foto (lateral)\n';
    ELSE
        resumo_formatado := resumo_formatado || 'Solicitar próxima foto: ' || (remaining_photos)[1] || E'\n';
    END IF;

    -- Documentos médicos
    resumo_formatado := resumo_formatado || E'\nDOCUMENTOS MÉDICOS:\n- Status: ' ||
        COALESCE(medication_analysis.status, 'NENHUM') || E'\n';

    -- NOVA LÓGICA: Verificação prioritária para clientes liberados
    resumo_formatado := resumo_formatado || E'\nRECOMENDAÇÃO PARA O AGENTE:\n';

    -- PRIORIDADE 1: Cliente liberado
    IF customer_profile.liberado = 'sim' THEN
        resumo_formatado := resumo_formatado || '🎉 CLIENTE LIBERADO - Direcionar para o site para visualizar treinos e dieta. Todos os dados estão completos e processados.';
    -- PRIORIDADE 2: Avaliações pendentes
    ELSIF NOT has_physical_assessment OR NOT has_nutritional_assessment THEN
        resumo_formatado := resumo_formatado || 'Priorizar conclusão das avaliações pendentes. Enviar links diretos e oferecer suporte.';
    -- PRIORIDADE 3: Fotos pendentes
    ELSIF photos_completed < 2 THEN
        resumo_formatado := resumo_formatado || 'Solicitar fotos de progresso restantes. Explicar importância para análise corporal.';
    -- PRIORIDADE 4: Em processo
    ELSE
        resumo_formatado := resumo_formatado || 'Cliente em processo de finalização - Acompanhar próximos passos.';
    END IF;

    RETURN json_build_object('resumo_cliente', resumo_formatado);
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION get_customer_summary_formatted(TEXT) IS
'Retorna resumo formatado do cliente para WhatsApp. ATUALIZADA: Busca flexível de telefone resolve problema do 9º dígito em compras e perfis. Funciona com telefones de 10 ou 11 dígitos automaticamente.';
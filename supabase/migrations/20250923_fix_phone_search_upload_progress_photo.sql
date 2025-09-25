-- ====================================
-- FIX PHONE SEARCH IN upload_progress_photo RPC
-- Permite busca flexível com/sem 9º dígito do telefone
-- ====================================

-- Atualizar a função upload_progress_photo com busca flexível de telefone
CREATE OR REPLACE FUNCTION upload_progress_photo(
    user_phone TEXT,
    photo_base64 TEXT,
    photo_position TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    file_extension TEXT;
    file_name TEXT;
    file_path TEXT;
    column_name TEXT;
    timestamp_column_name TEXT;
    update_query TEXT;
    public_url TEXT;
    remaining_photos TEXT[];
    photos_completed INTEGER := 0;
    v_request_id BIGINT;
BEGIN
    -- Validar posição da foto (SISTEMA DE 2 FOTOS)
    IF photo_position NOT IN ('lateral', 'abertura') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Posição inválida. Use: lateral, abertura'
        );
    END IF;

    -- BUSCA FLEXÍVEL DO USUÁRIO PELO TELEFONE
    -- Tenta múltiplas variações para resolver problema do 9º dígito
    SELECT * INTO user_record
    FROM perfis
    WHERE telefone = user_phone  -- Primeira tentativa: busca exata
       OR (
           -- Se WhatsApp tem 10 dígitos, procurar versão com 9 no banco
           LENGTH(user_phone) = 10 AND LENGTH(telefone) = 11
           AND telefone = (SUBSTRING(user_phone, 1, 2) || '9' || SUBSTRING(user_phone, 3))
       )
       OR (
           -- Se WhatsApp tem 11 dígitos, procurar versão sem 9 no banco
           LENGTH(user_phone) = 11 AND LENGTH(telefone) = 10
           AND SUBSTRING(user_phone, 3, 1) = '9'
           AND telefone = (SUBSTRING(user_phone, 1, 2) || SUBSTRING(user_phone, 4))
       )
       OR (
           -- Busca por core: mesmo DDD + mesmos 8 últimos dígitos
           LENGTH(telefone) >= 10 AND LENGTH(user_phone) >= 10
           AND SUBSTRING(telefone, 1, 2) = SUBSTRING(user_phone, 1, 2)  -- Mesmo DDD
           AND RIGHT(telefone, 8) = RIGHT(user_phone, 8)  -- Mesmos 8 últimos
       )
    LIMIT 1;

    IF user_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado com este telefone'
        );
    END IF;

    -- Determinar extensão (assumindo JPG por padrão)
    file_extension := '.jpg';

    -- Gerar nome do arquivo
    file_name := photo_position || '_' || extract(epoch from now())::bigint || file_extension;
    file_path := user_record.user_id || '/' || file_name;

    -- Chamar Edge Function via pg_net (sem autenticação pois JWT está desativado)
    BEGIN
        -- Fazer a chamada HTTP com body como JSONB
        SELECT net.http_post(
            url := 'https://nbzblkwylsgnafsegzot.supabase.co/functions/v1/upload-progress-photo',
            body := json_build_object(
                'photo_base64', photo_base64,
                'file_path', file_path,
                'content_type', 'image/jpeg'
            )::jsonb,
            headers := jsonb_build_object(
                'Content-Type', 'application/json'
            )
        ) INTO v_request_id;

        -- Como net.http_post é assíncrono, vamos assumir sucesso e construir a URL
        public_url := 'https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/fotos-usuarios/' || file_path;

        -- Log para debug
        RAISE NOTICE 'Upload iniciado com request_id: % para arquivo: %', v_request_id, file_path;

    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erro ao processar upload: ' || SQLERRM
        );
    END;

    -- Determinar quais colunas atualizar (URL + timestamp)
    CASE photo_position
        WHEN 'lateral' THEN
            column_name := 'foto_lateral_url';
            timestamp_column_name := 'foto_lateral_enviada_em';
        WHEN 'abertura' THEN
            column_name := 'foto_abertura_url';
            timestamp_column_name := 'foto_abertura_enviada_em';
    END CASE;

    -- Atualizar URL e timestamp simultaneamente
    update_query := format(
        'UPDATE perfis SET %I = $1, %I = NOW() WHERE user_id = $2',
        column_name,
        timestamp_column_name
    );
    EXECUTE update_query USING public_url, user_record.user_id;

    -- Contar quantas fotos já foram enviadas (SISTEMA DE 2 FOTOS)
    SELECT
        CASE WHEN foto_lateral_url IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN foto_abertura_url IS NOT NULL THEN 1 ELSE 0 END
    INTO photos_completed
    FROM perfis
    WHERE user_id = user_record.user_id;

    -- Construir array de fotos restantes
    SELECT array_agg(missing_photo) INTO remaining_photos
    FROM (
        SELECT unnest(ARRAY['lateral', 'abertura']) AS missing_photo
        EXCEPT
        SELECT photo_pos FROM (
            SELECT CASE WHEN foto_lateral_url IS NOT NULL THEN 'lateral' END AS photo_pos
            FROM perfis WHERE user_id = user_record.user_id
            UNION ALL
            SELECT CASE WHEN foto_abertura_url IS NOT NULL THEN 'abertura' END
            FROM perfis WHERE user_id = user_record.user_id
        ) t WHERE photo_pos IS NOT NULL
    ) AS missing;

    -- Retornar resultado (compatível com sistema antigo)
    RETURN json_build_object(
        'success', true,
        'photo_url', public_url,
        'photo_position', photo_position,
        'photos_completed', photos_completed,
        'total_photos', 2,
        'remaining_photos', COALESCE(remaining_photos, ARRAY[]::TEXT[]),
        'all_photos_completed', (photos_completed = 2),
        'message', CASE
            WHEN photos_completed = 2 THEN 'Todas as fotos foram enviadas com sucesso!'
            ELSE 'Foto de ' || photo_position || ' salva! Falta ' || (2 - photos_completed) || ' foto(s).'
        END,
        'timestamp', NOW(),
        'request_id', v_request_id
    );
END;
$$;

-- Grant permissions (manter as mesmas permissões)
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) IS
'Faz upload de fotos de progresso via Base64. ATUALIZADA: Busca flexível de telefone resolve problema do 9º dígito entre WhatsApp e banco. Funciona com telefones de 10 ou 11 dígitos automaticamente.';
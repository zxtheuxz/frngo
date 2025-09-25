-- ====================================
-- SIMPLIFICAR RPC DE UPLOAD DE FOTOS
-- Remover dependência de http_post
-- ====================================

-- Dropar função antiga
DROP FUNCTION IF EXISTS upload_progress_photo(TEXT, TEXT, TEXT);

-- Criar função simplificada que apenas salva dados no banco
-- O upload real deve ser feito pela Edge Function diretamente
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
    file_name TEXT;
    file_path TEXT;
    column_name TEXT;
    timestamp_column_name TEXT;
    update_query TEXT;
    public_url TEXT;
    remaining_photos TEXT[];
    photos_completed INTEGER := 0;
BEGIN
    -- Validar posição da foto (NOVO SISTEMA: apenas lateral e abertura)
    IF photo_position NOT IN ('lateral', 'abertura') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Posição inválida. Use: lateral, abertura'
        );
    END IF;
    
    -- Buscar usuário pelo telefone
    SELECT * INTO user_record 
    FROM perfis 
    WHERE telefone = user_phone;
    
    IF user_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado com este telefone'
        );
    END IF;
    
    -- Gerar nome do arquivo e path
    file_name := photo_position || '_' || extract(epoch from now())::bigint || '.jpg';
    file_path := user_record.user_id || '/' || file_name;
    
    -- Construir URL pública esperada
    public_url := 'https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/fotos-usuarios/' || file_path;
    
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
    
    -- Contar quantas fotos já foram enviadas (NOVO SISTEMA: 2 fotos)
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
    
    -- Retornar resultado com informações para fazer upload via Edge Function
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
        -- Informações para upload via Edge Function
        'upload_info', json_build_object(
            'file_path', file_path,
            'bucket', 'fotos-usuarios',
            'edge_function_url', 'https://nbzblkwylsgnafsegzot.supabase.co/functions/v1/upload-progress-photo'
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO authenticated;

-- Criar função alternativa para processar upload via WhatsApp
-- Esta função deve ser chamada APÓS o upload ser feito pela Edge Function
CREATE OR REPLACE FUNCTION process_whatsapp_photo_upload(
    user_phone TEXT,
    photo_url TEXT,
    photo_position TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
    column_name TEXT;
    timestamp_column_name TEXT;
    update_query TEXT;
    remaining_photos TEXT[];
    photos_completed INTEGER := 0;
BEGIN
    -- Validar posição da foto
    IF photo_position NOT IN ('lateral', 'abertura') THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Posição inválida. Use: lateral, abertura'
        );
    END IF;
    
    -- Buscar usuário pelo telefone
    SELECT * INTO user_record 
    FROM perfis 
    WHERE telefone = user_phone;
    
    IF user_record IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Usuário não encontrado com este telefone'
        );
    END IF;
    
    -- Determinar quais colunas atualizar
    CASE photo_position
        WHEN 'lateral' THEN 
            column_name := 'foto_lateral_url';
            timestamp_column_name := 'foto_lateral_enviada_em';
        WHEN 'abertura' THEN 
            column_name := 'foto_abertura_url';
            timestamp_column_name := 'foto_abertura_enviada_em';
    END CASE;
    
    -- Atualizar URL e timestamp
    update_query := format(
        'UPDATE perfis SET %I = $1, %I = NOW() WHERE user_id = $2', 
        column_name, 
        timestamp_column_name
    );
    EXECUTE update_query USING photo_url, user_record.user_id;
    
    -- Contar quantas fotos já foram enviadas
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
    
    -- Retornar resultado
    RETURN json_build_object(
        'success', true,
        'photo_url', photo_url,
        'photo_position', photo_position,
        'photos_completed', photos_completed,
        'total_photos', 2,
        'remaining_photos', COALESCE(remaining_photos, ARRAY[]::TEXT[]),
        'all_photos_completed', (photos_completed = 2),
        'message', CASE 
            WHEN photos_completed = 2 THEN 'Todas as fotos foram enviadas com sucesso!'
            ELSE 'Foto de ' || photo_position || ' salva! Falta ' || (2 - photos_completed) || ' foto(s).'
        END,
        'user_info', json_build_object(
            'user_id', user_record.user_id,
            'nome', user_record.nome_completo,
            'telefone', user_record.telefone
        )
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_whatsapp_photo_upload(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION process_whatsapp_photo_upload(TEXT, TEXT, TEXT) TO authenticated;

-- Comentários explicativos
COMMENT ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) IS 
'Versão simplificada que apenas prepara dados para upload. O upload real deve ser feito via Edge Function.';

COMMENT ON FUNCTION process_whatsapp_photo_upload(TEXT, TEXT, TEXT) IS 
'Processa foto já enviada via Edge Function, atualizando o perfil do usuário.';
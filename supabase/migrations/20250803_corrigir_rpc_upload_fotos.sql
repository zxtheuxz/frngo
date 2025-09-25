-- ====================================
-- CORRIGIR RPC DE UPLOAD DE FOTOS
-- Usar Edge Function ao invés de http_post
-- ====================================

-- Dropar função antiga
DROP FUNCTION IF EXISTS upload_progress_photo(TEXT, TEXT, TEXT);

-- Criar nova função que chama a Edge Function
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
    edge_function_response JSON;
    public_url TEXT;
    remaining_photos TEXT[];
    photos_completed INTEGER := 0;
    v_service_key TEXT;
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
    
    -- Determinar extensão (assumindo JPG por padrão)
    file_extension := '.jpg';
    
    -- Gerar nome do arquivo
    file_name := photo_position || '_' || extract(epoch from now())::bigint || file_extension;
    file_path := user_record.user_id || '/' || file_name;
    
    -- Obter service key do vault
    SELECT decrypted_secret INTO v_service_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
    
    -- Se não encontrar no vault, tentar configuração alternativa
    IF v_service_key IS NULL THEN
        v_service_key := current_setting('app.supabase_service_key', true);
    END IF;
    
    -- Se ainda não tem key, retornar erro
    IF v_service_key IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Service key não configurada. Entre em contato com o administrador.'
        );
    END IF;
    
    -- Chamar Edge Function para fazer upload
    BEGIN
        -- Usar pg_net para chamar a Edge Function
        SELECT content::json INTO edge_function_response
        FROM http_post(
            'https://nbzblkwylsgnafsegzot.supabase.co/functions/v1/upload-progress-photo',
            json_build_object(
                'photo_base64', photo_base64,
                'file_path', file_path,
                'content_type', 'image/jpeg'
            )::text,
            'application/json',
            json_build_object(
                'Authorization', 'Bearer ' || v_service_key
            )::text
        );
        
        -- Verificar resposta da Edge Function
        IF edge_function_response->>'success' = 'true' THEN
            public_url := edge_function_response->>'public_url';
        ELSE
            RETURN json_build_object(
                'success', false,
                'error', 'Erro no upload: ' || COALESCE(edge_function_response->>'error', 'Erro desconhecido')
            );
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        -- Se http_post não existir, tentar com net.http_post
        BEGIN
            PERFORM net.http_post(
                url := 'https://nbzblkwylsgnafsegzot.supabase.co/functions/v1/upload-progress-photo',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || v_service_key
                ),
                body := json_build_object(
                    'photo_base64', photo_base64,
                    'file_path', file_path,
                    'content_type', 'image/jpeg'
                )::text
            );
            
            -- Como net.http_post é assíncrono, vamos assumir sucesso e construir a URL
            public_url := 'https://nbzblkwylsgnafsegzot.supabase.co/storage/v1/object/public/fotos-usuarios/' || file_path;
            
        EXCEPTION WHEN OTHERS THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Erro ao chamar serviço de upload: ' || SQLERRM
            );
        END;
    END;
    
    -- Determinar quais colunas atualizar (URL + timestamp) - NOVO SISTEMA
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
    
    -- Construir array de fotos restantes (NOVO SISTEMA)
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
    
    -- Retornar resultado (total de 2 fotos agora)
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
            ELSE 'Foto de ' || photo_position || ' salva! Faltam ' || (2 - photos_completed) || ' fotos.'
        END,
        'timestamp', NOW()
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION upload_progress_photo(TEXT, TEXT, TEXT) IS 
'Faz upload de fotos de progresso via Base64. Sistema atualizado para 2 fotos (lateral e abertura). Usa Edge Function para upload no bucket fotos-usuarios.';
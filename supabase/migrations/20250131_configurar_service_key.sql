-- ====================================
-- CONFIGURAR SERVICE KEY NO VAULT
-- ====================================

-- Inserir service key no vault do Supabase
INSERT INTO vault.secrets (name, secret, description)
VALUES (
  'service_role_key',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iemJsa3d5bHNnbmFmc2Vnem90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDM5NjU3MSwiZXhwIjoyMDU1OTcyNTcxfQ.FEiqRHa6hiot7DrQTEkaOntcQwZit6F51kUHK4REF1k',
  'Service role key para chamadas internas de Edge Functions'
)
ON CONFLICT (name) 
DO UPDATE SET 
  secret = EXCLUDED.secret,
  updated_at = now();

-- Verificar se foi inserida corretamente
DO $$
DECLARE
  v_key_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key'
  ) INTO v_key_exists;
  
  IF v_key_exists THEN
    RAISE NOTICE 'Service key configurada com sucesso no vault!';
  ELSE
    RAISE WARNING 'Falha ao configurar service key no vault';
  END IF;
END $$;
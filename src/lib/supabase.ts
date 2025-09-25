import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as credenciais do Supabase. Por favor, configure as variáveis de ambiente.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Reduzir eventos desnecessários
    autoRefreshToken: true, // Manter true mas com configurações otimizadas
    persistSession: true,   // Necessário para manter login
    detectSessionInUrl: false, // Desabilitar detecção desnecessária de URL
    flowType: 'pkce', // Usar PKCE ao invés de implicit para reduzir eventos
    
    // Configurações de storage para otimizar persistência
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    
    // Debug desabilitado para evitar poluição do console
    debug: false
  }
});
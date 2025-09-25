import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  sessionValid: boolean;
}

interface AuthOperationOptions {
  retries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onError?: (error: string) => void;
}

/**
 * Hook personalizado para gerenciar autenticação com retry e recovery
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    sessionValid: false,
  });

  const [sessionCheckInterval, setSessionCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Função para verificar se a sessão ainda é válida
  const checkSessionValidity = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[useAuth] Erro ao verificar sessão:', error);
        return false;
      }

      if (!session) {
        console.warn('[useAuth] Sessão não encontrada');
        return false;
      }

      // Verificar se o token ainda é válido
      const now = Date.now() / 1000;
      const expiresAt = session.expires_at;

      if (expiresAt && now > expiresAt) {
        console.warn('[useAuth] Token expirado');
        return false;
      }

      // Verificar se o token expira nos próximos 5 minutos (300 segundos)
      const timeToExpiry = expiresAt ? expiresAt - now : 0;
      if (timeToExpiry < 300) {
        console.warn('[useAuth] Token expira em breve, tentando renovar...');
        try {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[useAuth] Erro ao renovar sessão:', refreshError);
            return false;
          }
          console.log('[useAuth] Sessão renovada com sucesso');
          return true;
        } catch (refreshErr) {
          console.error('[useAuth] Erro no refresh da sessão:', refreshErr);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('[useAuth] Erro na verificação de validade da sessão:', error);
      return false;
    }
  }, []);

  // Função para obter usuário com retry
  const getUserWithRetry = useCallback(async (options: AuthOperationOptions = {}): Promise<User | null> => {
    const { retries = 3, retryDelay = 1000, onRetry, onError } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[useAuth] Tentativa ${attempt}/${retries} de obter usuário`);

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
          throw new Error(`Erro do Supabase: ${error.message}`);
        }

        if (user) {
          console.log('[useAuth] Usuário obtido com sucesso:', user.id);
          return user;
        } else {
          throw new Error('Usuário não encontrado');
        }
      } catch (error) {
        console.error(`[useAuth] Tentativa ${attempt} falhou:`, error);

        if (attempt === retries) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          onError?.(errorMessage);
          return null;
        }

        onRetry?.(attempt);

        // Aguardar antes da próxima tentativa
        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    return null;
  }, []);

  // Função para tentar recuperar sessão
  const recoverSession = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[useAuth] Tentando recuperar sessão...');

      // Primeiro, tentar obter a sessão atual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('[useAuth] Erro ao obter sessão:', sessionError);
        return false;
      }

      if (session) {
        console.log('[useAuth] Sessão recuperada com sucesso');
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          sessionValid: true,
          error: null,
        }));
        return true;
      }

      // Se não há sessão, tentar refresh
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('[useAuth] Erro ao fazer refresh da sessão:', refreshError);
        return false;
      }

      if (refreshData.session) {
        console.log('[useAuth] Sessão recuperada via refresh');
        setAuthState(prev => ({
          ...prev,
          user: refreshData.session.user,
          sessionValid: true,
          error: null,
        }));
        return true;
      }

      return false;
    } catch (error) {
      console.error('[useAuth] Erro na recuperação de sessão:', error);
      return false;
    }
  }, []);

  // Inicializar autenticação
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));

        const user = await getUserWithRetry({
          retries: 3,
          onRetry: (attempt) => {
            console.log(`[useAuth] Retry ${attempt} para obter usuário inicial`);
          },
          onError: (error) => {
            console.error('[useAuth] Falha ao obter usuário inicial:', error);
          }
        });

        if (mounted) {
          if (user) {
            const sessionValid = await checkSessionValidity();
            setAuthState({
              user,
              loading: false,
              error: null,
              sessionValid,
            });
          } else {
            setAuthState({
              user: null,
              loading: false,
              error: 'Usuário não autenticado',
              sessionValid: false,
            });
          }
        }
      } catch (error) {
        if (mounted) {
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido na inicialização';
          setAuthState({
            user: null,
            loading: false,
            error: errorMessage,
            sessionValid: false,
          });
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, [getUserWithRetry, checkSessionValidity]);

  // Monitorar mudanças de autenticação
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        console.log('[useAuth] Mudança de estado de auth:', event);

        if (event === 'SIGNED_IN' && session) {
          setAuthState({
            user: session.user,
            loading: false,
            error: null,
            sessionValid: true,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
            error: null,
            sessionValid: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setAuthState(prev => ({
            ...prev,
            user: session.user,
            sessionValid: true,
            error: null,
          }));
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Verificação periódica de sessão
  useEffect(() => {
    if (authState.user && authState.sessionValid) {
      const interval = setInterval(async () => {
        const isValid = await checkSessionValidity();
        setAuthState(prev => ({
          ...prev,
          sessionValid: isValid,
        }));

        if (!isValid) {
          console.warn('[useAuth] Sessão inválida detectada na verificação periódica');
        }
      }, 60000); // Verificar a cada minuto

      setSessionCheckInterval(interval);

      return () => {
        clearInterval(interval);
        setSessionCheckInterval(null);
      };
    }
  }, [authState.user, authState.sessionValid, checkSessionValidity]);

  // Limpar intervalo quando componente desmonta
  useEffect(() => {
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [sessionCheckInterval]);

  return {
    ...authState,
    getUserWithRetry,
    recoverSession,
    checkSessionValidity,
    // Função de conveniência para operações que requerem usuário autenticado
    requireAuth: useCallback(async (options?: AuthOperationOptions): Promise<User | null> => {
      if (authState.user && authState.sessionValid) {
        return authState.user;
      }

      console.log('[useAuth] Usuário não autenticado ou sessão inválida, tentando recuperar...');

      const recovered = await recoverSession();
      if (recovered) {
        return authState.user;
      }

      return await getUserWithRetry(options);
    }, [authState.user, authState.sessionValid, recoverSession, getUserWithRetry]),
  };
}
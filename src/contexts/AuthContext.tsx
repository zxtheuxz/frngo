import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  user_id: string;
  role: string;
  nome_completo?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  getDefaultRouteForRole: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache de perfil em sessionStorage (mais adequado para dados de sessão)
const PROFILE_CACHE_KEY = 'user_profile_cache';
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 horas (aumentado para reduzir expirações)

// Monitoramento de sessão
let sessionMonitorInterval: NodeJS.Timeout | null = null;
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // Verificar a cada 5 minutos
const TOKEN_REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh quando faltam 10 minutos para expirar


export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  console.log('useAuth: Hook chamado, retornando contexto:', {
    userProfile: context.userProfile,
    loading: context.loading,
    profileLoading: context.profileLoading,
    user: context.user?.id
  });

  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Função para monitorar e renovar sessão automaticamente
  const startSessionMonitoring = (currentSession: Session) => {
    // Limpar intervalo anterior se existir
    if (sessionMonitorInterval) {
      clearInterval(sessionMonitorInterval);
    }

    sessionMonitorInterval = setInterval(async () => {
      try {
        if (!currentSession?.expires_at) return;

        const expiresAt = new Date(currentSession.expires_at * 1000);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();

        console.log(`AuthContext: Sessão expira em ${Math.round(timeUntilExpiry / 60000)} minutos`);

        // Se faltam menos de 10 minutos para expirar, renovar
        if (timeUntilExpiry <= TOKEN_REFRESH_THRESHOLD && timeUntilExpiry > 0) {
          console.log('AuthContext: Renovando sessão automaticamente...');
          await refreshSession();
        }
        
        // Se já expirou, fazer logout
        if (timeUntilExpiry <= 0) {
          console.log('AuthContext: Sessão expirada, fazendo logout...');
          await signOut();
        }
      } catch (error) {
        console.error('AuthContext: Erro no monitoramento de sessão:', error);
      }
    }, SESSION_CHECK_INTERVAL);
  };

  const stopSessionMonitoring = () => {
    if (sessionMonitorInterval) {
      clearInterval(sessionMonitorInterval);
      sessionMonitorInterval = null;
    }
  };

  const saveProfileToCache = (profile: UserProfile) => {
    try {
      const cacheData = {
        profile,
        timestamp: Date.now()
      };
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('AuthContext: Erro ao salvar perfil no cache:', error);
    }
  };

  const getProfileFromCache = (userId: string): UserProfile | null => {
    try {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      // Verificar se cache expirou ou é de outro usuário
      if (age > CACHE_DURATION || cacheData.profile.user_id !== userId) {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        return null;
      }

      return cacheData.profile;
    } catch (error) {
      console.warn('AuthContext: Erro ao recuperar perfil do cache:', error);
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
  };

  const clearProfileCache = () => {
    try {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (error) {
      console.warn('AuthContext: Erro ao limpar cache:', error);
    }
  };


  // Função para buscar perfil existente (sem criação automática)
  const fetchUserProfile = async (userId: string, userEmail?: string): Promise<UserProfile | null> => {
    // Criar timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na busca de perfil'));
      }, 5000);
    });

    // Criar busca promise
    const fetchPromise = (async () => {
      try {
        // Buscar o perfil existente
        const { data, error } = await supabase
          .from('perfis')
          .select('user_id, role, nome_completo')
          .eq('user_id', userId)
          .maybeSingle(); // Usar maybeSingle para não dar erro se não encontrar

        if (error) {
          console.error('AuthContext: Erro ao buscar perfil:', error);
          throw error;
        }

        // Se encontrou o perfil, retornar
        if (data) {
          console.log('AuthContext: Perfil encontrado:', data);
          return data;
        }

        // Se não encontrou, não tentar criar - apenas retornar null
        console.warn('AuthContext: Perfil não encontrado para usuário:', userId);
        return null;

      } catch (error) {
        console.error('AuthContext: Erro inesperado ao buscar perfil:', error);
        throw error;
      }
    })();

    // Race entre busca e timeout
    try {
      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      console.error('AuthContext: Falha na busca de perfil:', error);
      return null;
    }
  };

  // Função otimizada para atualizar estado
  const updateUserState = async (newSession: Session | null) => {
    try {
      if (newSession?.user) {
        setUser(newSession.user);
        setSession(newSession);

        // Iniciar monitoramento da sessão
        startSessionMonitoring(newSession);

        // Buscar perfil com cache
        const cachedProfile = getProfileFromCache(newSession.user.id);
        if (cachedProfile) {
          console.log('AuthContext: PERFIL EM CACHE encontrado:', cachedProfile);
          console.log('AuthContext: SETANDO userProfile com cache');
          setUserProfile(cachedProfile);
          console.log('AuthContext: userProfile setado com cache, loading = false');
          setLoading(false);
          // Atualizar cache em background sem bloquear
          fetchUserProfile(newSession.user.id, newSession.user.email).then(profile => {
            if (profile) {
              console.log('AuthContext: ATUALIZANDO cache em background com:', profile);
              setUserProfile(profile);
              saveProfileToCache(profile);
            }
          }).catch((error) => {
            // Se falhar na atualização do cache, manter o perfil cached
            console.warn('AuthContext: Falha na atualização do cache, mantendo perfil cached:', error);
          });
        } else {
          setProfileLoading(true);
          try {
            const profile = await fetchUserProfile(newSession.user.id, newSession.user.email);
            if (profile) {
              console.log('AuthContext: ANTES de setUserProfile, userProfile atual:', userProfile);
              console.log('AuthContext: SETANDO userProfile com:', profile);
              setUserProfile(profile);
              console.log('AuthContext: DEPOIS de setUserProfile chamado');
              saveProfileToCache(profile);
            } else {
              console.log('AuthContext: Perfil não encontrado - usuário deve ter perfil criado no cadastro');
              // Não fazer logout, apenas manter loading como false
              // O perfil será criado no processo de cadastro
            }
          } catch (error) {
            console.error('AuthContext: Erro crítico ao buscar perfil:', error);
            // Em caso de erro na busca, apenas não definir o perfil
            // Não fazer logout automático
          }
          setProfileLoading(false);
        }
      } else {
        setUser(null);
        setSession(null);
        setUserProfile(null);
        clearProfileCache();
        stopSessionMonitoring();
      }

      setLoading(false);
    } catch (error) {
      console.error('AuthContext: Erro ao atualizar estado:', error);

      // Se for erro de perfil, propagar para ser tratado no Login
      if (error instanceof Error && error.message === 'PROFILE_ERROR') {
        throw error;
      }

      setLoading(false);
      setProfileLoading(false);
    }
  };

  // Configurar listener de autenticação simplificado
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        // Se há erro ao buscar sessão (ex: token corrompido)
        if (error) {
          console.warn('AuthContext: Erro ao buscar sessão inicial, limpando dados locais:', error);
          
          // Limpar dados possivelmente corrompidos
          localStorage.removeItem('sb-' + supabase.supabaseKey.substring(0, 8) + '-auth-token');
          sessionStorage.clear();
          clearProfileCache();
          
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          await updateUserState(currentSession);
        }
      } catch (error) {
        console.error('AuthContext: Erro crítico ao inicializar auth:', error);
        
        // Limpar tudo em caso de erro crítico
        localStorage.removeItem('sb-' + supabase.supabaseKey.substring(0, 8) + '-auth-token');
        sessionStorage.clear();
        clearProfileCache();
        
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Configurar listener de mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (isMounted) {
          await updateUserState(newSession);
        }
      }
    );

    // Inicializar
    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
      subscription.unsubscribe();
      stopSessionMonitoring();
    };
  }, []); // Sem dependências para evitar loops

  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthContext: Erro no login:', error);
        setLoading(false);
        return { user: null, error };
      }

      // O listener onAuthStateChange irá atualizar o estado automaticamente
      return { user: data.user, error: null };
    } catch (error) {
      console.error('AuthContext: Erro inesperado no login:', error);
      setLoading(false);
      return { user: null, error: error as AuthError };
    }
  };

  // Função de logout
  const signOut = async () => {
    try {
      setLoading(true);
      stopSessionMonitoring();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('AuthContext: Erro no logout:', error);
      }

      // Limpar estado local imediatamente
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
    } catch (error) {
      console.error('AuthContext: Erro inesperado no logout:', error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      setSession(null);
      setUserProfile(null);
      clearProfileCache();
    } finally {
      setLoading(false);
    }
  };

  // Função para refresh manual da sessão
  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        // Tratar especificamente erro de refresh token inválido
        if (error.message?.includes('refresh token') || error.message?.includes('Invalid Refresh Token')) {
          console.warn('AuthContext: Refresh token inválido, limpando sessão local e fazendo logout silencioso');
          
          // Limpar dados locais antes do logout
          localStorage.removeItem('sb-' + supabase.supabaseKey.substring(0, 8) + '-auth-token');
          sessionStorage.clear();
          clearProfileCache();
          
          await signOut();
          return;
        }
        
        console.error('AuthContext: Erro no refresh da sessão:', error);
        await signOut();
        return;
      }

      if (data.session) {
        console.log('AuthContext: Sessão renovada com sucesso');
        await updateUserState(data.session);
      }
    } catch (error) {
      console.error('AuthContext: Erro inesperado no refresh:', error);
      
      // Em caso de erro crítico, limpar tudo
      localStorage.removeItem('sb-' + supabase.supabaseKey.substring(0, 8) + '-auth-token');
      sessionStorage.clear();
      clearProfileCache();
      
      await signOut();
    }
  };

  // Função para verificar se usuário tem determinado role
  const hasRole = (roles: string[]): boolean => {
    if (!userProfile) return false;
    return roles.includes(userProfile.role);
  };

  // Função para obter a rota padrão baseada no role
  const getDefaultRouteForRole = (): string => {
    if (!userProfile) return '/dashboard';
    
    switch (userProfile.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'preparador':
        return '/preparador/dashboard';
      case 'nutricionista':
        return '/nutricionista/dashboard';
      case 'cliente':
      case 'usuario':
      default:
        return '/dashboard';
    }
  };


  // Memoizar value para evitar re-renders desnecessários
  const value: AuthContextType = useMemo(() => {
    console.log('AuthContext: useMemo sendo recalculado');
    console.log('AuthContext: userProfile no useMemo:', userProfile);
    console.log('AuthContext: loading no useMemo:', loading);
    console.log('AuthContext: profileLoading no useMemo:', profileLoading);

    return {
      user,
      session,
      userProfile,
      loading,
      profileLoading,
      signIn,
      signOut,
      refreshSession,
      isAuthenticated: !!user,
      hasRole,
      getDefaultRouteForRole,
    };
  }, [user, session, userProfile, loading, profileLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
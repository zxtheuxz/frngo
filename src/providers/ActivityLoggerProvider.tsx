import React, { useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { useActivityLogger } from '../hooks/useActivityLogger';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const ActivityLoggerContext = createContext<ReturnType<typeof useActivityLogger> | null>(null);

export function useActivityLoggerContext() {
  const context = useContext(ActivityLoggerContext);
  if (!context) {
    throw new Error('useActivityLoggerContext deve ser usado dentro de ActivityLoggerProvider');
  }
  return context;
}

interface ActivityLoggerProviderProps {
  children: React.ReactNode;
}

export function ActivityLoggerProvider({ children }: ActivityLoggerProviderProps) {
  const activityLogger = useActivityLogger();
  const { user, isAuthenticated } = useAuth();
  
  // Usar refs para evitar logs duplicados
  const hasLoggedLogin = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Registrar login quando usuário se autentica
    if (isAuthenticated && user) {
      // Verificar se já logou para este usuário
      if (user.id !== lastUserId.current) {
        logger.debug('Novo usuário autenticado, registrando login', { userId: user.id }, 'ActivityLogger');
        lastUserId.current = user.id;
        hasLoggedLogin.current = false;
      }

      // Só registrar se ainda não foi registrado para este usuário
      if (!hasLoggedLogin.current) {
        hasLoggedLogin.current = true;
        
        // Aguardar um pouco para garantir que o contexto está estabilizado
        setTimeout(async () => {
          try {
            await activityLogger.logLogin();
            logger.info('Login registrado com sucesso', { userId: user.id }, 'ActivityLogger');
          } catch (error) {
            logger.error('Erro ao registrar login', error, 'ActivityLogger');
            // Permitir nova tentativa em caso de erro
            hasLoggedLogin.current = false;
          }
        }, 500); // Reduzido de 1000ms para 500ms
      }
    } else if (!isAuthenticated) {
      // Reset quando usuário faz logout
      hasLoggedLogin.current = false;
      lastUserId.current = null;
    }
  }, [isAuthenticated, user]); // REMOVIDO activityLogger da dependência

  useEffect(() => {
    // Interceptar antes do unload da página APENAS para fechamento real
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // Só registrar se realmente estiver fechando a aba/navegador
      // Não registrar para navegação entre páginas da aplicação
      if (user && !event.defaultPrevented) {
        // Usar sendBeacon apenas se for um fechamento real
        try {
          // TODO: Implementar endpoint /api/log-activity ou usar Supabase
          // navigator.sendBeacon('/api/log-activity', JSON.stringify({
          //   action: 'page_unload',
          //   userId: user.id,
          //   timestamp: new Date().toISOString()
          // }));
          
          if (process.env.NODE_ENV === 'development') {
            console.log('ActivityLogger: Saída da aplicação detectada (sendBeacon desabilitado)');
          }
        } catch (error) {
          // Silenciosamente ignorar erros de sendBeacon
          if (process.env.NODE_ENV === 'development') {
            console.warn('ActivityLogger: Erro ao enviar beacon:', error);
          }
        }
      }
    };

    // Usar passive listener para não interferir na performance
    window.addEventListener('beforeunload', handleBeforeUnload, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // Memoizar o valor do contexto para evitar re-renders
  const contextValue = useMemo(() => activityLogger, [activityLogger]);

  return (
    <ActivityLoggerContext.Provider value={contextValue}>
      {children}
    </ActivityLoggerContext.Provider>
  );
}
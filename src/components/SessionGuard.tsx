import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Clock, WifiOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { SessionManager } from '../utils/sessionManager';

interface SessionGuardProps {
  children: ReactNode;
  onSessionExpired?: () => void;
  onProgressSaved?: () => void;
  enableAutoSave?: boolean;
  formType?: string;
  formData?: any;
  currentStep?: number;
}

interface SessionAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timeLeft?: number;
  show: boolean;
}

export function SessionGuard({
  children,
  onSessionExpired,
  onProgressSaved,
  enableAutoSave = false,
  formType,
  formData,
  currentStep,
}: SessionGuardProps) {
  const { user, sessionValid, recoverSession, checkSessionValidity } = useAuth();
  const [alert, setAlert] = useState<SessionAlert>({ type: 'info', message: '', show: false });
  const [isRecovering, setIsRecovering] = useState(false);
  const [monitorCleanup, setMonitorCleanup] = useState<(() => void) | null>(null);

  // Formatar tempo para exibição
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Salvar progresso automaticamente
  const saveProgress = useCallback(() => {
    if (enableAutoSave && formType && formData && currentStep && user) {
      SessionManager.saveFormProgress(formType, currentStep, formData, user.id);
      onProgressSaved?.();
      console.log('[SessionGuard] Progresso salvo automaticamente');
    }
  }, [enableAutoSave, formType, formData, currentStep, user, onProgressSaved]);

  // Tentar recuperar sessão
  const handleRecoverSession = useCallback(async () => {
    setIsRecovering(true);
    setAlert({ type: 'info', message: 'Tentando recuperar sessão...', show: true });

    try {
      const recovered = await recoverSession();

      if (recovered) {
        setAlert({
          type: 'info',
          message: 'Sessão recuperada com sucesso!',
          show: true
        });

        // Ocultar alerta após 3 segundos
        setTimeout(() => {
          setAlert(prev => ({ ...prev, show: false }));
        }, 3000);
      } else {
        setAlert({
          type: 'error',
          message: 'Não foi possível recuperar a sessão. Você será redirecionado para login.',
          show: true
        });

        // Aguardar 5 segundos antes de executar callback
        setTimeout(() => {
          onSessionExpired?.();
        }, 5000);
      }
    } catch (error) {
      console.error('[SessionGuard] Erro na recuperação de sessão:', error);
      setAlert({
        type: 'error',
        message: 'Erro ao tentar recuperar sessão. Redirecionando...',
        show: true
      });

      setTimeout(() => {
        onSessionExpired?.();
      }, 3000);
    } finally {
      setIsRecovering(false);
    }
  }, [recoverSession, onSessionExpired]);

  // Configurar monitor de sessão
  useEffect(() => {
    if (user && sessionValid) {
      // Salvar progresso inicial
      saveProgress();

      const cleanup = SessionManager.createSessionMonitor({
        onExpiringSoon: (timeToExpiry) => {
          console.log('[SessionGuard] Sessão expirando em breve:', timeToExpiry);

          // Salvar progresso antes de expirar
          saveProgress();

          setAlert({
            type: 'warning',
            message: 'Sua sessão expirará em breve.',
            timeLeft: timeToExpiry,
            show: true,
          });
        },

        onExpired: () => {
          console.log('[SessionGuard] Sessão expirada');

          // Salvar progresso antes de perder sessão
          saveProgress();

          setAlert({
            type: 'error',
            message: 'Sua sessão expirou.',
            show: true,
          });

          onSessionExpired?.();
        },

        onRefreshed: () => {
          console.log('[SessionGuard] Sessão renovada automaticamente');
          setAlert({
            type: 'info',
            message: 'Sessão renovada automaticamente.',
            show: true,
          });

          // Ocultar alerta após 3 segundos
          setTimeout(() => {
            setAlert(prev => ({ ...prev, show: false }));
          }, 3000);
        },

        onError: (error) => {
          console.error('[SessionGuard] Erro no monitor de sessão:', error);
          setAlert({
            type: 'error',
            message: 'Erro na verificação de sessão.',
            show: true,
          });
        },
      });

      setMonitorCleanup(cleanup);

      return cleanup;
    }
  }, [user, sessionValid, saveProgress, onSessionExpired]);

  // Auto-save periódico quando há dados
  useEffect(() => {
    if (enableAutoSave && formData && user) {
      const interval = setInterval(() => {
        saveProgress();
      }, 30000); // Salvar a cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [enableAutoSave, formData, user, saveProgress]);

  // Limpar monitor ao desmontar
  useEffect(() => {
    return () => {
      if (monitorCleanup) {
        monitorCleanup();
      }
    };
  }, [monitorCleanup]);

  // Verificar se sessão é inválida
  if (user && !sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center border border-red-200">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-6">
            <WifiOff className="w-8 h-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Problema de Conectividade
          </h2>

          <p className="text-gray-600 mb-6">
            Sua sessão não está mais válida. Isso pode ter acontecido devido a problemas de rede ou expiração da sessão.
          </p>

          {enableAutoSave && formType && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-700">
                <strong>Seus dados foram salvos!</strong><br />
                Quando você fizer login novamente, poderá continuar de onde parou.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRecoverSession}
              disabled={isRecovering}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isRecovering ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Recuperando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Reconectar
                </>
              )}
            </button>

            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-3 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar children com alertas de sessão
  return (
    <div className="relative">
      {/* Alerta de sessão */}
      {alert.show && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full`}>
          <div className={`
            p-4 rounded-lg shadow-lg border-l-4
            ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-400' : ''}
            ${alert.type === 'error' ? 'bg-red-50 border-red-400' : ''}
            ${alert.type === 'info' ? 'bg-blue-50 border-blue-400' : ''}
          `}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                {alert.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600" />}
                {alert.type === 'info' && <Clock className="w-5 h-5 text-blue-600" />}
              </div>

              <div className="ml-3 flex-1">
                <p className={`text-sm font-medium
                  ${alert.type === 'warning' ? 'text-yellow-800' : ''}
                  ${alert.type === 'error' ? 'text-red-800' : ''}
                  ${alert.type === 'info' ? 'text-blue-800' : ''}
                `}>
                  {alert.message}
                </p>

                {alert.timeLeft && alert.timeLeft > 0 && (
                  <p className={`text-xs mt-1
                    ${alert.type === 'warning' ? 'text-yellow-700' : ''}
                    ${alert.type === 'error' ? 'text-red-700' : ''}
                    ${alert.type === 'info' ? 'text-blue-700' : ''}
                  `}>
                    Tempo restante: {formatTime(alert.timeLeft)}
                  </p>
                )}
              </div>

              <button
                onClick={() => setAlert(prev => ({ ...prev, show: false }))}
                className={`ml-4 text-sm font-medium
                  ${alert.type === 'warning' ? 'text-yellow-800 hover:text-yellow-900' : ''}
                  ${alert.type === 'error' ? 'text-red-800 hover:text-red-900' : ''}
                  ${alert.type === 'info' ? 'text-blue-800 hover:text-blue-900' : ''}
                `}
              >
                ×
              </button>
            </div>

            {alert.type === 'warning' && (
              <div className="mt-3">
                <button
                  onClick={handleRecoverSession}
                  disabled={isRecovering}
                  className="text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isRecovering ? 'Renovando...' : 'Renovar Agora'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Conteúdo protegido */}
      {children}
    </div>
  );
}
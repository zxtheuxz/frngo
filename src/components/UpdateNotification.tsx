import React, { useEffect, useState, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

interface UpdateNotificationProps {
  onClose?: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onClose }) => {
  const [showReloadPrompt, setShowReloadPrompt] = useState(false);
  const [countdown, setCountdown] = useState(1);

  // Função para forçar reload bypass cache
  const forceReload = useCallback(() => {
    // Limpar todos os caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // Força reload ignorando cache
    window.location.reload();
  }, []);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('🔄 SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('❌ SW registration error:', error);
    },
    onNeedRefresh() {
      console.log('🆕 Nova versão detectada!');
      setShowReloadPrompt(true);
      setCountdown(1);
    },
    onOfflineReady() {
      console.log('✅ App pronto offline');
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowReloadPrompt(false);
    setCountdown(1);
    onClose?.();
  };

  const updateApp = () => {
    console.log('🔄 Atualizando aplicação...');
    // Tenta usar o SW primeiro, depois força reload
    try {
      updateServiceWorker(true);
      // Se SW não funcionar, força reload após 2s
      setTimeout(forceReload, 2000);
    } catch (error) {
      console.error('Erro no updateServiceWorker:', error);
      forceReload();
    }
  };

  // Countdown para auto-update mais agressivo
  useEffect(() => {
    if (needRefresh && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (needRefresh && countdown === 0) {
      updateApp();
    }
  }, [needRefresh, countdown]);

  // Sistema de detecção de mudanças ultra-agressivo
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        // Múltiplas verificações para maior confiabilidade
        const timestamp = Date.now();
        const response = await fetch(`${window.location.href}?_t=${timestamp}`, {
          cache: 'no-cache',
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });

        if (response.ok) {
          const currentVersion = document.querySelector('meta[name="build-version"]')?.getAttribute('content');
          const currentDeployId = document.querySelector('meta[name="deploy-id"]')?.getAttribute('content');
          const currentTimestamp = document.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');

          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const newVersion = doc.querySelector('meta[name="build-version"]')?.getAttribute('content');
          const newDeployId = doc.querySelector('meta[name="deploy-id"]')?.getAttribute('content');
          const newTimestamp = doc.querySelector('meta[name="build-timestamp"]')?.getAttribute('content');

          // Verificação tripla para garantir detecção de updates
          const versionChanged = currentVersion && newVersion && currentVersion !== newVersion;
          const deployIdChanged = currentDeployId && newDeployId && currentDeployId !== newDeployId;
          const timestampChanged = currentTimestamp && newTimestamp && currentTimestamp !== newTimestamp;

          if (versionChanged || deployIdChanged || timestampChanged) {
            console.log('🚀 NOVA VERSÃO DETECTADA! Forçando update...');
            console.log(`📝 Version: ${currentVersion} → ${newVersion}`);
            console.log(`🆔 Deploy ID: ${currentDeployId} → ${newDeployId}`);
            console.log(`⏰ Timestamp: ${currentTimestamp} → ${newTimestamp}`);

            setShowReloadPrompt(true);
            setCountdown(1);

            // Auto-reload ultra rápido (500ms)
            setTimeout(() => {
              console.log('⚡ Auto-reload executado!');
              forceReload();
            }, 500);
          }
        }
      } catch (error) {
        console.error('❌ Erro checking updates:', error);
      }
    };

    // Verificação muito mais frequente (5 segundos)
    const interval = setInterval(checkForUpdates, 5000);

    // Verificação imediata quando janela ganha foco
    const handleWindowFocus = () => {
      console.log('👀 Foco recuperado, verificando updates...');
      checkForUpdates();
    };

    // Verificação quando volta de background (visibilitychange)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 App visível, verificando updates...');
        checkForUpdates();
      }
    };

    // Verificação quando há conexão de rede
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada, verificando updates...');
      setTimeout(checkForUpdates, 1000);
    };

    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    // Verificação inicial após 2 segundos
    const initialCheck = setTimeout(checkForUpdates, 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialCheck);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [forceReload]);

  if (!showReloadPrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 rounded-lg shadow-lg border border-red-500 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-red-200 animate-spin" />
            <div>
              <h3 className="font-semibold text-sm">
                🚀 Nova versão disponível!
              </h3>
              <p className="text-xs text-red-100 mt-1">
                {countdown > 0
                  ? `⚡ Atualizando em ${countdown}s...`
                  : '🚀 Atualizando agora!'
                }
              </p>
            </div>
          </div>

          <button
            onClick={close}
            className="ml-2 text-red-200 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex space-x-2">
          <button
            onClick={updateApp}
            className="flex items-center space-x-1 bg-white text-red-700 px-3 py-1 rounded text-xs font-medium hover:bg-red-50 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Atualizar Agora</span>
          </button>
          <button
            onClick={close}
            className="text-red-200 hover:text-white text-xs px-2 py-1 transition-colors"
          >
            Cancelar
          </button>
        </div>

        {/* Barra de progresso */}
        {countdown > 0 && (
          <div className="mt-2">
            <div className="w-full bg-red-800 rounded-full h-1">
              <div
                className="bg-white h-1 rounded-full transition-all duration-1000"
                style={{
                  width: `${((1 - countdown) / 1) * 100}%`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateNotification;
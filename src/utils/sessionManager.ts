import { supabase } from '../lib/supabase';

export interface SessionInfo {
  isValid: boolean;
  expiresAt: number | null;
  timeToExpiry: number;
  needsRefresh: boolean;
  userId: string | null;
}

export interface FormProgress {
  formType: string;
  step: number;
  data: any;
  timestamp: number;
  userId: string;
}

/**
 * Utilitários para gerenciamento de sessão e persistência de dados
 */
export class SessionManager {
  private static readonly SESSION_WARNING_THRESHOLD = 300; // 5 minutos em segundos
  private static readonly FORM_STORAGE_PREFIX = 'form_progress_';
  private static readonly MAX_STORAGE_AGE = 24 * 60 * 60 * 1000; // 24 horas em ms

  /**
   * Obtém informações detalhadas sobre a sessão atual
   */
  static async getSessionInfo(): Promise<SessionInfo> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[SessionManager] Erro ao obter sessão:', error);
        return {
          isValid: false,
          expiresAt: null,
          timeToExpiry: 0,
          needsRefresh: false,
          userId: null,
        };
      }

      if (!session) {
        return {
          isValid: false,
          expiresAt: null,
          timeToExpiry: 0,
          needsRefresh: false,
          userId: null,
        };
      }

      const now = Date.now() / 1000;
      const expiresAt = session.expires_at;
      const timeToExpiry = expiresAt ? expiresAt - now : 0;
      const needsRefresh = timeToExpiry < this.SESSION_WARNING_THRESHOLD && timeToExpiry > 0;

      return {
        isValid: timeToExpiry > 0,
        expiresAt,
        timeToExpiry,
        needsRefresh,
        userId: session.user?.id || null,
      };
    } catch (error) {
      console.error('[SessionManager] Erro na análise de sessão:', error);
      return {
        isValid: false,
        expiresAt: null,
        timeToExpiry: 0,
        needsRefresh: false,
        userId: null,
      };
    }
  }

  /**
   * Tenta renovar a sessão automaticamente
   */
  static async refreshSession(): Promise<boolean> {
    try {
      console.log('[SessionManager] Tentando renovar sessão...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('[SessionManager] Erro ao renovar sessão:', error);
        return false;
      }

      if (data.session) {
        console.log('[SessionManager] Sessão renovada com sucesso');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[SessionManager] Erro na renovação de sessão:', error);
      return false;
    }
  }

  /**
   * Monitora a sessão e executa callback quando necessário
   */
  static createSessionMonitor(callbacks: {
    onExpiringSoon?: (timeToExpiry: number) => void;
    onExpired?: () => void;
    onRefreshed?: () => void;
    onError?: (error: string) => void;
  }) {
    const interval = setInterval(async () => {
      try {
        const sessionInfo = await this.getSessionInfo();

        if (!sessionInfo.isValid) {
          callbacks.onExpired?.();
          clearInterval(interval);
          return;
        }

        if (sessionInfo.needsRefresh && callbacks.onExpiringSoon) {
          callbacks.onExpiringSoon(sessionInfo.timeToExpiry);

          // Tentar renovar automaticamente
          const refreshed = await this.refreshSession();
          if (refreshed) {
            callbacks.onRefreshed?.();
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro no monitor de sessão';
        callbacks.onError?.(errorMessage);
      }
    }, 30000); // Verificar a cada 30 segundos

    return () => clearInterval(interval);
  }

  /**
   * Salva progresso do formulário no localStorage
   */
  static saveFormProgress(formType: string, step: number, data: any, userId: string): void {
    try {
      const progress: FormProgress = {
        formType,
        step,
        data,
        timestamp: Date.now(),
        userId,
      };

      const key = `${this.FORM_STORAGE_PREFIX}${formType}_${userId}`;
      localStorage.setItem(key, JSON.stringify(progress));

      console.log(`[SessionManager] Progresso salvo para ${formType}, step ${step}`);
    } catch (error) {
      console.error('[SessionManager] Erro ao salvar progresso:', error);
    }
  }

  /**
   * Recupera progresso do formulário do localStorage
   */
  static getFormProgress(formType: string, userId: string): FormProgress | null {
    try {
      const key = `${this.FORM_STORAGE_PREFIX}${formType}_${userId}`;
      const stored = localStorage.getItem(key);

      if (!stored) {
        return null;
      }

      const progress: FormProgress = JSON.parse(stored);

      // Verificar se não está muito antigo
      const age = Date.now() - progress.timestamp;
      if (age > this.MAX_STORAGE_AGE) {
        console.log('[SessionManager] Progresso expirado, removendo...');
        this.clearFormProgress(formType, userId);
        return null;
      }

      // Verificar se é do mesmo usuário
      if (progress.userId !== userId) {
        console.log('[SessionManager] Progresso de usuário diferente, removendo...');
        this.clearFormProgress(formType, userId);
        return null;
      }

      console.log(`[SessionManager] Progresso recuperado para ${formType}, step ${progress.step}`);
      return progress;
    } catch (error) {
      console.error('[SessionManager] Erro ao recuperar progresso:', error);
      return null;
    }
  }

  /**
   * Remove progresso do formulário do localStorage
   */
  static clearFormProgress(formType: string, userId: string): void {
    try {
      const key = `${this.FORM_STORAGE_PREFIX}${formType}_${userId}`;
      localStorage.removeItem(key);
      console.log(`[SessionManager] Progresso removido para ${formType}`);
    } catch (error) {
      console.error('[SessionManager] Erro ao remover progresso:', error);
    }
  }

  /**
   * Lista todos os progressos salvos para um usuário
   */
  static getUserFormProgress(userId: string): FormProgress[] {
    try {
      const progress: FormProgress[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.FORM_STORAGE_PREFIX) && key.endsWith(`_${userId}`)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const formProgress: FormProgress = JSON.parse(stored);
              progress.push(formProgress);
            } catch (parseError) {
              console.error('[SessionManager] Erro ao parsear progresso:', parseError);
            }
          }
        }
      }

      return progress;
    } catch (error) {
      console.error('[SessionManager] Erro ao listar progressos:', error);
      return [];
    }
  }

  /**
   * Limpa progressos expirados
   */
  static cleanupExpiredProgress(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.FORM_STORAGE_PREFIX)) {
          const stored = localStorage.getItem(key);
          if (stored) {
            try {
              const progress: FormProgress = JSON.parse(stored);
              const age = Date.now() - progress.timestamp;

              if (age > this.MAX_STORAGE_AGE) {
                keysToRemove.push(key);
              }
            } catch (parseError) {
              // Se não conseguir parsear, marcar para remoção
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`[SessionManager] Progresso expirado removido: ${key}`);
      });

      if (keysToRemove.length > 0) {
        console.log(`[SessionManager] ${keysToRemove.length} progressos expirados removidos`);
      }
    } catch (error) {
      console.error('[SessionManager] Erro na limpeza de progressos:', error);
    }
  }

  /**
   * Verifica se há progresso salvo para um formulário específico
   */
  static hasFormProgress(formType: string, userId: string): boolean {
    const progress = this.getFormProgress(formType, userId);
    return progress !== null;
  }

  /**
   * Utilitário para executar operações com retry baseado em problemas de sessão
   */
  static async withSessionRetry<T>(
    operation: () => Promise<T>,
    options: {
      retries?: number;
      onSessionExpired?: () => void;
      onRetry?: (attempt: number) => void;
    } = {}
  ): Promise<T | null> {
    const { retries = 3, onSessionExpired, onRetry } = options;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // Verificar sessão antes da operação
        const sessionInfo = await this.getSessionInfo();

        if (!sessionInfo.isValid) {
          console.warn('[SessionManager] Sessão inválida detectada');

          // Tentar renovar
          const refreshed = await this.refreshSession();
          if (!refreshed) {
            onSessionExpired?.();
            return null;
          }
        }

        // Executar operação
        return await operation();
      } catch (error) {
        console.error(`[SessionManager] Tentativa ${attempt} falhou:`, error);

        if (attempt === retries) {
          throw error;
        }

        onRetry?.(attempt);

        // Aguardar antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return null;
  }
}

// Executar limpeza de progressos expirados quando o módulo é carregado
SessionManager.cleanupExpiredProgress();
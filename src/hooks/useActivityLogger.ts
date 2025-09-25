import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ActivityLogData {
  actionType: string;
  description: string;
  metadata?: Record<string, unknown>;
  targetUserId?: string; // Para ações de admin sobre outros usuários
}

export function useActivityLogger() {
  const logActivity = useCallback(async (data: ActivityLogData) => {
    try {
      // Buscar usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('Usuário não autenticado - não é possível registrar atividade');
        return;
      }

      // Determinar qual usuário será registrado na atividade
      const targetUserId = data.targetUserId || user.id;
      const adminId = data.targetUserId ? user.id : null; // Se tem targetUserId, então user atual é admin

      const { error } = await supabase
        .from('user_activities')
        .insert([{
          user_id: targetUserId,
          admin_id: adminId,
          action_type: data.actionType,
          description: data.description,
          metadata: data.metadata || {}
        }]);

      if (error) {
        console.error('Erro ao registrar atividade:', error);
      }
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
    }
  }, []);

  // Funções específicas para diferentes tipos de atividade
  const logLogin = useCallback(async () => {
    await logActivity({
      actionType: 'login',
      description: 'Usuário fez login no sistema'
    });
  }, [logActivity]);

  const logLogout = useCallback(async () => {
    await logActivity({
      actionType: 'logout', 
      description: 'Usuário fez logout do sistema'
    });
  }, [logActivity]);

  const logFormSubmission = useCallback(async (formType: string, formData?: Record<string, unknown>) => {
    await logActivity({
      actionType: 'form_submission',
      description: `Formulário ${formType} submetido`,
      metadata: { formType, ...formData }
    });
  }, [logActivity]);

  const logDocumentUpload = useCallback(async (documentType: string, fileName?: string) => {
    await logActivity({
      actionType: 'document_upload',
      description: `Documento ${documentType} enviado`,
      metadata: { documentType, fileName }
    });
  }, [logActivity]);

  const logPageVisit = useCallback(async (pageName: string, pageUrl?: string) => {
    await logActivity({
      actionType: 'page_visit',
      description: `Acesso à página: ${pageName}`,
      metadata: { pageName, pageUrl }
    });
  }, [logActivity]);

  const logProfileUpdate = useCallback(async (changes: Record<string, unknown>) => {
    await logActivity({
      actionType: 'profile_update',
      description: 'Usuário atualizou seu perfil',
      metadata: { changes }
    });
  }, [logActivity]);

  const logPasswordChange = useCallback(async () => {
    await logActivity({
      actionType: 'password_change',
      description: 'Usuário alterou sua senha'
    });
  }, [logActivity]);

  const logDownload = useCallback(async (fileName: string, fileType: string) => {
    await logActivity({
      actionType: 'download',
      description: `Download realizado: ${fileName}`,
      metadata: { fileName, fileType }
    });
  }, [logActivity]);

  // Função para ações de admin sobre outros usuários
  const logAdminAction = useCallback(async (
    targetUserId: string,
    actionType: string,
    description: string,
    metadata?: Record<string, unknown>
  ) => {
    await logActivity({
      actionType,
      description,
      metadata,
      targetUserId
    });
  }, [logActivity]);

  return {
    logActivity,
    logLogin,
    logLogout,
    logFormSubmission,
    logDocumentUpload,
    logPageVisit,
    logProfileUpdate,
    logPasswordChange,
    logDownload,
    logAdminAction
  };
}

export default useActivityLogger;
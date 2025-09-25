import { supabase } from '../lib/supabase';

export interface AdminActionResult {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Envia email de reset de senha para um usuário
 */
export async function resetUserPassword(userEmail: string): Promise<AdminActionResult> {
  try {
    if (!userEmail) {
      return {
        success: false,
        message: 'Email não encontrado para este usuário',
        error: 'Email obrigatório'
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      console.error('Erro ao enviar reset de senha:', error);
      return {
        success: false,
        message: 'Erro ao enviar email de reset de senha',
        error: error.message
      };
    }

    return {
      success: true,
      message: `Email de reset de senha enviado para ${userEmail}`
    };
  } catch (error) {
    console.error('Erro inesperado ao resetar senha:', error);
    return {
      success: false,
      message: 'Erro inesperado ao resetar senha',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Cria log de atividade do usuário (função legada - usar useActivityLogger para novos logs)
 * @deprecated Use useActivityLogger hook instead
 */
export async function logUserActivity(
  userId: string,
  actionType: string,
  description: string,
  adminId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_activities')
      .insert([{
        user_id: userId,
        admin_id: adminId,
        action_type: actionType,
        description,
        metadata: metadata || {}
      }]);

    if (error) {
      console.error('Erro ao salvar log de atividade:', error);
    }
  } catch (error) {
    console.error('Erro ao fazer log da atividade:', error);
  }
}

/**
 * Cria logs retroativos para usuários existentes
 */
export async function createRetroactiveLogs(): Promise<void> {
  try {
    // Buscar todos os usuários
    const { data: perfis } = await supabase
      .from('perfis')
      .select('user_id, nome_completo, created_at')
      .order('created_at', { ascending: true });

    if (!perfis) return;

    // Criar logs de criação de conta para cada usuário
    const logs = perfis.map(perfil => ({
      user_id: perfil.user_id,
      admin_id: null,
      action_type: 'account_created',
      description: `Conta criada: ${perfil.nome_completo}`,
      metadata: {},
      created_at: perfil.created_at
    }));

    const { error } = await supabase
      .from('user_activities')
      .insert(logs);

    if (error) {
      console.error('Erro ao criar logs retroativos:', error);
    } else {
      console.log(`${logs.length} logs retroativos criados com sucesso`);
    }
  } catch (error) {
    console.error('Erro ao criar logs retroativos:', error);
  }
}

/**
 * Atualiza status de liberação do usuário
 */
export async function updateUserStatus(
  userId: string,
  novoStatus: 'sim' | 'nao',
  adminId?: string
): Promise<AdminActionResult> {
  try {
    const { error } = await supabase
      .from('perfis')
      .update({ liberado: novoStatus })
      .eq('id', userId);

    if (error) {
      return {
        success: false,
        message: 'Erro ao atualizar status do usuário',
        error: error.message
      };
    }

    // Log da atividade
    await logUserActivity(
      userId,
      'status_change',
      `Status alterado para: ${novoStatus === 'sim' ? 'Liberado' : 'Bloqueado'}`,
      adminId
    );

    return {
      success: true,
      message: `Usuário ${novoStatus === 'sim' ? 'liberado' : 'bloqueado'} com sucesso`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro inesperado ao atualizar status',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}

/**
 * Busca email do usuário através de RPC
 */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_user_info', {
      user_uuid: userId
    });

    if (error || !data || data.length === 0) {
      console.warn('Erro ao buscar email do usuário:', error);
      return null;
    }

    return data[0]?.email || null;
  } catch (error) {
    console.error('Erro ao buscar email:', error);
    return null;
  }
}
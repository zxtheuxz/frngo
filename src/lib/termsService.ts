import { supabase } from './supabase';

export type TermType = 'AVALIACAO_FISICA_NUTRICIONAL' | 'ENVIO_FOTOS';

export interface ConsentRecord {
  id: string;
  user_id: string;
  tipo_termo: TermType;
  aceito: boolean;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Service para gerenciar consentimentos de termos
 */
export class TermsService {
  /**
   * Verifica se o usuário já deu consentimento para um tipo específico de termo
   */
  static async hasUserConsented(userId: string, termType: TermType): Promise<boolean | null> {
    try {
      const { data, error } = await supabase
        .from('termos_consentimento')
        .select('aceito')
        .eq('user_id', userId)
        .eq('tipo_termo', termType)
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar consentimento:', error);
        return null;
      }

      return data?.aceito ?? null;
    } catch (error) {
      console.error('Erro ao verificar consentimento:', error);
      return null;
    }
  }

  /**
   * Registra o consentimento do usuário
   */
  static async recordConsent(
    userId: string, 
    termType: TermType, 
    accepted: boolean
  ): Promise<boolean> {
    try {
      // Capturar informações do cliente
      const userAgent = navigator.userAgent;
      
      // Tentar obter IP (isso pode não funcionar em todos os navegadores por questões de privacidade)
      let ipAddress: string | null = null;
      try {
        // Este é um método simples que pode não funcionar em todos os casos
        // Em produção, seria melhor capturar o IP no backend
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (ipError) {
        console.warn('Não foi possível obter IP:', ipError);
      }

      const { data, error } = await supabase
        .from('termos_consentimento')
        .upsert({
          user_id: userId,
          tipo_termo: termType,
          aceito: accepted,
          ip_address: ipAddress,
          user_agent: userAgent,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,tipo_termo'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar consentimento:', error);
        return false;
      }

      console.log('Consentimento registrado com sucesso:', data);
      return true;
    } catch (error) {
      console.error('Erro ao registrar consentimento:', error);
      return false;
    }
  }

  /**
   * Obtém o histórico de consentimentos de um usuário
   */
  static async getUserConsentHistory(userId: string): Promise<ConsentRecord[]> {
    try {
      const { data, error } = await supabase
        .from('termos_consentimento')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico de consentimentos:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Erro ao buscar histórico de consentimentos:', error);
      return [];
    }
  }

  /**
   * Verifica se o usuário precisa aceitar termos antes de acessar uma funcionalidade
   * Retorna: true se pode acessar, false se precisa aceitar termo, null se erro
   */
  static async canAccessFeature(userId: string, termType: TermType): Promise<boolean | null> {
    const consent = await this.hasUserConsented(userId, termType);
    
    // Se nunca deu consentimento, precisa aceitar
    if (consent === null) return false;
    
    // Se já deu consentimento, verifica se foi positivo
    return consent === true;
  }

  /**
   * Verifica se o usuário rejeitou explicitamente um termo
   */
  static async hasUserRejected(userId: string, termType: TermType): Promise<boolean> {
    const consent = await this.hasUserConsented(userId, termType);
    return consent === false;
  }
}

/**
 * Hook personalizado para usar o TermsService em componentes React
 */
export function useTermsService() {
  return {
    hasUserConsented: TermsService.hasUserConsented,
    recordConsent: TermsService.recordConsent,
    getUserConsentHistory: TermsService.getUserConsentHistory,
    canAccessFeature: TermsService.canAccessFeature,
    hasUserRejected: TermsService.hasUserRejected
  };
}
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { X, Activity, Clock, Shield, Calendar, Filter } from 'lucide-react';

interface UserActivity {
  id: string;
  user_id: string;
  admin_id: string | null;
  action_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  admin_nome?: string;
}

interface Cliente {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  sexo: string;
  role: string;
  liberado: string;
  laudo_aprovado: string;
  created_at: string;
  email?: string;
}

interface ActivityHistoryModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ActivityHistoryModal({ cliente, isOpen, onClose }: ActivityHistoryModalProps) {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDays, setFilterDays] = useState<number>(30);

  const loadActivities = useCallback(async () => {
    if (!cliente) return;

    setLoading(true);

    try {
      // Calcular data de início baseada no filtro
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - filterDays);

      let query = supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', cliente.user_id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      // Aplicar filtro por tipo de ação se não for "all"
      if (filterType !== 'all') {
        query = query.eq('action_type', filterType);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao carregar atividades:', error);
        return;
      }

      // Buscar nomes dos admins para as atividades
      const activitiesWithAdminNames = await Promise.all(
        (data || []).map(async (activity) => {
          if (activity.admin_id) {
            try {
              const { data: adminData } = await supabase
                .from('perfis')
                .select('nome_completo')
                .eq('user_id', activity.admin_id)
                .single();
              
              return {
                ...activity,
                admin_nome: adminData?.nome_completo || 'Admin desconhecido'
              };
            } catch {
              return {
                ...activity,
                admin_nome: 'Admin desconhecido'
              };
            }
          }
          return activity;
        })
      );

      setActivities(activitiesWithAdminNames);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  }, [cliente, filterType, filterDays]);

  useEffect(() => {
    if (isOpen && cliente) {
      loadActivities();
    }
  }, [isOpen, cliente, loadActivities]);

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'login': 'Login',
      'logout': 'Logout',
      'page_visit': 'Visita de Página',
      'status_change': 'Mudança de Status',
      'profile_edit': 'Edição de Perfil',
      'password_reset': 'Reset de Senha',
      'form_submission': 'Formulário Enviado',
      'document_upload': 'Documento Enviado',
      'account_created': 'Conta Criada'
    };
    return labels[type] || type;
  };

  const getActionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'login': 'bg-green-100 text-green-800 border-green-200',
      'logout': 'bg-gray-100 text-gray-800 border-gray-200',
      'page_visit': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'status_change': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'profile_edit': 'bg-blue-100 text-blue-800 border-blue-200',
      'password_reset': 'bg-red-100 text-red-800 border-red-200',
      'form_submission': 'bg-purple-100 text-purple-800 border-purple-200',
      'document_upload': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'account_created': 'bg-emerald-100 text-emerald-800 border-emerald-200'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} min atrás`;
      }
      return `${diffHours}h atrás`;
    } else if (diffDays === 1) {
      return 'Ontem';
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`;
    } else {
      return formatDate(dateString);
    }
  };

  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Histórico de Atividades</h2>
              <p className="text-sm text-gray-600">{cliente.nome_completo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Todas as ações</option>
              <option value="login">Login</option>
              <option value="page_visit">Visitas de Página</option>
              <option value="account_created">Conta Criada</option>
              <option value="status_change">Mudanças de Status</option>
              <option value="profile_edit">Edições de Perfil</option>
              <option value="password_reset">Reset de Senha</option>
              <option value="form_submission">Formulários</option>
              <option value="document_upload">Documentos</option>
            </select>

            <select
              value={filterDays}
              onChange={(e) => setFilterDays(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={365}>Último ano</option>
            </select>

            <div className="text-sm text-gray-500">
              {activities.length} atividades encontradas
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade encontrada</h3>
              <p className="text-gray-600">
                Não há atividades registradas para este usuário no período selecionado.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getActionTypeColor(activity.action_type)}`}>
                            {getActionTypeLabel(activity.action_type)}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(activity.created_at)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-900 mb-1">{activity.description}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(activity.created_at)}
                          </div>
                          
                          {activity.admin_nome && (
                            <div className="flex items-center gap-1">
                              <Shield className="w-3 h-3" />
                              Executado por: {activity.admin_nome}
                            </div>
                          )}
                        </div>

                        {/* Metadata adicional se existir */}
                        {Object.keys(activity.metadata || {}).length > 0 && (
                          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                            <strong>Detalhes:</strong>
                            <pre className="mt-1 text-gray-600">
                              {JSON.stringify(activity.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, Eye, CheckCircle, XCircle, Clock, Mail, Phone, AlertTriangle, Camera, FileCheck, FileX } from 'lucide-react';
import { ClienteDetailModal } from './ClienteDetailModal';
import { ClienteActionsMenu } from './ClienteActionsMenu';

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
  // Dados das fotos
  foto_lateral_url?: string;
  foto_lateral_enviada_em?: string;
  foto_abertura_url?: string;
  foto_abertura_enviada_em?: string;
  // Dados dos termos (vem da query com JOIN)
  termos_consentimento?: Array<{
    tipo_termo: string;
    aceito: boolean;
    created_at: string;
  }>;
  // Status dos termos (processados)
  termos_avaliacao_aceito?: boolean;
  termos_avaliacao_data?: string;
  termos_fotos_aceito?: boolean;
  termos_fotos_data?: string;
}

interface ClientesListProps {
  onClienteSelect?: (cliente: Cliente) => void;
}

// Helper functions para status
const getFotosStatus = (cliente: Cliente) => {
  const temLateral = !!(cliente.foto_lateral_url);
  const temAbertura = !!(cliente.foto_abertura_url);

  const detalhes = [];
  if (temLateral && cliente.foto_lateral_enviada_em) {
    const data = new Date(cliente.foto_lateral_enviada_em).toLocaleDateString('pt-BR');
    detalhes.push(`Foto lateral: ${data}`);
  }
  if (temAbertura && cliente.foto_abertura_enviada_em) {
    const data = new Date(cliente.foto_abertura_enviada_em).toLocaleDateString('pt-BR');
    detalhes.push(`Foto abertura: ${data}`);
  }

  const tooltip = detalhes.length > 0 ?
    `Fotos (${temLateral && temAbertura ? '2/2' : '1/2'}):\n${detalhes.join('\n')}` :
    'Nenhuma foto enviada';

  if (temLateral && temAbertura) {
    return { status: 'completo', count: 2, color: 'text-green-600', bgColor: 'bg-green-50', tooltip };
  }
  if (temLateral || temAbertura) {
    return { status: 'parcial', count: 1, color: 'text-yellow-600', bgColor: 'bg-yellow-50', tooltip };
  }
  return { status: 'nenhuma', count: 0, color: 'text-gray-400', bgColor: 'bg-gray-50', tooltip };
};

const getTermosStatus = (cliente: Cliente) => {
  const temAvaliacao = cliente.termos_avaliacao_aceito;
  const temFotos = cliente.termos_fotos_aceito;

  const detalhes = [];
  if (temAvaliacao && cliente.termos_avaliacao_data) {
    const data = new Date(cliente.termos_avaliacao_data).toLocaleDateString('pt-BR');
    detalhes.push(`Avaliação Física/Nutricional: ${data}`);
  }
  if (temFotos && cliente.termos_fotos_data) {
    const data = new Date(cliente.termos_fotos_data).toLocaleDateString('pt-BR');
    detalhes.push(`Envio de Fotos: ${data}`);
  }

  const tooltip = detalhes.length > 0 ?
    `Termos aceitos:\n${detalhes.join('\n')}` :
    'Nenhum termo aceito';

  if (temAvaliacao && temFotos) {
    return { status: 'completo', color: 'text-green-600', bgColor: 'bg-green-50', icon: FileCheck, tooltip };
  }
  if (temAvaliacao || temFotos) {
    return { status: 'parcial', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock, tooltip };
  }
  return { status: 'pendente', color: 'text-red-500', bgColor: 'bg-red-50', icon: FileX, tooltip };
};

export function ClientesList({ onClienteSelect }: ClientesListProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'TODOS' | 'cliente' | 'preparador' | 'admin'>('cliente');
  const [filterStatus, setFilterStatus] = useState<'TODOS' | 'sim' | 'nao'>('TODOS');
  const [filterFotos, setFilterFotos] = useState<'TODOS' | 'completo' | 'parcial' | 'nenhuma'>('TODOS');
  const [filterTermos, setFilterTermos] = useState<'TODOS' | 'completo' | 'parcial' | 'pendente'>('TODOS');
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadClientes();
  }, [filterRole, filterStatus]);

  const loadClientes = async () => {
    try {
      setLoading(true);

      // Query simples para buscar perfis
      let query = supabase
        .from('perfis')
        .select('*');

      // Aplicar filtros na query
      if (filterRole !== 'TODOS') {
        query = query.eq('role', filterRole);
      }

      if (filterStatus !== 'TODOS') {
        query = query.eq('liberado', filterStatus);
      }

      const { data: perfisData, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar perfis:', error);
        return;
      }

      if (perfisData) {
        // Buscar dados completos para cada cliente (email + termos)
        const clientesComDadosCompletos = await Promise.all(
          perfisData.map(async (cliente) => {
            try {
              // Buscar email
              const { data: userData, error: emailError } = await supabase.rpc('get_user_info', {
                user_uuid: cliente.user_id
              });

              // Buscar termo de avaliação
              const { data: termoAvaliacao } = await supabase
                .from('termos_consentimento')
                .select('aceito, created_at')
                .eq('user_id', cliente.user_id)
                .eq('tipo_termo', 'AVALIACAO_FISICA_NUTRICIONAL')
                .eq('aceito', true)
                .single();

              // Buscar termo de fotos
              const { data: termoFotos } = await supabase
                .from('termos_consentimento')
                .select('aceito, created_at')
                .eq('user_id', cliente.user_id)
                .eq('tipo_termo', 'ENVIO_FOTOS')
                .eq('aceito', true)
                .single();

              return {
                ...cliente,
                email: userData?.[0]?.email || 'N/A',
                termos_avaliacao_aceito: !!termoAvaliacao?.aceito,
                termos_avaliacao_data: termoAvaliacao?.created_at || null,
                termos_fotos_aceito: !!termoFotos?.aceito,
                termos_fotos_data: termoFotos?.created_at || null,
              };
            } catch (error) {
              console.warn('Erro ao buscar dados completos para', cliente.nome_completo, ':', error);
              return {
                ...cliente,
                email: 'N/A',
                termos_avaliacao_aceito: false,
                termos_avaliacao_data: null,
                termos_fotos_aceito: false,
                termos_fotos_data: null,
              };
            }
          })
        );

        setClientes(clientesComDadosCompletos);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateClienteStatus = async (clienteId: string, novoStatus: 'sim' | 'nao') => {
    setUpdatingStatus(clienteId);
    setMessage(null);
    
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ liberado: novoStatus })
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        setMessage({ 
          type: 'error', 
          text: `Erro ao ${novoStatus === 'sim' ? 'liberar' : 'bloquear'} acesso: ${error.message}` 
        });
        return;
      }

      setMessage({ 
        type: 'success', 
        text: `Usuário ${novoStatus === 'sim' ? 'liberado' : 'bloqueado'} com sucesso!` 
      });
      
      await loadClientes();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erro inesperado ao atualizar status do usuário' 
      });
    } finally {
      setUpdatingStatus(null);
      // Limpar mensagem após 3 segundos
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateClienteRole = async (clienteId: string, novaRole: 'cliente' | 'preparador' | 'admin') => {
    try {
      const { error } = await supabase
        .from('perfis')
        .update({ role: novaRole })
        .eq('id', clienteId);

      if (error) {
        console.error('Erro ao atualizar role:', error);
        return;
      }

      await loadClientes();
    } catch (error) {
      console.error('Erro ao atualizar role:', error);
    }
  };

  const handleViewDetails = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setModalOpen(true);
    if (onClienteSelect) {
      onClienteSelect(cliente);
    }
  };

  const filteredClientes = clientes.filter(cliente => {
    // Filtro de busca por texto
    const matchesSearch = cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por status de fotos
    let matchesFotos = true;
    if (filterFotos !== 'TODOS') {
      const fotosStatus = getFotosStatus(cliente);
      matchesFotos = fotosStatus.status === filterFotos;
    }

    // Filtro por status de termos
    let matchesTermos = true;
    if (filterTermos !== 'TODOS') {
      const termosStatus = getTermosStatus(cliente);
      matchesTermos = termosStatus.status === filterTermos;
    }

    return matchesSearch && matchesFotos && matchesTermos;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'preparador':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cliente':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'sim' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getLaudoColor = (laudo: string) => {
    switch (laudo) {
      case 'aprovado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejeitado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciamento de Usuários
            </h3>
            <p className="text-sm text-slate-600">
              {filteredClientes.length} usuários encontrados
              {(filterFotos !== 'TODOS' || filterTermos !== 'TODOS') && (
                <span className="ml-2 text-blue-600 font-medium">
                  (filtros ativos)
                </span>
              )}
            </p>
          </div>
          
          {/* Filtros e Busca */}
          <div className="flex flex-col gap-3">
            {/* Linha 1: Busca e filtros principais */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, telefone ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as typeof filterRole)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="TODOS">Todas as Roles</option>
                <option value="cliente">Cliente</option>
                <option value="preparador">Preparador</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="sim">Liberado</option>
                <option value="nao">Bloqueado</option>
              </select>
            </div>

            {/* Linha 2: Filtros de fotos e termos */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={filterFotos}
                onChange={(e) => setFilterFotos(e.target.value as typeof filterFotos)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="TODOS">📷 Todas as Fotos</option>
                <option value="completo">📷 Fotos Completas (2/2)</option>
                <option value="parcial">📷 Fotos Parciais (1/2)</option>
                <option value="nenhuma">📷 Sem Fotos</option>
              </select>

              <select
                value={filterTermos}
                onChange={(e) => setFilterTermos(e.target.value as typeof filterTermos)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="TODOS">📄 Todos os Termos</option>
                <option value="completo">📄 Termos Aceitos</option>
                <option value="parcial">📄 Termos Parciais</option>
                <option value="pendente">📄 Termos Pendentes</option>
              </select>

              {/* Botão de limpar filtros */}
              {(filterFotos !== 'TODOS' || filterTermos !== 'TODOS') && (
                <button
                  onClick={() => {
                    setFilterFotos('TODOS');
                    setFilterTermos('TODOS');
                  }}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Limpar filtros de fotos e termos"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {message && (
        <div className={`mx-6 mt-4 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      {/* Lista de Clientes */}
      <div className="p-6">
        {filteredClientes.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h4>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1400px] lg:min-w-0">
              <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[240px]">
                    Usuário
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px]">
                    Contato
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Role
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                    Fotos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                    Termos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[130px]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[110px]">
                    Laudo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                    Cadastro
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            cliente.role === 'admin' ? 'bg-purple-100' :
                            cliente.role === 'preparador' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            <Users className={`w-5 h-5 ${
                              cliente.role === 'admin' ? 'text-purple-600' :
                              cliente.role === 'preparador' ? 'text-blue-600' : 'text-green-600'
                            }`} />
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {cliente.nome_completo}
                            {cliente.liberado === 'nao' && (
                              <AlertTriangle className="w-4 h-4 text-red-500" title="Conta bloqueada" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 capitalize">
                            {cliente.sexo || 'Não informado'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {cliente.telefone || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {cliente.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <select
                        value={cliente.role}
                        onChange={(e) => updateClienteRole(cliente.id, e.target.value as 'cliente' | 'preparador' | 'admin')}
                        className={`text-xs font-medium rounded-md border px-2 py-1 ${getRoleColor(cliente.role)}`}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="preparador">Preparador</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Coluna FOTOS */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {(() => {
                        const fotosStatus = getFotosStatus(cliente);
                        return (
                          <div
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${fotosStatus.bgColor} border cursor-help min-w-[70px]`}
                            style={{
                              borderColor: fotosStatus.status === 'completo' ? '#16a34a' :
                                          fotosStatus.status === 'parcial' ? '#ca8a04' : '#9ca3af'
                            }}
                            title={fotosStatus.tooltip}
                          >
                            <Camera className={`w-4 h-4 ${fotosStatus.color}`} />
                            <span className={`${fotosStatus.color}`}>
                              {fotosStatus.count}/2
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Coluna TERMOS */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {(() => {
                        const termosStatus = getTermosStatus(cliente);
                        const IconeTermos = termosStatus.icon;
                        return (
                          <div
                            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold ${termosStatus.bgColor} border cursor-help min-w-[80px]`}
                            style={{
                              borderColor: termosStatus.status === 'completo' ? '#16a34a' :
                                          termosStatus.status === 'parcial' ? '#ca8a04' : '#ef4444'
                            }}
                            title={termosStatus.tooltip}
                          >
                            <IconeTermos className={`w-4 h-4 ${termosStatus.color}`} />
                            <span className={`${termosStatus.color} text-xs`}>
                              {termosStatus.status === 'completo' ? 'OK' :
                               termosStatus.status === 'parcial' ? 'Parc.' : 'Pend.'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateClienteStatus(cliente.id, cliente.liberado === 'sim' ? 'nao' : 'sim')}
                        disabled={updatingStatus === cliente.id}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(cliente.liberado)} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {updatingStatus === cliente.id ? (
                          <>
                            <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent"></div>
                            Atualizando...
                          </>
                        ) : cliente.liberado === 'sim' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Liberado
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Bloqueado
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getLaudoColor(cliente.laudo_aprovado || 'N/A')}`}>
                        {cliente.laudo_aprovado === 'aprovado' && <CheckCircle className="w-3 h-3" />}
                        {cliente.laudo_aprovado === 'pendente' && <Clock className="w-3 h-3" />}
                        {cliente.laudo_aprovado === 'rejeitado' && <XCircle className="w-3 h-3" />}
                        {cliente.laudo_aprovado || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cliente.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => handleViewDetails(cliente)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-md hover:bg-blue-50 transition-colors"
                          title="Ver detalhes completos"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <ClienteActionsMenu
                          cliente={cliente}
                          onViewDetails={handleViewDetails}
                          onToggleStatus={updateClienteStatus}
                          onSuccess={loadClientes}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <ClienteDetailModal
        cliente={selectedCliente}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCliente(null);
        }}
      />
    </div>
  );
}
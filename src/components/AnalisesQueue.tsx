import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Clock, User, Eye, Check, X, AlertCircle, Download, MoreHorizontal } from 'lucide-react';
import { ApprovalModal } from './ApprovalModal';

interface Analise {
  id: string;
  user_id: string;
  status: string;
  tipo_documento: string;
  documento_url: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
  usuario: {
    nome_completo: string;
    telefone: string;
    email: string;
  };
}

interface AnalisesQueueProps {
  onAnaliseSelect?: (analise: Analise) => void;
}

export function AnalisesQueue({ onAnaliseSelect }: AnalisesQueueProps) {
  const [analises, setAnalises] = useState<Analise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO'>('PENDENTE');
  const [selectedAnalise, setSelectedAnalise] = useState<Analise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadAnalises();
  }, [filter]);

  const loadAnalises = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('buscar_analises_preparador');
      
      if (error) {
        console.error('Erro ao buscar análises:', error);
        return;
      }

      let filteredData = data || [];
      
      if (filter !== 'TODAS') {
        filteredData = filteredData.filter((analise: Analise) => analise.status === filter);
      }
      
      setAnalises(filteredData);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAnaliseStatus = async (analiseId: string, novoStatus: 'APROVADO' | 'REJEITADO', observacoes?: string) => {
    try {
      const updateData: any = {
        status: novoStatus,
        updated_at: new Date().toISOString()
      };

      if (novoStatus === 'APROVADO') {
        updateData.aprovado_em = new Date().toISOString();
      }

      if (observacoes) {
        updateData.observacoes = observacoes;
      }

      const { error } = await supabase
        .from('analises_medicamentos')
        .update(updateData)
        .eq('id', analiseId);

      if (error) {
        console.error('Erro ao atualizar análise:', error);
        return;
      }

      await loadAnalises();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleAnaliseClick = (analise: Analise) => {
    setSelectedAnalise(analise);
    setModalOpen(true);
  };

  const handleApprove = async (analiseId: string, observacoes?: string) => {
    await updateAnaliseStatus(analiseId, 'APROVADO', observacoes);
  };

  const handleReject = async (analiseId: string, observacoes?: string) => {
    await updateAnaliseStatus(analiseId, 'REJEITADO', observacoes);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APROVADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJEITADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <Clock className="w-4 h-4" />;
      case 'APROVADO':
        return <Check className="w-4 h-4" />;
      case 'REJEITADO':
        return <X className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-600"></div>
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
            <h3 className="text-lg font-semibold text-slate-900">Fila de Análises</h3>
            <p className="text-sm text-slate-600">
              Gerencie documentos médicos e receitas dos clientes
            </p>
          </div>
          
          {/* Filtros */}
          <div className="flex items-center gap-2">
            {(['TODAS', 'PENDENTE', 'APROVADO', 'REJEITADO'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === status
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {status === 'TODAS' ? 'Todas' : status.charAt(0) + status.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Análises */}
      <div className="p-6">
        {analises.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise encontrada</h4>
            <p className="text-gray-600">
              {filter === 'PENDENTE' 
                ? 'Não há análises pendentes no momento.' 
                : `Não há análises com status "${filter.toLowerCase()}".`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analises.map((analise) => (
              <div
                key={analise.id}
                className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="font-medium text-slate-900">
                          {analise.usuario.nome_completo}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(analise.status)}`}>
                        {getStatusIcon(analise.status)}
                        {analise.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                      <div>Tipo: {analise.tipo_documento}</div>
                      <div>Telefone: {analise.usuario.telefone}</div>
                      <div>Email: {analise.usuario.email}</div>
                      <div>Enviado: {formatDate(analise.created_at)}</div>
                    </div>
                    
                    {analise.observacoes && (
                      <div className="bg-slate-50 rounded-md p-2 mb-3">
                        <p className="text-xs text-slate-600">
                          <strong>Observações:</strong> {analise.observacoes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {analise.documento_url && (
                      <button
                        onClick={() => window.open(analise.documento_url, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Ver documento"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    
                    {analise.status === 'PENDENTE' && (
                      <>
                        <button
                          onClick={() => handleApprove(analise.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                          title="Aprovar"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleReject(analise.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                          title="Rejeitar"
                        >
                          <X className="w-4 h-4" />
                          Rejeitar
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => handleAnaliseClick(analise)}
                      className="p-2 text-slate-600 hover:bg-slate-50 rounded-md transition-colors"
                      title="Ver detalhes e gerenciar"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Aprovação */}
      <ApprovalModal
        analise={selectedAnalise}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAnalise(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}
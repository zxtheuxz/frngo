import React, { useState } from 'react';
import { X, Check, AlertTriangle, FileText, User, Calendar, MessageSquare } from 'lucide-react';

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

interface ApprovalModalProps {
  analise: Analise | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (analiseId: string, observacoes?: string) => void;
  onReject: (analiseId: string, observacoes?: string) => void;
}

export function ApprovalModal({ analise, isOpen, onClose, onApprove, onReject }: ApprovalModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !analise) return null;

  const handleSubmit = async () => {
    if (!action) return;
    
    setLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(analise.id, observacoes.trim() || undefined);
      } else {
        await onReject(analise.id, observacoes.trim() || undefined);
      }
      handleClose();
    } catch (error) {
      console.error('Erro ao processar análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setObservacoes('');
    onClose();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Análise de Documento</h2>
              <p className="text-sm text-slate-600">Revisar e aprovar/rejeitar documento</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações do Cliente */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Nome:</span>
                <div className="font-medium text-slate-900">{analise.usuario.nome_completo}</div>
              </div>
              <div>
                <span className="text-slate-600">Telefone:</span>
                <div className="font-medium text-slate-900">{analise.usuario.telefone}</div>
              </div>
              <div>
                <span className="text-slate-600">Email:</span>
                <div className="font-medium text-slate-900">{analise.usuario.email}</div>
              </div>
              <div>
                <span className="text-slate-600">Tipo de Documento:</span>
                <div className="font-medium text-slate-900">{analise.tipo_documento}</div>
              </div>
            </div>
          </div>

          {/* Informações do Documento */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-md font-medium text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Detalhes do Envio
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-slate-600">Enviado em:</span>
                <div className="font-medium text-slate-900">{formatDate(analise.created_at)}</div>
              </div>
              <div>
                <span className="text-slate-600">Status Atual:</span>
                <div className="font-medium text-slate-900">{analise.status}</div>
              </div>
            </div>
            
            {analise.observacoes && (
              <div className="mt-3">
                <span className="text-slate-600">Observações do Cliente:</span>
                <div className="mt-1 p-2 bg-white rounded border text-sm text-slate-900">
                  {analise.observacoes}
                </div>
              </div>
            )}
          </div>

          {/* Documento */}
          {analise.documento_url && (
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="text-md font-medium text-slate-900 mb-3">Documento Anexado</h3>
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-slate-900">Documento Médico</div>
                    <div className="text-sm text-slate-600">Clique para visualizar</div>
                  </div>
                </div>
                <button
                  onClick={() => window.open(analise.documento_url, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Abrir
                </button>
              </div>
            </div>
          )}

          {/* Ações de Aprovação */}
          {!action && (
            <div className="flex gap-4">
              <button
                onClick={() => setAction('approve')}
                className="flex-1 flex items-center justify-center gap-2 p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-5 h-5" />
                Aprovar Documento
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 flex items-center justify-center gap-2 p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                Rejeitar Documento
              </button>
            </div>
          )}

          {/* Formulário de Observações */}
          {action && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                action === 'approve' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {action === 'approve' ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  <h3 className={`font-medium ${
                    action === 'approve' ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {action === 'approve' ? 'Aprovar Documento' : 'Rejeitar Documento'}
                  </h3>
                </div>
                <p className={`text-sm ${
                  action === 'approve' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {action === 'approve' 
                    ? 'O documento será aprovado e o cliente será notificado.'
                    : 'O documento será rejeitado. Por favor, explique o motivo para o cliente.'
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Observações {action === 'reject' && '(obrigatório)'}
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder={
                    action === 'approve' 
                      ? 'Observações adicionais (opcional)...'
                      : 'Explique o motivo da rejeição...'
                  }
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] resize-y"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setAction(null)}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || (action === 'reject' && !observacoes.trim())}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {loading ? 'Processando...' : (action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Eye,
  X,
  Calendar,
  User,
  Plus
} from 'lucide-react';
import AnaliseCorpoMediaPipe from '../analise-corporal/AnaliseCorpoMediaPipe';
import { normalizarAltura, normalizarAlturaCm } from '../../utils/normalizarAltura';

interface MedidaCorporal {
  id: string;
  user_id: string;
  medida_bracos: number;
  medida_antebracos: number;
  medida_cintura: number;
  medida_quadril: number;
  medida_coxas: number;
  medida_panturrilhas: number;
  created_at: string;
  usuario?: {
    nome_completo: string;
    email: string;
  };
}

interface DadosCliente {
  altura?: string;
  peso?: string;
  sexo?: 'M' | 'F';
  foto_abertura_url?: string;
  foto_lateral_url?: string;
}

interface VisualizadorAnaliseCorpoalProps {
  userId: string;
  showUserInfo?: boolean;
  className?: string;
}

export function VisualizadorAnaliseCorporal({ 
  userId, 
  showUserInfo = false,
  className = ""
}: VisualizadorAnaliseCorpoalProps) {
  const [medidas, setMedidas] = useState<MedidaCorporal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedida, setSelectedMedida] = useState<MedidaCorporal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showGerarAnalise, setShowGerarAnalise] = useState(false);
  const [dadosCliente, setDadosCliente] = useState<DadosCliente>({});
  const [processandoAnalise, setProcessandoAnalise] = useState(false);

  useEffect(() => {
    loadMedidas();
    loadDadosCliente();
  }, [userId]);

  const loadMedidas = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('medidas_corporais')
        .select(`
          id,
          user_id,
          medida_bracos,
          medida_antebracos,
          medida_cintura,
          medida_quadril,
          medida_coxas,
          medida_panturrilhas,
          created_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (showUserInfo) {
        query = supabase
          .from('medidas_corporais')
          .select(`
            id,
            user_id,
            medida_bracos,
            medida_antebracos,
            medida_cintura,
            medida_quadril,
            medida_coxas,
            medida_panturrilhas,
            created_at,
            usuario:perfis!user_id(nome_completo, email)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar medidas corporais:', error);
        return;
      }

      setMedidas(data || []);
    } catch (error) {
      console.error('Erro ao carregar medidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDadosCliente = async () => {
    try {
      // Buscar sexo e fotos dos perfis
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('sexo, foto_abertura_url, foto_lateral_url')
        .eq('user_id', userId)
        .single();
      
      // Buscar altura e peso das avaliações nutricionais mais recentes
      // Tentando primeiro masculino
      let { data: avaliacaoData, error } = await supabase
        .from('avaliacao_nutricional')
        .select('altura, peso')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      // Se não encontrar na masculina, tentar feminina
      if (error || !avaliacaoData) {
        const result = await supabase
          .from('avaliacao_nutricional_feminino')
          .select('altura, peso')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        avaliacaoData = result.data;
      }
      
      // Normalizar altura para centímetros para manter compatibilidade com o resto do código
      const alturaNormalizada = avaliacaoData?.altura 
        ? normalizarAlturaCm(avaliacaoData.altura).toString()
        : '170';
      
      setDadosCliente({
        altura: alturaNormalizada,
        peso: avaliacaoData?.peso || '70',
        sexo: perfilData?.sexo || 'M',
        foto_abertura_url: perfilData?.foto_abertura_url || '',
        foto_lateral_url: perfilData?.foto_lateral_url || ''
      });
    } catch (error) {
      console.warn('Erro ao carregar dados do cliente:', error);
      // Valores padrão em caso de erro
      setDadosCliente({
        altura: '170',
        peso: '70',
        sexo: 'M',
        foto_abertura_url: '',
        foto_lateral_url: ''
      });
    }
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
      case 'PROCESSANDO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CONCLUIDO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ERRO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewMedida = (medida: MedidaCorporal) => {
    setSelectedMedida(medida);
    setModalOpen(true);
  };

  const handleGerarAnalise = () => {
    // Verificar se as fotos existem no perfil
    if (!dadosCliente.foto_abertura_url || !dadosCliente.foto_lateral_url) {
      alert('Fotos não encontradas no perfil do cliente. Certifique-se de que o cliente enviou as fotos de abertura e lateral.');
      return;
    }
    
    // Iniciar análise diretamente
    setShowGerarAnalise(true);
  };

  const handleMedidasExtraidas = async (medidas: any) => {
    try {
      setProcessandoAnalise(true);
      
      const { error } = await supabase
        .from('medidas_corporais')
        .insert({
          user_id: userId,
          medida_bracos: medidas.bracos,
          medida_antebracos: medidas.antebracos,
          medida_cintura: medidas.cintura,
          medida_quadril: medidas.quadril,
          medida_coxas: medidas.coxas,
          medida_panturrilhas: medidas.panturrilhas,
          altura_usada: parseFloat(dadosCliente.altura || '170'),
          peso_usado: parseFloat(dadosCliente.peso || '70'),
          sexo_usado: dadosCliente.sexo || 'M',
          calculado_automaticamente: true
        });
      
      if (error) {
        console.error('Erro ao salvar medidas:', error);
        alert('Erro ao salvar medidas corporais');
        return;
      }
      
      // Recarregar dados
      await loadMedidas();
      setShowGerarAnalise(false);
      alert('Análise corporal salva com sucesso!');
    } catch (error) {
      console.error('Erro ao processar medidas:', error);
      alert('Erro ao processar análise corporal');
    } finally {
      setProcessandoAnalise(false);
    }
  };

  const handleErroAnalise = (erro: string) => {
    console.error('Erro na análise MediaPipe:', erro);
    alert('Erro na análise: ' + erro);
    setShowGerarAnalise(false);
    setProcessandoAnalise(false);
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Análise Corporal</h3>
              <p className="text-sm text-slate-600">
                Resultados da análise por foto usando IA
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {medidas.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma análise encontrada</h4>
              <p className="text-gray-600 mb-4">
                Ainda não há análises corporais para este usuário.
              </p>
              <button
                onClick={handleGerarAnalise}
                disabled={!dadosCliente.foto_abertura_url || !dadosCliente.foto_lateral_url}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                {!dadosCliente.foto_abertura_url || !dadosCliente.foto_lateral_url 
                  ? 'Fotos não disponíveis' 
                  : 'Gerar Análise Corporal'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {medidas.map((medida) => (
                <div
                  key={medida.id}
                  className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {showUserInfo && medida.usuario && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-slate-900">
                              {medida.usuario.nome_completo}
                            </span>
                          </div>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border bg-green-100 text-green-800 border-green-200">
                          <Activity className="w-3 h-3" />
                          CONCLUÍDO
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {formatDate(medida.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3" />
                          Medidas disponíveis
                        </div>
                      </div>

                      <div className="bg-purple-50 rounded-md p-3 mb-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-purple-600 font-medium">Braços:</span>
                            <div className="text-purple-800">{medida.medida_bracos.toFixed(1)}cm</div>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Antebraços:</span>
                            <div className="text-purple-800">{medida.medida_antebracos.toFixed(1)}cm</div>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Cintura:</span>
                            <div className="text-purple-800">{medida.medida_cintura.toFixed(1)}cm</div>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Quadril:</span>
                            <div className="text-purple-800">{medida.medida_quadril.toFixed(1)}cm</div>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Coxas:</span>
                            <div className="text-purple-800">{medida.medida_coxas.toFixed(1)}cm</div>
                          </div>
                          <div>
                            <span className="text-purple-600 font-medium">Panturrilhas:</span>
                            <div className="text-purple-800">{medida.medida_panturrilhas.toFixed(1)}cm</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewMedida(medida)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal MediaPipe */}
      {showGerarAnalise && dadosCliente.foto_lateral_url && dadosCliente.foto_abertura_url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Processando Análise Corporal</h2>
            </div>
            <div className="p-6">
              <AnaliseCorpoMediaPipe
                fotoLateralUrl={dadosCliente.foto_lateral_url}
                fotoAberturaUrl={dadosCliente.foto_abertura_url}
                alturaReal={parseFloat(dadosCliente.altura || '170')}
                peso={parseFloat(dadosCliente.peso || '70')}
                sexo={dadosCliente.sexo}
                onMedidasExtraidas={handleMedidasExtraidas}
                onError={handleErroAnalise}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {modalOpen && selectedMedida && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Medidas Corporais Detalhadas</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDate(selectedMedida.created_at)}
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Medidas */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Medidas Corporais</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Braços</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_bracos.toFixed(1)}cm</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Antebraços</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_antebracos.toFixed(1)}cm</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Cintura</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_cintura.toFixed(1)}cm</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Medidas Adicionais</h3>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Quadril</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_quadril.toFixed(1)}cm</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Coxas</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_coxas.toFixed(1)}cm</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium text-gray-600">Panturrilhas</div>
                      <div className="text-lg font-semibold text-gray-900">{selectedMedida.medida_panturrilhas.toFixed(1)}cm</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
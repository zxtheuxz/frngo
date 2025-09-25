import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { normalizarAltura } from '../../utils/normalizarAltura';
import {
  FileText,
  Clock,
  User,
  Eye,
  Check,
  X,
  AlertCircle,
  Edit3,
  Image,
  Calendar,
  Phone,
  Mail,
  MoreHorizontal,
  Brain,
  Plus,
  Loader2,
  XCircle,
  Activity,
  Zap
} from 'lucide-react';
import { EditorResultadoFisico } from './EditorResultadoFisico';
import { VisualizadorFormularioFisico } from './VisualizadorFormularioFisico';
import { ClienteDetailModal } from '../ClienteDetailModal';
import ResultadosAnalise from '../analise-corporal/ResultadosAnalise';
import { 
  analisarComposicaoCorporal,
  classificarRazaoCinturaQuadril,
  classificarRazaoCinturaEstatura,
  classificarIndiceConicidade,
  classificarIndiceMassaMagra,
  classificarIndiceMassaGorda,
  classificarCintura,
  classificarQuadril
} from '../../utils/calculosComposicaoCorporal';

interface AvaliacaoFisica {
  id: string;
  avaliacao_id: string;
  user_id: string;
  status: string;
  resultado_original: string;
  resultado_editado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  resultado_fisica_editado_em?: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
  };
}

interface AvaliacoesFisicasQueueProps {
  onAvaliacaoSelect?: (avaliacao: AvaliacaoFisica) => void;
}

export function AvaliacoesFisicasQueue({ onAvaliacaoSelect }: AvaliacoesFisicasQueueProps) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO'>('PENDENTE');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AvaliacaoFisica | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showAnaliseCorpral, setShowAnaliseCorpral] = useState<string | null>(null);
  const [showFormularioCompleto, setShowFormularioCompleto] = useState<string | null>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [analiseCorporalData, setAnaliseCorporalData] = useState<any>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [showGerarAnalise, setShowGerarAnalise] = useState(false);
  const [dadosUsuario, setDadosUsuario] = useState<any>(null);
  const [dadosFotos, setDadosFotos] = useState<{foto_lateral_url?: string; foto_abertura_url?: string} | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);

  // Função debounced para carregar avaliações
  const loadAvaliacoesDebounced = useCallback(() => {
    // Cancelar timeout anterior
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Configurar novo timeout
    loadTimeoutRef.current = setTimeout(() => {
      loadAvaliacoes();
    }, 300); // 300ms de debounce
  }, [filter]);

  useEffect(() => {
    loadAvaliacoesDebounced();

    // Cleanup
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filter, loadAvaliacoesDebounced]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      // Criar novo AbortController para esta requisição
      abortControllerRef.current = new AbortController();
      
      const { data, error } = await supabase.rpc('buscar_avaliacoes_fisicas_pendentes');
      
      // Verificar se a requisição foi cancelada
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      if (error) {
        console.error('Erro ao buscar avaliações físicas:', error);
        return;
      }

      let filteredData = data || [];
      
      if (filter !== 'TODAS') {
        filteredData = filteredData.filter((avaliacao: AvaliacaoFisica) => avaliacao.status === filter);
      }
      
      setAvaliacoes(filteredData);
    } catch (error) {
      // Ignorar erros de abort
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      // Apenas atualizar loading se a requisição não foi cancelada
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleApprove = async (avaliacaoId: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_status_aprovacao', {
        p_id: avaliacaoId,
        p_status: 'APROVADO',
        p_tipo: 'fisica'
      });

      if (error) {
        console.error('Erro ao aprovar avaliação:', error);
        return;
      }

      await loadAvaliacoes();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
    }
  };

  const handleReject = async (avaliacaoId: string, observacoes?: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_status_aprovacao', {
        p_id: avaliacaoId,
        p_status: 'REJEITADO',
        p_tipo: 'fisica',
        p_observacoes: observacoes
      });

      if (error) {
        console.error('Erro ao rejeitar avaliação:', error);
        return;
      }

      await loadAvaliacoes();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
    }
  };

  const handleEdit = (avaliacao: AvaliacaoFisica) => {
    setSelectedAvaliacao(avaliacao);
    setEditorOpen(true);
  };

  const handleViewPhotos = (avaliacao: AvaliacaoFisica) => {
    // Criar objeto cliente compatível com ClienteDetailModal
    const cliente = {
      id: avaliacao.usuario.id,
      user_id: avaliacao.user_id,
      nome_completo: avaliacao.usuario.nome_completo,
      telefone: avaliacao.usuario.telefone || '',
      sexo: '', // Será carregado pelo modal
      role: 'cliente',
      liberado: 'sim',
      laudo_aprovado: '',
      created_at: avaliacao.created_at,
      email: avaliacao.usuario.email
    };
    setSelectedCliente(cliente);
    setShowClienteModal(true);
  };

  const handleSaveEdit = async (avaliacaoId: string, novoResultado: string) => {
    try {
      // O salvamento já foi feito no EditorResultadoFisico
      // Apenas recarregar a lista e fechar o modal
      await loadAvaliacoes();
      setEditorOpen(false);
      setSelectedAvaliacao(null);
    } catch (error) {
      console.error('Erro ao recarregar:', error);
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

  const carregarAnaliseCorporal = async () => {
    if (!showAnaliseCorpral) return;

    setLoadingAnalise(true);
    try {
      // Buscar dados das fotos do perfil
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('foto_lateral_url, foto_abertura_url')
        .eq('user_id', showAnaliseCorpral)
        .single();
      
      setDadosFotos(perfilData || {});
      
      // Buscar análise existente
      const { data: medidaData, error: medidaError } = await supabase
        .from('medidas_corporais')
        .select('*')
        .eq('user_id', showAnaliseCorpral)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (medidaData && !medidaError) {
        // Buscar dados atualizados das avaliações nutricionais
        let dadosNutricionais = null;
        
        // Primeiro tentar buscar na tabela masculino
        const { data: avalMasc } = await supabase
          .from('avaliacao_nutricional')
          .select('altura, peso, idade')
          .eq('user_id', showAnaliseCorpral)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (avalMasc) {
          dadosNutricionais = { ...avalMasc, sexo: 'M' };
        } else {
          // Se não encontrou, tentar na tabela feminino
          const { data: avalFem } = await supabase
            .from('avaliacao_nutricional_feminino')
            .select('altura, peso, idade')
            .eq('user_id', showAnaliseCorpral)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (avalFem) {
            dadosNutricionais = { ...avalFem, sexo: 'F' };
          }
        }

        // Usar dados da avaliação nutricional se disponíveis
        const idade = dadosNutricionais?.idade || medidaData.idade_calculada;
        const sexo = dadosNutricionais?.sexo || medidaData.sexo_usado;

        // Formatar dados para o componente ResultadosAnalise
        setAnaliseCorporalData({
          composicao: {
            percentualGordura: medidaData.percentual_gordura,
            massaGorda: medidaData.massa_gorda,
            massaMagra: medidaData.massa_magra,
            tmb: medidaData.tmb,
            imc: medidaData.imc,
            aguaCorporal: medidaData.massa_magra * 0.723,
            aguaCorporalPercentual: (medidaData.massa_magra * 0.723 / medidaData.peso_usado) * 100
          },
          indices: {
            indiceGrimaldi: medidaData.shaped_score,
            razaoCinturaQuadril: classificarRazaoCinturaQuadril(
              medidaData.razao_cintura_quadril,
              sexo?.toLowerCase() === 'masculino' || sexo === 'M' ? 'M' : 'F'
            ),
            razaoCinturaEstatura: classificarRazaoCinturaEstatura(medidaData.razao_cintura_estatura),
            indiceConicidade: classificarIndiceConicidade(medidaData.indice_conicidade),
            indiceMassaMagra: classificarIndiceMassaMagra(
              medidaData.massa_magra / Math.pow(medidaData.altura_usada, 2),
              sexo?.toLowerCase() === 'masculino' || sexo === 'M' ? 'M' : 'F'
            ),
            indiceMassaGorda: classificarIndiceMassaGorda(
              medidaData.massa_gorda / Math.pow(medidaData.altura_usada, 2)
            ),
            cintura: classificarCintura(
              medidaData.medida_cintura,
              sexo?.toLowerCase() === 'masculino' || sexo === 'M' ? 'M' : 'F'
            ),
            quadril: classificarQuadril(
              medidaData.medida_quadril,
              sexo?.toLowerCase() === 'masculino' || sexo === 'M' ? 'M' : 'F'
            )
          },
          medidas: {
            bracos: medidaData.medida_bracos,
            antebracos: medidaData.medida_antebracos,
            cintura: medidaData.medida_cintura,
            quadril: medidaData.medida_quadril,
            coxas: medidaData.medida_coxas,
            panturrilhas: medidaData.medida_panturrilhas
          },
          perfil: {
            altura: medidaData.altura_usada,
            peso: medidaData.peso_usado,
            idade: idade,
            sexo: sexo?.toLowerCase() === 'masculino' || sexo === 'M' ? 'M' : 'F'
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar análise corporal:', error);
    } finally {
      setLoadingAnalise(false);
    }
  };

  const iniciarGeracaoAnalise = async () => {
    if (!showAnaliseCorpral) return;

    try {
      // Buscar dados do usuário
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('sexo, foto_lateral_url, foto_abertura_url, data_nascimento')
        .eq('user_id', showAnaliseCorpral)
        .single();

      // Buscar dados nutricionais mais recentes (primeiro masculino, depois feminino)
      let dadosAvaliacao = null;
      
      // Tentar buscar na tabela masculino
      const { data: avalMasc } = await supabase
        .from('avaliacao_nutricional')
        .select('altura, peso, idade')
        .eq('user_id', showAnaliseCorpral)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (avalMasc) {
        dadosAvaliacao = { ...avalMasc, sexo: 'M' };
      } else {
        // Se não encontrou, tentar na tabela feminino
        const { data: avalFem } = await supabase
          .from('avaliacao_nutricional_feminino')
          .select('altura, peso, idade')
          .eq('user_id', showAnaliseCorpral)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (avalFem) {
          dadosAvaliacao = { ...avalFem, sexo: 'F' };
        }
      }

      if (!dadosAvaliacao) {
        alert('Dados nutricionais não encontrados. O cliente precisa preencher a avaliação nutricional primeiro.');
        return;
      }

      // Usa a função para normalizar altura para metros
      const alturaEmMetros = normalizarAltura(dadosAvaliacao.altura);

      setDadosUsuario({
        altura: alturaEmMetros,
        peso: dadosAvaliacao.peso,
        idade: dadosAvaliacao.idade, // Usar idade da tabela nutricional
        sexo: dadosAvaliacao.sexo, // Usar sexo da tabela nutricional
        foto_lateral_url: perfilData.foto_lateral_url,
        foto_abertura_url: perfilData.foto_abertura_url
      });

      setShowGerarAnalise(true);
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      alert('Erro ao buscar dados do usuário.');
    }
  };

  // Carregar análise quando abrir o modal
  useEffect(() => {
    if (showAnaliseCorpral) {
      carregarAnaliseCorporal();
    }
  }, [showAnaliseCorpral]);

  // Fechar menu dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('[data-menu-button]') && !(event.target as Element).closest('[data-menu-dropdown]')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMenuId]);

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
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Avaliações Físicas</h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Gerencie e aprove os resultados das avaliações físicas
              </p>
            </div>
            
            {/* Filtros */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
              {(['TODAS', 'PENDENTE', 'APROVADO', 'REJEITADO'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === status
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {status === 'TODAS' ? 'Todas' : 
                   status.charAt(0) + status.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="p-4 sm:p-6">
          {avaliacoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h4>
              <p className="text-gray-600">
                {filter === 'PENDENTE' 
                  ? 'Não há avaliações pendentes no momento.' 
                  : `Não há avaliações com status "${filter.toLowerCase()}".`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {avaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="font-medium text-slate-900 truncate">
                            {avaliacao.usuario.nome_completo}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border self-start ${getStatusColor(avaliacao.status)}`}>
                          {getStatusIcon(avaliacao.status)}
                          <span className="hidden sm:inline">{avaliacao.status}</span>
                          <span className="sm:hidden">
                            {avaliacao.status === 'PENDENTE' ? 'PEND.' :
                             avaliacao.status === 'APROVADO' ? 'APROV.' :
                             avaliacao.status === 'REJEITADO' ? 'REJ.' : avaliacao.status}
                          </span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-1 sm:gap-2 text-xs sm:text-sm text-slate-600 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{avaliacao.usuario.email}</span>
                        </div>
                        {avaliacao.usuario.telefone && (
                          <div className="flex items-center gap-2 min-w-0">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{avaliacao.usuario.telefone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          {formatDate(avaliacao.created_at)}
                        </div>
                      </div>
                      
                      {avaliacao.observacoes && (
                        <div className="bg-slate-50 rounded-md p-2 mb-2 sm:mb-3">
                          <p className="text-xs text-slate-600">
                            <strong>Observações:</strong> {avaliacao.observacoes}
                          </p>
                        </div>
                      )}

                      {avaliacao.resultado_fisica_editado_em && (
                        <div className="bg-blue-50 rounded-md p-2 mb-2 sm:mb-3">
                          <p className="text-xs text-blue-600">
                            <strong>Treino editado em:</strong> {formatDate(avaliacao.resultado_fisica_editado_em)}
                          </p>
                        </div>
                      )}


                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={() => setShowFormularioCompleto(avaliacao.user_id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Ver formulário completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowAnaliseCorpral(avaliacao.user_id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Ver análise corporal"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleViewPhotos(avaliacao)}
                        className="p-2 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                        title="Ver fotos do paciente"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(avaliacao)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar resultado"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {avaliacao.status === 'PENDENTE' && (
                        <>
                          <button
                            onClick={() => handleApprove(avaliacao.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(avaliacao.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm font-medium flex items-center gap-1"
                            title="Rejeitar"
                          >
                            <X className="w-4 h-4" />
                            Rejeitar
                          </button>
                        </>
                      )}
                    </div>

                    {/* Mobile Actions - Ícones Principais */}
                    <div className="flex items-center gap-1 sm:hidden">
                      <button
                        onClick={() => setShowFormularioCompleto(avaliacao.user_id)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Ver formulário"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowAnaliseCorpral(avaliacao.user_id)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Análise corporal"
                      >
                        <Brain className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleViewPhotos(avaliacao)}
                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-md transition-colors"
                        title="Ver fotos"
                      >
                        <Image className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleEdit(avaliacao)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      
                      {/* Menu dropdown apenas para ações de aprovação */}
                      {avaliacao.status === 'PENDENTE' && (
                        <div className="relative">
                          <button
                            data-menu-button
                            onClick={() => setOpenMenuId(openMenuId === avaliacao.id ? null : avaliacao.id)}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                            title="Mais ações"
                          >
                            <MoreHorizontal className="w-4 h-4 text-slate-600" />
                          </button>
                          
                          {openMenuId === avaliacao.id && (
                            <div data-menu-dropdown className="absolute right-0 top-8 w-36 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
                              <button
                                onClick={() => {
                                  handleApprove(avaliacao.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Aprovar
                              </button>
                              <button
                                onClick={() => {
                                  handleReject(avaliacao.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                              >
                                <X className="w-4 h-4" />
                                Rejeitar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {editorOpen && selectedAvaliacao && (
        <EditorResultadoFisico
          avaliacao={selectedAvaliacao}
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedAvaliacao(null);
          }}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal Análise Corporal */}
      {showAnaliseCorpral && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header fixo */}
            <div className="p-6 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Análise Corporal do Cliente
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Visualize e gerencie a análise corporal completa
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAnaliseCorpral(null);
                    setAnaliseCorporalData(null);
                    setShowGerarAnalise(false);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Corpo com scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {loadingAnalise ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
                    <span className="text-lg text-slate-600">Carregando análise corporal...</span>
                  </div>
                ) : showGerarAnalise && dadosUsuario ? (
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="text-center py-8">
                      <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-slate-900 mb-2">
                        Sistema Unificado de Análise Corporal
                      </h4>
                      <p className="text-slate-600 mb-6">
                        Use a aba "Análise Corporal" no dashboard principal para processar análises corporais de forma unificada.
                      </p>
                      <button
                        onClick={() => {
                          setShowGerarAnalise(false);
                          // Simular clique na aba de análise corporal após um breve delay
                          setTimeout(() => {
                            const tabs = document.querySelectorAll('button[data-tab], button');
                            tabs.forEach(tab => {
                              if (tab.textContent?.includes('Análise Corporal') || tab.textContent?.includes('Corporal')) {
                                (tab as HTMLButtonElement).click();
                              }
                            });
                          }, 100);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Brain className="w-5 h-5" />
                        Ir para Sistema Unificado
                      </button>
                    </div>
                  </div>
                ) : analiseCorporalData ? (
                  <ResultadosAnalise resultado={analiseCorporalData} />
                ) : (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Nenhuma análise corporal encontrada
                    </h4>
                    <p className="text-slate-600 mb-6">
                      O cliente ainda não possui uma análise corporal processada.
                    </p>
                    {dadosFotos?.foto_lateral_url && dadosFotos?.foto_abertura_url ? (
                      <button
                        onClick={() => {
                          // Redirecionar para sistema unificado
                          setTimeout(() => {
                            const tabs = document.querySelectorAll('button[data-tab], button');
                            tabs.forEach(tab => {
                              if (tab.textContent?.includes('Análise Corporal') || tab.textContent?.includes('Corporal')) {
                                (tab as HTMLButtonElement).click();
                              }
                            });
                          }, 100);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                      >
                        <Brain className="w-5 h-5" />
                        Ir para Sistema Unificado
                      </button>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                        <AlertCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                        <h5 className="text-lg font-medium text-green-900 mb-2">
                          Fotos não disponíveis
                        </h5>
                        <p className="text-green-700 text-sm mb-4">
                          Para gerar a análise corporal, o cliente precisa enviar as fotos de abertura e lateral através do aplicativo.
                        </p>
                        <div className="text-green-600 text-xs">
                          <strong>Status das fotos:</strong>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              {dadosFotos?.foto_abertura_url ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                              <span>Foto de abertura {dadosFotos?.foto_abertura_url ? 'disponível' : 'não enviada'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {dadosFotos?.foto_lateral_url ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <X className="w-4 h-4 text-red-600" />
                              )}
                              <span>Foto lateral {dadosFotos?.foto_lateral_url ? 'disponível' : 'não enviada'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Informações administrativas */}
                {analiseCorporalData && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                    <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Informações Administrativas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600">Status da Análise</p>
                        <p className="text-sm font-medium text-green-600">
                          Concluída e disponível para o cliente
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Processamento</p>
                        <p className="flex items-center gap-1 text-sm">
                          <Zap className="w-4 h-4 text-green-600" />
                          Automático (MediaPipe)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulário Físico Completo */}
      {showFormularioCompleto && (
        <VisualizadorFormularioFisico
          userId={showFormularioCompleto}
          isOpen={true}
          onClose={() => setShowFormularioCompleto(null)}
        />
      )}

      {/* Modal de Fotos do Cliente */}
      {showClienteModal && selectedCliente && (
        <ClienteDetailModal
          cliente={selectedCliente}
          isOpen={showClienteModal}
          onClose={() => {
            setShowClienteModal(false);
            setSelectedCliente(null);
          }}
        />
      )}
    </>
  );
}
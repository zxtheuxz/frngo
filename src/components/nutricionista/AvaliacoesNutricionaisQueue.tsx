import React, { useState, useEffect } from 'react';
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
  ChefHat,
  Salad,
  Brain,
  Plus,
  Loader2,
  XCircle,
  Activity,
  Zap,
  MoreHorizontal
} from 'lucide-react';
import { EditorResultadoNutricional } from './EditorResultadoNutricional';
import { VisualizadorFormularioNutricional } from './VisualizadorFormularioNutricional';
import { ClienteDetailModal } from '../ClienteDetailModal';
import ResultadosAnalise from '../analise-corporal/ResultadosAnalise';

interface AvaliacaoNutricional {
  id: string;
  avaliacao_id: string;
  user_id: string;
  tipo_avaliacao: 'masculino' | 'feminino';
  status: string;
  resultado_original: string;
  resultado_editado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
  };
}

interface AvaliacoesNutricionaisQueueProps {
  tipoAvaliacao: 'masculino' | 'feminino';
}

export function AvaliacoesNutricionaisQueue({ tipoAvaliacao }: AvaliacoesNutricionaisQueueProps) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoNutricional[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'TODAS' | 'PENDENTE' | 'APROVADO' | 'REJEITADO'>('PENDENTE');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<AvaliacaoNutricional | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [showFormularioCompleto, setShowFormularioCompleto] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  
  // Estados para análise corporal (legado - movido para aba separada)
  const [showAnaliseCorpral, setShowAnaliseCorpral] = useState<string | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);
  const [showGerarAnalise, setShowGerarAnalise] = useState(false);
  const [analiseCorporalData, setAnaliseCorporalData] = useState<any>(null);
  const [dadosUsuario, setDadosUsuario] = useState<any>(null);
  const [dadosFotos, setDadosFotos] = useState<any>(null);

  useEffect(() => {
    loadAvaliacoes();
  }, [filter, tipoAvaliacao]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('buscar_avaliacoes_nutricionais_pendentes');
      
      if (error) {
        console.error('Erro ao buscar avaliações nutricionais:', error);
        return;
      }

      let filteredData = data || [];
      
      // Filtrar por tipo de avaliação (masculino/feminino)
      filteredData = filteredData.filter((avaliacao: AvaliacaoNutricional) => 
        avaliacao.tipo_avaliacao === tipoAvaliacao
      );
      
      // Filtrar por status
      if (filter !== 'TODAS') {
        filteredData = filteredData.filter((avaliacao: AvaliacaoNutricional) => 
          avaliacao.status === filter
        );
      }
      
      setAvaliacoes(filteredData);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (avaliacaoId: string) => {
    try {
      const { error } = await supabase.rpc('atualizar_status_aprovacao', {
        p_id: avaliacaoId,
        p_status: 'APROVADO',
        p_tipo: 'nutricional'
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
        p_tipo: 'nutricional',
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

  const handleEdit = (avaliacao: AvaliacaoNutricional) => {
    setSelectedAvaliacao(avaliacao);
    setEditorOpen(true);
  };

  const handleViewPhotos = (avaliacao: AvaliacaoNutricional) => {
    // Criar objeto cliente compatível com ClienteDetailModal
    const cliente = {
      id: avaliacao.usuario.id,
      user_id: avaliacao.user_id,
      nome_completo: avaliacao.usuario.nome_completo,
      telefone: avaliacao.usuario.telefone || '',
      sexo: avaliacao.tipo_avaliacao === 'feminino' ? 'feminino' : 'masculino',
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
      // O EditorResultadoNutricional já salva diretamente na tabela perfis
      // Aqui apenas precisamos fechar o modal e recarregar os dados
      
      // Mostrar feedback de sucesso
      alert('Resultado nutricional salvo com sucesso!');
      
      // Fechar o modal
      setEditorOpen(false);
      setSelectedAvaliacao(null);
      
      // Recarregar as avaliações para refletir qualquer mudança
      await loadAvaliacoes();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar o resultado. Tente novamente.');
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

  const getTipoIcon = () => {
    return tipoAvaliacao === 'masculino' ? 
      <ChefHat className="w-5 h-5" /> : 
      <Salad className="w-5 h-5" />;
  };

  const getTipoColor = () => {
    return tipoAvaliacao === 'masculino' ? 'blue' : 'pink';
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
        // Buscar dados atualizados da avaliação nutricional
        let dadosNutricionais = null;
        
        // Primeiro tentar buscar na tabela do tipo atual (masculino/feminino)
        const { data: avalData } = await supabase
          .from(tipoAvaliacao === 'masculino' ? 'avaliacao_nutricional' : 'avaliacao_nutricional_feminino')
          .select('altura, peso, idade')
          .eq('user_id', showAnaliseCorpral)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (avalData) {
          dadosNutricionais = { ...avalData, sexo: tipoAvaliacao === 'masculino' ? 'M' : 'F' };
        } else {
          // Se não encontrou, tentar na outra tabela
          const { data: avalDataAlt } = await supabase
            .from(tipoAvaliacao === 'masculino' ? 'avaliacao_nutricional_feminino' : 'avaliacao_nutricional')
            .select('altura, peso, idade')
            .eq('user_id', showAnaliseCorpral)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (avalDataAlt) {
            dadosNutricionais = { ...avalDataAlt, sexo: tipoAvaliacao === 'masculino' ? 'F' : 'M' };
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

      // Buscar dados nutricionais mais recentes
      const { data: avalData } = await supabase
        .from(tipoAvaliacao === 'masculino' ? 'avaliacao_nutricional' : 'avaliacao_nutricional_feminino')
        .select('altura, peso, idade')
        .eq('user_id', showAnaliseCorpral)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!avalData) {
        alert('Dados nutricionais não encontrados.');
        return;
      }

      // Usa a função para normalizar altura para metros
      const alturaEmMetros = normalizarAltura(avalData.altura);

      setDadosUsuario({
        altura: alturaEmMetros,
        peso: avalData.peso,
        idade: avalData.idade, // Usar idade da tabela nutricional
        sexo: tipoAvaliacao === 'masculino' ? 'M' : 'F', // Definir sexo baseado no tipo de avaliação
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
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
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
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-${getTipoColor()}-50 text-${getTipoColor()}-600`}>
                  {getTipoIcon()}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900">
                    Avaliações Nutricionais - {tipoAvaliacao === 'masculino' ? 'Masculino' : 'Feminino'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                    Gerencie e aprove os resultados das avaliações nutricionais
                  </p>
                </div>
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-2">
              {(['TODAS', 'PENDENTE', 'APROVADO', 'REJEITADO'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    filter === status
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
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
                  ? `Não há avaliações ${tipoAvaliacao === 'masculino' ? 'masculinas' : 'femininas'} pendentes no momento.` 
                  : `Não há avaliações com status "${filter.toLowerCase()}".`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {avaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  className="border border-slate-200 rounded-lg p-4 sm:p-5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Nome do cliente */}
                      <div className="flex items-center gap-3 mb-3">
                        <User className="w-5 h-5 text-slate-500" />
                        <span className="font-semibold text-slate-900 text-base">
                          {avaliacao.usuario.nome_completo}
                        </span>
                      </div>
                      
                      {/* Status e tipo */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border ${getStatusColor(avaliacao.status)}`}>
                          {getStatusIcon(avaliacao.status)}
                          {avaliacao.status}
                        </span>
                        <span className={`px-3 py-1.5 rounded-md text-sm font-medium bg-${getTipoColor()}-50 text-${getTipoColor()}-700 border border-${getTipoColor()}-200`}>
                          {tipoAvaliacao === 'masculino' ? 'Masculino' : 'Feminino'}
                        </span>
                      </div>
                      
                      {/* Informações de contato */}
                      <div className="space-y-2 text-sm text-slate-600 mb-4">
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span>{avaliacao.usuario.email}</span>
                        </div>
                        {avaliacao.usuario.telefone && (
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-slate-400" />
                            <span>{avaliacao.usuario.telefone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{formatDate(avaliacao.created_at)}</span>
                        </div>
                      </div>
                      
                      {avaliacao.observacoes && (
                        <div className="bg-slate-50 rounded-md p-2 mb-3">
                          <p className="text-xs text-slate-600">
                            <strong>Observações:</strong> {avaliacao.observacoes}
                          </p>
                        </div>
                      )}

                      {avaliacao.resultado_editado && (
                        <div className="bg-blue-50 rounded-md p-2 mb-3">
                          <p className="text-xs text-blue-600">
                            <strong>Resultado editado</strong> - Última atualização: {formatDate(avaliacao.updated_at)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Desktop Actions */}
                    <div className="hidden sm:flex items-center gap-2">
                      <button
                        onClick={() => setShowFormularioCompleto(avaliacao.user_id)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="Ver formulário nutricional completo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setShowAnaliseCorpral(avaliacao.user_id)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Visualizar análise corporal completa"
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
                        title="Editar resultado nutricional"
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

                    {/* Mobile Actions */}
                    <div className="sm:hidden">
                      {/* Ações principais sempre visíveis */}
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => setShowFormularioCompleto(avaliacao.user_id)}
                          className="flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors min-h-[44px]"
                          title="Ver formulário nutricional"
                        >
                          <Eye className="w-5 h-5" />
                          <span className="text-sm font-medium">Formulário</span>
                        </button>
                        
                        <button
                          onClick={() => setShowAnaliseCorpral(avaliacao.user_id)}
                          className="flex items-center gap-2 px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors min-h-[44px]"
                          title="Ver análise corporal"
                        >
                          <Brain className="w-5 h-5" />
                          <span className="text-sm font-medium">Análise</span>
                        </button>
                        
                        <button
                          onClick={() => handleViewPhotos(avaliacao)}
                          className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors min-h-[44px]"
                          title="Ver fotos do paciente"
                        >
                          <Image className="w-5 h-5" />
                          <span className="text-sm font-medium">Ver Fotos</span>
                        </button>

                        <button
                          onClick={() => handleEdit(avaliacao)}
                          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors min-h-[44px]"
                          title="Editar resultado"
                        >
                          <Edit3 className="w-5 h-5" />
                          <span className="text-sm font-medium">Editar</span>
                        </button>
                      </div>
                      
                      {/* Botões de aprovação para status PENDENTE */}
                      {avaliacao.status === 'PENDENTE' && (
                        <div className="flex gap-3 pt-3 border-t border-slate-200">
                          <button
                            onClick={() => handleApprove(avaliacao.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium min-h-[44px]"
                          >
                            <Check className="w-5 h-5" />
                            Aprovar
                          </button>
                          <button
                            onClick={() => handleReject(avaliacao.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium min-h-[44px]"
                          >
                            <X className="w-5 h-5" />
                            Rejeitar
                          </button>
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
        <EditorResultadoNutricional
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
                  <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600">
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
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600 mr-3" />
                    <span className="text-lg text-slate-600">Carregando análise corporal...</span>
                  </div>
                ) : showGerarAnalise && dadosUsuario ? (
                  <div className="bg-amber-50 rounded-lg p-6">
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
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 max-w-md mx-auto">
                        <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                        <h5 className="text-lg font-medium text-amber-900 mb-2">
                          Fotos não disponíveis
                        </h5>
                        <p className="text-amber-700 text-sm mb-4">
                          Para gerar a análise corporal, o cliente precisa enviar as fotos de abertura e lateral através do aplicativo.
                        </p>
                        <div className="text-amber-600 text-xs">
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
                          <Zap className="w-4 h-4 text-amber-600" />
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

      {/* Modal Formulário Completo */}
      {showFormularioCompleto && (
        <VisualizadorFormularioNutricional
          userId={showFormularioCompleto}
          tipoAvaliacao={tipoAvaliacao}
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
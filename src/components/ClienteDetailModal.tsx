import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Activity, Utensils, Clock, ChevronDown, ChevronRight, AlertCircle, CheckCircle2, XCircle, Heart, Zap, Calendar, Phone, Mail, MapPin, Image, Camera, FileCheck, Download, FileText, Brain, AlertTriangle } from 'lucide-react';
import { ResumoExecutivo } from './ResumoExecutivo';
import ResultadosAnalise from './analise-corporal/ResultadosAnalise';
import { 
  ResultadoAnalise,
  MedidasCorporais,
  PerfilUsuario,
  ComposicaoCorporal,
  IndicesRisco,
  classificarIndiceMassaMagra,
  classificarIndiceMassaGorda,
  classificarRazaoCinturaQuadril,
  classificarRazaoCinturaEstatura,
  classificarIndiceConicidade,
  classificarCintura,
  classificarQuadril
} from '../utils/calculosComposicaoCorporal';
import { normalizarAltura } from '../utils/normalizarAltura';
import { calcularIndiceConicidade } from '../utils/calculosGrimaldi';

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

interface AvaliacaoFisica {
  id: string;
  sexo: string;
  idade: string;
  objetivo: string;
  tempo_inativo: string;
  experiencia_musculacao: string;
  disponibilidade_semanal: string;
  nivel_experiencia: string;
  tem_laudo_medico: boolean;
  doenca_pre_existente: string;
  sente_dores: boolean;
  usa_medicamentos: boolean;
  doenca_impossibilita: boolean;
  tem_lesao: boolean;
  created_at: string;
}

interface AvaliacaoNutricional {
  id: string;
  peso: number;
  altura: number;
  idade: number;
  nivel_atividade: string;
  objetivo: string;
  restricao_alimentar: string[];
  intolerancia_alimentar: string[];
  suplementacao: string[];
  consumo_agua: number;
  horario_acordar: string;
  horario_dormir: string;
  qtd_refeicoes: number;
  created_at: string;
}

interface AvaliacaoNutricionalFeminino {
  id: string;
  nome: string;
  idade: number;
  peso: number;
  altura: number;
  objetivo: string;
  ciclo_menstrual_regular: boolean;
  sintomas_tpm: string[];
  ja_engravidou: boolean;
  quantidade_gestacoes: number;
  metodo_contraceptivo: string;
  nivel_estresse: number;
  horas_sono: number;
  pratica_exercicios: boolean;
  intestino_regular: boolean;
  created_at: string;
}

interface PerfilFotos {
  foto_lateral_url?: string;
  foto_abertura_url?: string;
}

interface LaudoMedico {
  id: string;
  status: string;
  tipo_documento: string;
  documento_url: string;
  observacoes?: string;
  created_at: string;
  aprovado_em?: string;
}

interface FotoInfo {
  id: string;
  title: string;
  url?: string;
  position: string;
  uploaded: boolean;
}


interface ClienteDetailModalProps {
  cliente: Cliente | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ClienteDetailModal({ cliente, isOpen, onClose }: ClienteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'resumo' | 'fisica' | 'nutricional' | 'geral' | 'fotos' | 'corporal'>('resumo');
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(false);
  const [avaliacaoFisica, setAvaliacaoFisica] = useState<AvaliacaoFisica | null>(null);
  const [avaliacaoNutricional, setAvaliacaoNutricional] = useState<any>(null); // Pode ser dados masculinos ou femininos
  const [perfilFotos, setPerfilFotos] = useState<PerfilFotos | null>(null);
  const [laudos, setLaudos] = useState<LaudoMedico[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [analiseCorporal, setAnaliseCorporal] = useState<any[]>([]);
  const [analiseCorporalFormatada, setAnaliseCorporalFormatada] = useState<ResultadoAnalise | null>(null);

  useEffect(() => {
    if (isOpen && cliente) {
      loadClienteDetails();
    }
  }, [isOpen, cliente]);

  // Hook para fechar modal de foto com tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [selectedPhoto]);

  const loadClienteDetails = async () => {
    if (!cliente) {
      console.log('Cliente não existe, saindo...');
      return;
    }
    
    setLoading(true);
    console.log('=== INICIANDO CARREGAMENTO DE DADOS ===');
    console.log('Cliente:', cliente.nome_completo);
    console.log('User ID:', cliente.user_id);
    console.log('Sexo:', cliente.sexo);
    
    // Verificar usuário logado atual
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Usuário logado:', user?.id);
    
    // Verificar role do usuário logado
    if (user) {
      const { data: perfilLogado } = await supabase
        .from('perfis')
        .select('role, nome_completo')
        .eq('user_id', user.id)
        .single();
      console.log('🎭 Role do usuário logado:', perfilLogado?.role, '(', perfilLogado?.nome_completo, ')');
    }
    
    try {
      // Teste direto das políticas - buscar TODAS as avaliações (para debug)
      const { data: todasFisicas, error: todasFisicasError } = await supabase
        .from('avaliacao_fisica')
        .select('user_id, sexo, idade')
        .limit(5);
      
      console.log('🔍 Teste políticas - todas físicas:', todasFisicas?.length || 0, 'registros');
      if (todasFisicasError) {
        console.error('❌ Erro teste políticas físicas:', todasFisicasError);
      }
      
      // Buscar avaliação física específica
      const { data: fisicaData, error: fisicaError } = await supabase
        .from('avaliacao_fisica')
        .select('*')
        .eq('user_id', cliente.user_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fisicaError) {
        console.error('❌ Erro ao buscar avaliação física:', fisicaError);
      } else {
        console.log('✅ Query avaliação física executada');
        console.log('📊 Dados físicos retornados:', fisicaData);
        console.log('📊 Quantidade de registros físicos:', fisicaData?.length || 0);
        setAvaliacaoFisica(fisicaData?.[0] || null);
      }

      // Buscar avaliação nutricional baseada no sexo
      let nutricionalData = null;
      let nutricionalError = null;

      if (cliente.sexo === 'feminino') {
        console.log('🚺 Buscando avaliação nutricional feminina...');
        const result = await supabase
          .from('avaliacao_nutricional_feminino')
          .select('*')
          .eq('user_id', cliente.user_id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        nutricionalData = result.data;
        nutricionalError = result.error;
        console.log('🚺 Resultado feminino:', { data: nutricionalData, error: nutricionalError });
      } else {
        console.log('🚹 Buscando avaliação nutricional masculina...');
        const result = await supabase
          .from('avaliacao_nutricional')
          .select('*')
          .eq('user_id', cliente.user_id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        nutricionalData = result.data;
        nutricionalError = result.error;
        console.log('🚹 Resultado masculino:', { data: nutricionalData, error: nutricionalError });
      }

      if (nutricionalError) {
        console.error('❌ Erro ao buscar avaliação nutricional:', nutricionalError);
      } else {
        console.log('✅ Query nutricional executada');
        console.log('🥗 Dados nutricionais retornados:', nutricionalData);
        console.log('🥗 Quantidade de registros nutricionais:', nutricionalData?.length || 0);
        setAvaliacaoNutricional(nutricionalData?.[0] || null);
      }

      console.log('=== RESUMO FINAL ===');
      console.log('Avaliação Física:', fisicaData?.[0] ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
      console.log('Avaliação Nutricional:', nutricionalData?.[0] ? 'ENCONTRADA' : 'NÃO ENCONTRADA');

      // Buscar fotos do perfil
      const { data: fotosData, error: fotosError } = await supabase
        .from('perfis')
        .select(`
          foto_lateral_url,
          foto_abertura_url
        `)
        .eq('user_id', cliente.user_id)
        .single();

      if (fotosError) {
        console.error('❌ Erro ao buscar fotos:', fotosError);
      } else {
        console.log('✅ Fotos carregadas:', fotosData);
        setPerfilFotos(fotosData);
      }

      // Buscar laudos médicos
      const { data: laudosData, error: laudosError } = await supabase
        .from('analises_medicamentos')
        .select(`
          id,
          status,
          tipo_documento,
          documento_url,
          observacoes,
          created_at,
          aprovado_em
        `)
        .eq('user_id', cliente.user_id)
        .order('created_at', { ascending: false });

      if (laudosError) {
        console.error('❌ Erro ao buscar laudos:', laudosError);
      } else {
        console.log('✅ Laudos carregados:', laudosData?.length || 0, 'documentos');
        setLaudos(laudosData || []);
      }

      // Buscar análise corporal COMPLETA
      console.log('=== BUSCANDO ANÁLISE CORPORAL COMPLETA ===');
      const { data: analiseCorporalData, error: analiseCorporalError } = await supabase
        .from('medidas_corporais')
        .select('*')
        .eq('user_id', cliente.user_id)
        .order('created_at', { ascending: false });

      if (analiseCorporalError) {
        console.error('Erro ao buscar análise corporal:', analiseCorporalError);
      } else {
        console.log('=== Análises corporais encontradas:', analiseCorporalData?.length || 0);
        // Adicionar o sexo do cliente em cada análise (já disponível)
        const analisesComSexo = analiseCorporalData?.map(analise => ({
          ...analise,
          sexo: cliente.sexo || 'M'
        }));
        setAnaliseCorporal(analisesComSexo || []);
        
        // Formatar a análise mais recente para exibição
        if (analisesComSexo && analisesComSexo.length > 0) {
          const analiseMaisRecente = analisesComSexo[0];
          const resultadoFormatado = formatarAnaliseParaResultado(analiseMaisRecente);
          setAnaliseCorporalFormatada(resultadoFormatado);
        }
      }

    } catch (error) {
      console.error('Erro geral ao carregar detalhes do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar dados da análise corporal do banco para o formato ResultadoAnalise
  const formatarAnaliseParaResultado = (analise: any): ResultadoAnalise => {
    // Converter sexo para formato esperado
    const sexo = analise.sexo_usado || analise.sexo || 'M';
    const sexoFormatado = sexo === 'feminino' ? 'F' : sexo === 'masculino' ? 'M' : sexo;
    
    // Criar perfil do usuário
    const perfil: PerfilUsuario = {
      altura: normalizarAltura(analise.altura_usada || 170), // Usa a função para normalizar
      peso: analise.peso_usado || 70,
      idade: analise.idade_calculada || 30,
      sexo: sexoFormatado as 'M' | 'F'
    };
    
    // Criar medidas corporais
    const medidas: MedidasCorporais = {
      bracos: analise.medida_bracos || 0,
      antebracos: analise.medida_antebracos || 0,
      cintura: analise.medida_cintura || 0,
      quadril: analise.medida_quadril || 0,
      coxas: analise.medida_coxas || 0,
      panturrilhas: analise.medida_panturrilhas || 0
    };
    
    // Criar composição corporal
    const composicao: ComposicaoCorporal = {
      percentualGordura: analise.percentual_gordura || 0,
      massaGorda: analise.massa_gorda || 0,
      massaMagra: analise.massa_magra || 0,
      tmb: analise.tmb || 0,
      imc: analise.imc || 0,
      aguaCorporal: (analise.massa_magra || 0) * 0.73, // Cálculo padrão
      aguaCorporalPercentual: ((analise.massa_magra || 0) * 0.73 / (analise.peso_usado || 70)) * 100
    };
    
    // Usar valores já calculados do banco ou calcular se não existirem
    const indiceMassaMagra = analise.indice_massa_magra || (composicao.massaMagra / Math.pow(perfil.altura, 2));
    const indiceMassaGorda = analise.indice_massa_gorda || (composicao.massaGorda / Math.pow(perfil.altura, 2));
    const razaoCinturaQuadril = analise.razao_cintura_quadril || (medidas.cintura / medidas.quadril);
    const razaoCinturaEstatura = analise.razao_cintura_estatura || (medidas.cintura / (perfil.altura * 100));
    const indiceConicidade = analise.indice_conicidade || calcularIndiceConicidade(medidas.cintura, perfil.peso, perfil.altura);
    
    const indices: IndicesRisco = {
      razaoCinturaQuadril: classificarRazaoCinturaQuadril(razaoCinturaQuadril, perfil.sexo),
      razaoCinturaEstatura: classificarRazaoCinturaEstatura(razaoCinturaEstatura),
      indiceConicidade: classificarIndiceConicidade(indiceConicidade),
      indiceMassaMagra: classificarIndiceMassaMagra(indiceMassaMagra, perfil.sexo),
      indiceMassaGorda: classificarIndiceMassaGorda(indiceMassaGorda),
      cintura: classificarCintura(medidas.cintura, perfil.sexo),
      quadril: classificarQuadril(medidas.quadril, perfil.sexo),
      indiceGrimaldi: analise.shaped_score || 0
    };
    
    return {
      composicao,
      indices,
      medidas,
      perfil
    };
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateIMC = (peso: number, altura: number) => {
    if (!peso || !altura) return 'N/A';
    // Usa a função para normalizar altura para metros
    const alturaMetros = normalizarAltura(altura);
    const imc = peso / (alturaMetros * alturaMetros);
    return imc.toFixed(1);
  };

  const getIMCCategory = (imc: string) => {
    const value = parseFloat(imc);
    if (isNaN(value)) return 'N/A';
    if (value < 18.5) return 'Abaixo do peso';
    if (value < 25) return 'Peso normal';
    if (value < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  if (!isOpen || !cliente) return null;

  const tabs = [
    { id: 'resumo', label: 'Resumo Executivo', icon: Heart },
    { id: 'fisica', label: 'Avaliação Física', icon: Activity },
    { id: 'nutricional', label: 'Avaliação Nutricional', icon: Utensils },
    { id: 'geral', label: 'Dados Gerais', icon: User },
    { id: 'fotos', label: 'Fotos e Laudos', icon: Image },
    { id: 'corporal', label: 'Análise Corporal', icon: Brain }
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const formatBooleanValue = (value: boolean | undefined, trueText = 'Sim', falseText = 'Não') => {
    if (value === undefined || value === null) return 'Não informado';
    return value ? trueText : falseText;
  };

  const getSectionIcon = (sectionId: string, isExpanded: boolean) => {
    return isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />;
  };

  const getBooleanBadge = (value: boolean | undefined, type: 'health' | 'status' = 'status') => {
    if (value === undefined || value === null) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">N/A</span>;
    }
    
    if (type === 'health') {
      return value ? (
        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Sim
        </span>
      ) : (
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Não
        </span>
      );
    }
    
    return value ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> Sim
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
        <XCircle className="w-3 h-3" /> Não
      </span>
    );
  };

  // Preparar dados das fotos para grid
  const fotos: FotoInfo[] = [
    {
      id: 'lateral',
      title: 'Foto Lateral',
      url: perfilFotos?.foto_lateral_url,
      position: 'lateral',
      uploaded: !!perfilFotos?.foto_lateral_url
    },
    {
      id: 'abertura',
      title: 'Foto de Abertura',
      url: perfilFotos?.foto_abertura_url,
      position: 'abertura',
      uploaded: !!perfilFotos?.foto_abertura_url
    }
  ];

  const fotosEnviadas = fotos.filter(foto => foto.uploaded).length;
  const totalFotos = fotos.length;

  const handleDownloadLaudo = (laudoUrl: string) => {
    if (laudoUrl) {
      window.open(laudoUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{cliente.nome_completo}</h2>
              <p className="text-sm text-slate-600">Detalhes completos do cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Tab Resumo Executivo */}
              {activeTab === 'resumo' && (
                <div className="space-y-6">
                  <ResumoExecutivo 
                    cliente={cliente}
                    avaliacaoFisica={avaliacaoFisica}
                    avaliacaoNutricional={avaliacaoNutricional}
                  />
                  
                  {/* Formulários Disponíveis */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      Status dos Formulários
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Avaliação Física</span>
                        </div>
                        {avaliacaoFisica ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Preenchido
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Pendente
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Utensils className="w-5 h-5 text-green-600" />
                          <span className="font-medium">Avaliação Nutricional</span>
                        </div>
                        {avaliacaoNutricional ? (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Preenchido
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Dados Gerais */}
              {activeTab === 'geral' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Informações Pessoais
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-600">Nome Completo</span>
                            <div className="font-medium text-slate-900">{cliente.nome_completo}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-600">Email</span>
                            <div className="font-medium text-slate-900">{cliente.email || 'Não informado'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Phone className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-600">Telefone</span>
                            <div className="font-medium text-slate-900">{cliente.telefone || 'Não informado'}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-600">Sexo</span>
                            <div className="font-medium text-slate-900 capitalize">{cliente.sexo || 'Não informado'}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-purple-600" />
                        Status da Conta
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-slate-600">Nível de Acesso</span>
                          <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              cliente.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                              cliente.role === 'preparador' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {cliente.role === 'admin' ? 'Administrador' :
                               cliente.role === 'preparador' ? 'Preparador' : 'Cliente'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Status do Acesso</span>
                          <div className="mt-1">
                            {cliente.liberado === 'sim' ? (
                              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-4 h-4" /> Liberado
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium flex items-center gap-1 w-fit">
                                <XCircle className="w-4 h-4" /> Bloqueado
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Status do Laudo</span>
                          <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 w-fit ${
                              cliente.laudo_aprovado === 'aprovado' ? 'bg-green-100 text-green-800' :
                              cliente.laudo_aprovado === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                              cliente.laudo_aprovado === 'rejeitado' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {cliente.laudo_aprovado === 'aprovado' && <CheckCircle2 className="w-4 h-4" />}
                              {cliente.laudo_aprovado === 'pendente' && <Clock className="w-4 h-4" />}
                              {cliente.laudo_aprovado === 'rejeitado' && <XCircle className="w-4 h-4" />}
                              {cliente.laudo_aprovado === 'aprovado' ? 'Aprovado' :
                               cliente.laudo_aprovado === 'pendente' ? 'Pendente' :
                               cliente.laudo_aprovado === 'rejeitado' ? 'Rejeitado' : 'Não informado'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-600">Data de Cadastro</span>
                          <div className="font-medium text-slate-900">{formatDate(cliente.created_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab Avaliação Física */}
              {activeTab === 'fisica' && (
                <div className="space-y-6">
                  {avaliacaoFisica ? (
                    <div className="space-y-6">
                      {/* Dados Básicos */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <button
                          onClick={() => toggleSection('dados-basicos')}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Dados Básicos
                          </h3>
                          {getSectionIcon('dados-basicos', expandedSections['dados-basicos'])}
                        </button>
                        {(expandedSections['dados-basicos'] !== false) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Idade</span>
                                  <div className="font-medium text-slate-900">{avaliacaoFisica.idade} anos</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <User className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Sexo</span>
                                  <div className="font-medium text-slate-900 capitalize">{avaliacaoFisica.sexo}</div>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Objetivo Principal</span>
                                  <div className="font-medium text-slate-900">{avaliacaoFisica.objetivo}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Nível de Experiência</span>
                                  <div className="font-medium text-slate-900 capitalize">
                                    {avaliacaoFisica.nivel_experiencia.replace('_', ' ')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Histórico de Treino */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <button
                          onClick={() => toggleSection('historico-treino')}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-green-600" />
                            Histórico de Treino
                          </h3>
                          {getSectionIcon('historico-treino', expandedSections['historico-treino'])}
                        </button>
                        {(expandedSections['historico-treino'] !== false) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-slate-600">Tempo Inativo</span>
                                <div className="font-medium text-slate-900">{avaliacaoFisica.tempo_inativo}</div>
                              </div>
                              <div>
                                <span className="text-sm text-slate-600">Experiência em Musculação</span>
                                <div className="font-medium text-slate-900">{avaliacaoFisica.experiencia_musculacao}</div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-slate-600">Disponibilidade Semanal</span>
                                <div className="font-medium text-slate-900">{avaliacaoFisica.disponibilidade_semanal}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Condições de Saúde */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <button
                          onClick={() => toggleSection('condicoes-saude')}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-600" />
                            Condições de Saúde
                          </h3>
                          {getSectionIcon('condicoes-saude', expandedSections['condicoes-saude'])}
                        </button>
                        {(expandedSections['condicoes-saude'] !== false) && (
                          <div className="mt-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">Possui laudo médico?</span>
                                {getBooleanBadge(avaliacaoFisica.tem_laudo_medico)}
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">Sente dores?</span>
                                {getBooleanBadge(avaliacaoFisica.sente_dores, 'health')}
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">Usa medicamentos?</span>
                                {getBooleanBadge(avaliacaoFisica.usa_medicamentos, 'health')}
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">Tem lesão?</span>
                                {getBooleanBadge(avaliacaoFisica.tem_lesao, 'health')}
                              </div>
                              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <span className="font-medium text-slate-700">Doença impossibilita exercícios?</span>
                                {getBooleanBadge(avaliacaoFisica.doenca_impossibilita, 'health')}
                              </div>
                            </div>
                            
                            {avaliacaoFisica.doenca_pre_existente && avaliacaoFisica.doenca_pre_existente !== 'nao' && (
                              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                                  <span className="font-semibold text-yellow-800">Doença Pré-existente</span>
                                </div>
                                <div className="text-yellow-700 font-medium">{avaliacaoFisica.doenca_pre_existente}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação física encontrada</h4>
                      <p className="text-gray-600 max-w-md mx-auto">O cliente ainda não preencheu o formulário de avaliação física. Solicite o preenchimento para obter informações detalhadas sobre o perfil físico.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Avaliação Nutricional */}
              {activeTab === 'nutricional' && (
                <div className="space-y-6">
                  {avaliacaoNutricional ? (
                    <div className="space-y-6">
                      {/* Dados Básicos */}
                      <div className="bg-white rounded-xl border border-slate-200 p-6">
                        <button
                          onClick={() => toggleSection('dados-nutricionais')}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-green-600" />
                            Dados Básicos
                          </h3>
                          {getSectionIcon('dados-nutricionais', expandedSections['dados-nutricionais'])}
                        </button>
                        {(expandedSections['dados-nutricionais'] !== false) && (
                          <div className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              {avaliacaoNutricional.nome && (
                                <div className="flex items-center gap-3">
                                  <User className="w-4 h-4 text-slate-400" />
                                  <div>
                                    <span className="text-sm text-slate-600">Nome</span>
                                    <div className="font-medium text-slate-900">{avaliacaoNutricional.nome}</div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Idade</span>
                                  <div className="font-medium text-slate-900">{avaliacaoNutricional.idade} anos</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Peso</span>
                                  <div className="font-medium text-slate-900">{avaliacaoNutricional.peso} kg</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Activity className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Altura</span>
                                  <div className="font-medium text-slate-900">{
                                    avaliacaoNutricional.altura < 10 
                                      ? `${(avaliacaoNutricional.altura * 100).toFixed(0)} cm` 
                                      : `${avaliacaoNutricional.altura} cm`
                                  }</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-slate-400" />
                                <div>
                                  <span className="text-sm text-slate-600">Objetivo</span>
                                  <div className="font-medium text-slate-900">{avaliacaoNutricional.objetivo}</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* IMC Destacado */}
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <Activity className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div>
                                    <span className="text-sm text-slate-600">IMC (índice de Massa Corporal)</span>
                                    <div className="font-semibold text-slate-900 text-lg">
                                      {calculateIMC(avaliacaoNutricional.peso, avaliacaoNutricional.altura)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    (() => {
                                      const imc = parseFloat(calculateIMC(avaliacaoNutricional.peso, avaliacaoNutricional.altura) || '0');
                                      if (imc < 18.5) return 'bg-yellow-100 text-yellow-800';
                                      if (imc < 25) return 'bg-green-100 text-green-800';
                                      if (imc < 30) return 'bg-orange-100 text-orange-800';
                                      return 'bg-red-100 text-red-800';
                                    })()
                                  }`}>
                                    {getIMCCategory(calculateIMC(avaliacaoNutricional.peso, avaliacaoNutricional.altura) || '0')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dados específicos por sexo */}
                      {cliente.sexo === 'feminino' ? (
                        // Dados femininos
                        <div className="space-y-6">
                          {/* Saúde Reprodutiva */}
                          <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <button
                              onClick={() => toggleSection('saude-reprodutiva')}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-pink-600" />
                                Saúde Reprodutiva
                              </h3>
                              {getSectionIcon('saude-reprodutiva', expandedSections['saude-reprodutiva'])}
                            </button>
                            {(expandedSections['saude-reprodutiva'] !== false) && (
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {avaliacaoNutricional.ciclo_menstrual_regular !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                      <span className="font-medium text-slate-700">Ciclo menstrual regular?</span>
                                      {getBooleanBadge(avaliacaoNutricional.ciclo_menstrual_regular)}
                                    </div>
                                  )}
                                  {avaliacaoNutricional.ja_engravidou !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                      <span className="font-medium text-slate-700">Já engravidou?</span>
                                      {getBooleanBadge(avaliacaoNutricional.ja_engravidou)}
                                    </div>
                                  )}
                                </div>
                                
                                {avaliacaoNutricional.quantidade_gestacoes && (
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <span className="text-sm text-blue-600 font-medium">Quantidade de Gestações</span>
                                    <div className="text-lg font-semibold text-blue-900">{avaliacaoNutricional.quantidade_gestacoes}</div>
                                  </div>
                                )}
                                
                                {avaliacaoNutricional.metodo_contraceptivo && (
                                  <div className="p-3 bg-purple-50 rounded-lg">
                                    <span className="text-sm text-purple-600 font-medium">Método Contraceptivo</span>
                                    <div className="font-semibold text-purple-900">{avaliacaoNutricional.metodo_contraceptivo}</div>
                                  </div>
                                )}
                                
                                {avaliacaoNutricional.sintomas_tpm && avaliacaoNutricional.sintomas_tpm.length > 0 && (
                                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                                    <span className="text-sm text-pink-600 font-medium">Sintomas de TPM</span>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {avaliacaoNutricional.sintomas_tpm.map((sintoma, index) => (
                                        <span key={index} className="px-2 py-1 bg-pink-100 text-pink-800 rounded-full text-xs">
                                          {sintoma}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Bem-estar */}
                          <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <button
                              onClick={() => toggleSection('bem-estar-feminino')}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-green-600" />
                                Bem-estar e Estilo de Vida
                              </h3>
                              {getSectionIcon('bem-estar-feminino', expandedSections['bem-estar-feminino'])}
                            </button>
                            {(expandedSections['bem-estar-feminino'] !== false) && (
                              <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {avaliacaoNutricional.nivel_estresse && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                      <span className="text-sm text-slate-600">Nível de Estresse</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div className="font-semibold text-slate-900 text-lg">{avaliacaoNutricional.nivel_estresse}</div>
                                        <span className="text-sm text-slate-500">/10</span>
                                        <div className={`w-2 h-2 rounded-full ${
                                          avaliacaoNutricional.nivel_estresse <= 3 ? 'bg-green-500' :
                                          avaliacaoNutricional.nivel_estresse <= 6 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}></div>
                                      </div>
                                    </div>
                                  )}
                                  {avaliacaoNutricional.horas_sono && (
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                      <span className="text-sm text-slate-600">Horas de Sono</span>
                                      <div className="font-semibold text-slate-900 text-lg">{avaliacaoNutricional.horas_sono}h</div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {avaliacaoNutricional.pratica_exercicios !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                      <span className="font-medium text-slate-700">Pratica exercícios?</span>
                                      {getBooleanBadge(avaliacaoNutricional.pratica_exercicios)}
                                    </div>
                                  )}
                                  {avaliacaoNutricional.intestino_regular !== undefined && (
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                      <span className="font-medium text-slate-700">Intestino regular?</span>
                                      {getBooleanBadge(avaliacaoNutricional.intestino_regular)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        // Dados masculinos
                        <div className="space-y-6">
                          {/* Atividade e Horários */}
                          <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <button
                              onClick={() => toggleSection('atividade-rotina')}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-600" />
                                Atividade e Rotina
                              </h3>
                              {getSectionIcon('atividade-rotina', expandedSections['atividade-rotina'])}
                            </button>
                            {(expandedSections['atividade-rotina'] !== false) && (
                              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {avaliacaoNutricional.nivel_atividade && (
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">Nível de Atividade</span>
                                    <div className="font-semibold text-slate-900">{avaliacaoNutricional.nivel_atividade}</div>
                                  </div>
                                )}
                                {avaliacaoNutricional.consumo_agua && (
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">Consumo de Água</span>
                                    <div className="font-semibold text-slate-900">{avaliacaoNutricional.consumo_agua}L/dia</div>
                                  </div>
                                )}
                                {avaliacaoNutricional.qtd_refeicoes && (
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">Refeições por Dia</span>
                                    <div className="font-semibold text-slate-900">{avaliacaoNutricional.qtd_refeicoes}</div>
                                  </div>
                                )}
                                {avaliacaoNutricional.horario_acordar && (
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">Horário de Acordar</span>
                                    <div className="font-semibold text-slate-900">{avaliacaoNutricional.horario_acordar}</div>
                                  </div>
                                )}
                                {avaliacaoNutricional.horario_dormir && (
                                  <div className="p-3 bg-slate-50 rounded-lg">
                                    <span className="text-sm text-slate-600">Horário de Dormir</span>
                                    <div className="font-semibold text-slate-900">{avaliacaoNutricional.horario_dormir}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Restrições */}
                          <div className="bg-white rounded-xl border border-slate-200 p-6">
                            <button
                              onClick={() => toggleSection('restricoes-suplementos')}
                              className="w-full flex items-center justify-between text-left"
                            >
                              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                                Restrições e Suplementação
                              </h3>
                              {getSectionIcon('restricoes-suplementos', expandedSections['restricoes-suplementos'])}
                            </button>
                            {(expandedSections['restricoes-suplementos'] !== false) && (
                              <div className="mt-4 space-y-4">
                                {avaliacaoNutricional.restricao_alimentar && avaliacaoNutricional.restricao_alimentar.length > 0 && (
                                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertCircle className="w-4 h-4 text-red-600" />
                                      <span className="font-semibold text-red-800">Restrições Alimentares</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {avaliacaoNutricional.restricao_alimentar.map((restricao, index) => (
                                        <span key={index} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                          {restricao}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {avaliacaoNutricional.intolerancia_alimentar && avaliacaoNutricional.intolerancia_alimentar.length > 0 && (
                                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                                      <span className="font-semibold text-yellow-800">Intolerâncias Alimentares</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {avaliacaoNutricional.intolerancia_alimentar.map((intolerancia, index) => (
                                        <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                                          {intolerancia}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {avaliacaoNutricional.suplementacao && avaliacaoNutricional.suplementacao.length > 0 && (
                                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <span className="font-semibold text-green-800">Suplementos em Uso</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {avaliacaoNutricional.suplementacao.map((suplemento, index) => (
                                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                                          {suplemento}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Utensils className="w-8 h-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma avaliação nutricional encontrada</h4>
                      <p className="text-gray-600 max-w-md mx-auto">O cliente ainda não preencheu o formulário de avaliação nutricional. Solicite o preenchimento para obter informações detalhadas sobre hábitos alimentares e objetivos nutricionais.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab Fotos e Laudos */}
              {activeTab === 'fotos' && (
                <div className="space-y-6">
                  {/* Seção de Fotos */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-600" />
                        Fotos de Progresso
                      </h3>
                      <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                        fotosEnviadas === totalFotos
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {fotosEnviadas}/{totalFotos} fotos enviadas
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-xl mb-6 bg-blue-50 border border-blue-200">
                      <div className="flex items-center">
                        <Camera className="h-5 w-5 mr-3 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium mb-1 text-blue-800">
                            Fotos de Progresso - Não Obrigatórias
                          </p>
                          <p className="text-xs text-blue-700">
                            O envio de fotos não é obrigatório. Caso seja necessário, nossa equipe de suporte entrará em contato pelo WhatsApp para solicitar as fotos.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grid de Fotos */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fotos.map((foto) => (
                        <div
                          key={foto.id}
                          className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                            foto.uploaded
                              ? 'border-green-500 cursor-pointer hover:shadow-lg'
                              : 'border-gray-300 border-dashed'
                          }`}
                          onClick={() => foto.uploaded && setSelectedPhoto(foto.url!)}
                        >
                          {foto.uploaded ? (
                            <>
                              <img
                                src={foto.url}
                                alt={foto.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="h-6 w-6 text-green-500 bg-white rounded-full" />
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                              <Clock className="h-8 w-8 mb-2 text-gray-500" />
                              <p className="text-xs text-center px-2 text-gray-500">
                                Aguardando foto
                              </p>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-white/90">
                            <p className="text-xs font-medium truncate text-gray-900">
                              {foto.title}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seção de Laudos Médicos */}
                  <div className="bg-white rounded-xl border border-slate-200 p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                      <FileCheck className="w-5 h-5 text-green-600" />
                      Laudos Médicos
                    </h3>
                    
                    {laudos.length > 0 ? (
                      <div className="space-y-4">
                        {laudos.map((laudo) => (
                          <div 
                            key={laudo.id}
                            className={`p-4 rounded-xl border ${
                              laudo.aprovado_em
                                ? 'bg-green-50 border-green-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <FileCheck className={`h-8 w-8 mr-4 ${
                                  laudo.aprovado_em
                                    ? 'text-green-600'
                                    : 'text-yellow-600'
                                }`} />
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {laudo.tipo_documento || 'Laudo Médico'}
                                  </h4>
                                  <p className={`text-sm ${
                                    laudo.aprovado_em
                                      ? 'text-green-700'
                                      : 'text-yellow-700'
                                  }`}>
                                    {laudo.aprovado_em 
                                      ? 'Aprovado pela equipe médica' 
                                      : `Status: ${laudo.status || 'Em análise'}`}
                                  </p>
                                  {laudo.observacoes && (
                                    <p className="text-xs mt-1 text-gray-600">
                                      {laudo.observacoes}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-500 mt-1">
                                    Enviado em: {formatDate(laudo.created_at)}
                                  </p>
                                  {laudo.aprovado_em && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Aprovado em: {formatDate(laudo.aprovado_em)}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadLaudo(laudo.documento_url)}
                                className="p-3 rounded-xl transition-all duration-200 bg-blue-500 hover:bg-blue-600 text-white"
                                title="Visualizar documento"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                        <h4 className="font-semibold mb-2 text-gray-900">
                          Nenhum laudo enviado
                        </h4>
                        <p className="text-sm text-gray-600">
                          Laudos médicos enviados aparecerão aqui
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Análise Corporal */}
              {activeTab === 'corporal' && (
                <div className="space-y-6">
                  {analiseCorporalFormatada ? (
                    <ResultadosAnalise resultado={analiseCorporalFormatada} />
                  ) : (
                    <div className="text-center py-12">
                      {perfilFotos?.foto_lateral_url && perfilFotos?.foto_abertura_url ? (
                        <div>
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Brain className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma análise corporal encontrada</h4>
                          <p className="text-gray-600 max-w-md mx-auto">
                            O cliente ainda não possui análise corporal. As fotos estão disponíveis para processamento.
                          </p>
                        </div>
                      ) : (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                          <AlertTriangle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                          <h4 className="text-lg font-medium text-blue-900 mb-2">
                            Fotos não disponíveis
                          </h4>
                          <p className="text-blue-700 text-sm mb-4">
                            Para gerar a análise corporal, o cliente precisa enviar as fotos de abertura e lateral através do aplicativo.
                          </p>
                          <div className="text-blue-600 text-xs">
                            <strong>Status das fotos:</strong>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-2">
                                {perfilFotos?.foto_abertura_url ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span>Foto de abertura {perfilFotos?.foto_abertura_url ? 'disponível' : 'não enviada'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {perfilFotos?.foto_lateral_url ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-600" />
                                )}
                                <span>Foto lateral {perfilFotos?.foto_lateral_url ? 'disponível' : 'não enviada'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </>
          )}
        </div>

        {/* Modal para visualizar foto */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 cursor-pointer overflow-auto"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Botão de fechar - fixo no canto superior direito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="fixed top-6 right-6 z-20 p-3 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
              title="Fechar (ESC)"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Container principal centralizado */}
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="relative">
                <img
                  src={selectedPhoto}
                  alt="Foto ampliada"
                  className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] object-contain rounded-lg shadow-2xl cursor-default"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* Dica para fechar - fixo na parte inferior */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
              Clique fora da imagem ou pressione ESC para fechar
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
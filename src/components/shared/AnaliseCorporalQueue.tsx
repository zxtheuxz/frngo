import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Brain, 
  User, 
  Calendar, 
  Scale, 
  Ruler, 
  Target, 
  TrendingUp, 
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Plus,
  Camera,
  FileText,
  Zap
} from 'lucide-react';
import AnaliseCorpoMediaPipe from '../analise-corporal/AnaliseCorpoMediaPipe';
import ResultadosAnalise from '../analise-corporal/ResultadosAnalise';
import { normalizarAltura } from '../../utils/normalizarAltura';
import { 
  ResultadoAnalise,
  analisarComposicaoCorporal,
  classificarIndiceMassaMagra,
  classificarIndiceMassaGorda,
  classificarRazaoCinturaQuadril,
  classificarRazaoCinturaEstatura,
  classificarIndiceConicidade,
  classificarCintura,
  classificarQuadril
} from '../../utils/calculosComposicaoCorporal';

interface AnaliseCorpData {
  id: string;
  user_id: string;
  nome_completo: string;
  sexo: string;
  created_at: string;
  
  // Dados corporais básicos
  altura_usada: number;
  peso_usado: number;
  idade_calculada: number;
  imc: number;
  
  // Medidas corporais (cm)
  medida_bracos: number;
  medida_antebracos: number;
  medida_cintura: number;
  medida_quadril: number;
  medida_coxas: number;
  medida_panturrilhas: number;
  
  // Composição corporal
  percentual_gordura: number;
  massa_magra: number;
  massa_gorda: number;
  tmb: number;
  
  // Índices de risco
  razao_cintura_quadril: number;
  razao_cintura_estatura: number;
  indice_conicidade: number;
  shaped_score: number;
  
  calculado_automaticamente: boolean;
}

interface ClienteApto {
  user_id: string;
  nome_completo: string;
  sexo: string;
  foto_lateral_url: string;
  foto_abertura_url: string;
  altura: number;
  peso: number;
  data_avaliacao: string;
  tipo_avaliacao: 'masculino' | 'feminino';
}

interface MedidasExtraidas {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

interface AnaliseCorporalQueueProps {
  userRole?: 'preparador' | 'nutricionista' | 'admin';
}

export function AnaliseCorporalQueue({ userRole = 'preparador' }: AnaliseCorporalQueueProps) {
  const [analises, setAnalises] = useState<AnaliseCorpData[]>([]);
  const [clientesAptos, setClientesAptos] = useState<ClienteApto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseCorpData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteApto | null>(null);
  const [showAnaliseModal, setShowAnaliseModal] = useState(false);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalises();
  }, []);

  const fetchAnalises = async () => {
    try {
      setLoading(true);
      
      // Buscar análises existentes
      const { data: medidasData, error: medidasError } = await supabase
        .from('medidas_corporais')
        .select(`
          id,
          user_id,
          created_at,
          altura_usada,
          peso_usado,
          idade_calculada,
          imc,
          medida_bracos,
          medida_antebracos,
          medida_cintura,
          medida_quadril,
          medida_coxas,
          medida_panturrilhas,
          percentual_gordura,
          massa_magra,
          massa_gorda,
          tmb,
          razao_cintura_quadril,
          razao_cintura_estatura,
          indice_conicidade,
          shaped_score,
          calculado_automaticamente
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (medidasError) throw medidasError;

      // Buscar clientes aptos (sem análise) - lógica do ClientesAptosCorporal
      await buscarClientesAptos();

      // Buscar dados dos perfis das análises existentes
      const userIds = medidasData?.map(m => m.user_id) || [];
      if (userIds.length > 0) {
        const { data: perfisData, error: perfisError } = await supabase
          .from('perfis')
          .select('user_id, nome_completo, sexo')
          .in('user_id', userIds);

        if (perfisError) throw perfisError;

        // Criar map de perfis
        const perfisMap = new Map(perfisData?.map(p => [p.user_id, p]) || []);

        const formattedData = medidasData?.map(item => {
          const perfil = perfisMap.get(item.user_id);
          return {
            id: item.id,
            user_id: item.user_id,
            nome_completo: perfil?.nome_completo || 'Nome não disponível',
            sexo: perfil?.sexo || 'N/A',
            created_at: item.created_at,
            altura_usada: item.altura_usada,
            peso_usado: item.peso_usado,
            idade_calculada: item.idade_calculada,
            imc: item.imc,
            medida_bracos: item.medida_bracos,
            medida_antebracos: item.medida_antebracos,
            medida_cintura: item.medida_cintura,
            medida_quadril: item.medida_quadril,
            medida_coxas: item.medida_coxas,
            medida_panturrilhas: item.medida_panturrilhas,
            percentual_gordura: item.percentual_gordura,
            massa_magra: item.massa_magra,
            massa_gorda: item.massa_gorda,
            tmb: item.tmb,
            razao_cintura_quadril: item.razao_cintura_quadril,
            razao_cintura_estatura: item.razao_cintura_estatura,
            indice_conicidade: item.indice_conicidade,
            shaped_score: item.shaped_score,
            calculado_automaticamente: item.calculado_automaticamente
          };
        }) || [];

        setAnalises(formattedData);
      } else {
        setAnalises([]);
      }
    } catch (error) {
      console.error('🚨 Erro ao buscar análises corporais:', error);
      
      // Tratamento específico para diferentes tipos de erro
      if (error?.code === '406' || error?.code === 'PGRST116') {
        console.log('ℹ️ Nenhuma análise corporal encontrada ainda (erro 406/PGRST116)');
        setAnalises([]);
        setError(null); // Não mostrar erro para usuário
      } else if (error?.message?.includes('refresh token')) {
        console.warn('⚠️ Problema de autenticação, recarregue a página');
        setError('Problema de autenticação. Por favor, recarregue a página.');
      } else {
        setError('Erro ao carregar análises corporais. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const buscarClientesAptos = async () => {
    try {
      // Buscar perfis com fotos
      const { data: perfisComFotos, error: errorPerfis } = await supabase
        .from('perfis')
        .select('user_id, nome_completo, sexo, foto_lateral_url, foto_abertura_url')
        .not('foto_lateral_url', 'is', null)
        .not('foto_abertura_url', 'is', null);

      if (errorPerfis) throw errorPerfis;

      const userIdsComFotos = perfisComFotos?.map(p => p.user_id) || [];

      // Buscar clientes com formulário masculino
      const { data: clientesMasc, error: errorMasc } = await supabase
        .from('avaliacao_nutricional')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      // Buscar clientes com formulário feminino
      const { data: clientesFem, error: errorFem } = await supabase
        .from('avaliacao_nutricional_feminino')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      if (errorMasc) throw errorMasc;
      if (errorFem) throw errorFem;

      // Criar map de perfis para acesso rápido
      const perfisMap = new Map(perfisComFotos?.map(p => [p.user_id, p]) || []);

      // Combinar e formatar os dados
      const todosClientes: ClienteApto[] = [];

      if (clientesMasc) {
        clientesMasc.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'masculino'
            });
          }
        });
      }

      if (clientesFem) {
        clientesFem.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'feminino'
            });
          }
        });
      }

      // Remover duplicatas (caso tenha preenchido ambos os formulários)
      const clientesUnicos = todosClientes.reduce((acc, atual) => {
        const existe = acc.find(c => c.user_id === atual.user_id);
        if (!existe || new Date(atual.data_avaliacao) > new Date(existe.data_avaliacao)) {
          return [...acc.filter(c => c.user_id !== atual.user_id), atual];
        }
        return acc;
      }, [] as ClienteApto[]);

      // Verificar quais já têm análise corporal gerada
      const userIds = clientesUnicos.map(c => c.user_id);
      const { data: analisesExistentes } = await supabase
        .from('medidas_corporais')
        .select('user_id')
        .in('user_id', userIds);

      const idsComAnalise = new Set(analisesExistentes?.map(a => a.user_id) || []);
      const clientesSemAnalise = clientesUnicos.filter(c => !idsComAnalise.has(c.user_id));

      setClientesAptos(clientesSemAnalise);
    } catch (error) {
      console.error('Erro ao buscar clientes aptos:', error);
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

  const getIMCClassification = (imc: number) => {
    if (imc < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600 bg-blue-100' };
    if (imc < 25) return { label: 'Peso normal', color: 'text-green-600 bg-green-100' };
    if (imc < 30) return { label: 'Sobrepeso', color: 'text-yellow-600 bg-yellow-100' };
    if (imc < 35) return { label: 'Obesidade I', color: 'text-orange-600 bg-orange-100' };
    if (imc < 40) return { label: 'Obesidade II', color: 'text-red-600 bg-red-100' };
    return { label: 'Obesidade III', color: 'text-red-800 bg-red-200' };
  };

  const getRiskLevel = (value: number, thresholds: { low: number; medium: number; high: number }) => {
    if (value <= thresholds.low) return { label: 'Baixo', color: 'text-green-600 bg-green-100' };
    if (value <= thresholds.medium) return { label: 'Moderado', color: 'text-yellow-600 bg-yellow-100' };
    if (value <= thresholds.high) return { label: 'Alto', color: 'text-orange-600 bg-orange-100' };
    return { label: 'Muito Alto', color: 'text-red-600 bg-red-100' };
  };

  const handleViewDetails = (analise: AnaliseCorpData) => {
    setSelectedAnalise(analise);
    setShowModal(true);
  };

  const handleGerarAnalise = (cliente: ClienteApto) => {
    setClienteSelecionado(cliente);
    setShowAnaliseModal(true);
  };

  // 🎯 SISTEMA UNIFICADO v11.7 - Usa mesma lógica do cliente
  const handleMedidasExtraidas = async (medidas: MedidasExtraidas) => {
    if (!clienteSelecionado) return;

    try {
      setProcessando(clienteSelecionado.user_id);
      console.log('🚀 Staff: Processando análise corporal v11.7 unificada para:', clienteSelecionado.nome_completo);

      // Buscar dados completos do perfil para calcular idade
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('data_nascimento')
        .eq('user_id', clienteSelecionado.user_id)
        .single();

      // Calcular idade (mesmo método do Edge Function)
      let idade = 30; // Default seguro
      if (perfilData?.data_nascimento) {
        const nascimento = new Date(perfilData.data_nascimento);
        const hoje = new Date();
        idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
          idade--;
        }
      }

      // Preparar dados do perfil (formato padronizado)
      const dadosCorporais = {
        altura: clienteSelecionado.altura,
        peso: clienteSelecionado.peso,
        idade,
        sexo: clienteSelecionado.sexo === 'masculino' ? 'M' as const : 'F' as const
      };

      console.log('📊 Staff: Dados corporais preparados:', dadosCorporais);
      console.log('📏 Staff: Medidas extraídas:', medidas);

      // 🎯 USAR SISTEMA UNIFICADO: analisarComposicaoCorporal (mesma função do cliente)
      const resultado = analisarComposicaoCorporal(medidas, dadosCorporais);
      
      console.log('✅ Staff: Análise completa realizada:', {
        composicao: resultado.composicao,
        indices: resultado.indices.indiceGrimaldi
      });

      // Salvar com mesma estrutura do cliente
      const { error: insertError } = await supabase
        .from('medidas_corporais')
        .insert({
          user_id: clienteSelecionado.user_id,
          
          // Medidas extraídas
          medida_bracos: medidas.bracos,
          medida_antebracos: medidas.antebracos,
          medida_cintura: medidas.cintura,
          medida_quadril: medidas.quadril,
          medida_coxas: medidas.coxas,
          medida_panturrilhas: medidas.panturrilhas,
          
          // Composição corporal (sistema unificado)
          percentual_gordura: resultado.composicao.percentualGordura,
          massa_magra: resultado.composicao.massaMagra,
          massa_gorda: resultado.composicao.massaGorda,
          tmb: resultado.composicao.tmb,
          imc: resultado.composicao.imc,
          
          // Índices de risco (valores numéricos)
          razao_cintura_quadril: resultado.indices.razaoCinturaQuadril.valor,
          razao_cintura_estatura: resultado.indices.razaoCinturaEstatura.valor,
          indice_conicidade: resultado.indices.indiceConicidade.valor,
          shaped_score: resultado.indices.indiceGrimaldi, // Índice Grimaldi correto
          
          // Metadados
          altura_usada: dadosCorporais.altura,
          peso_usado: dadosCorporais.peso,
          idade_calculada: dadosCorporais.idade,
          sexo_usado: dadosCorporais.sexo,
          calculado_automaticamente: true
        });

      if (insertError) throw insertError;

      console.log('💾 Staff: Resultados salvos com sucesso no banco');
      
      // Atualizar listas
      await fetchAnalises();
      setShowAnaliseModal(false);
      setClienteSelecionado(null);
      
    } catch (error) {
      console.error('❌ Staff: Erro ao salvar análise:', error);
      setError('Erro ao salvar análise corporal');
    } finally {
      setProcessando(null);
    }
  };

  const handleError = (errorMsg: string) => {
    console.error('Erro na análise:', errorMsg);
    setError(errorMsg);
    setProcessando(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando análises corporais...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (analises.length === 0 && clientesAptos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 max-w-md mx-auto">
          <AlertTriangle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Nenhum cliente com fotos disponível
          </h3>
          <p className="text-blue-700 text-sm mb-4">
            Para gerar análises corporais, os clientes precisam enviar as fotos de abertura e lateral através do aplicativo.
          </p>
          <div className="text-blue-600 text-xs">
            <strong>O que está faltando:</strong>
            <div className="mt-2 space-y-1 text-left">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Clientes devem enviar foto de abertura (frontal)</span>
              </div>
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Clientes devem enviar foto lateral (perfil)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Formulário nutricional deve estar preenchido</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Análises Corporais Disponíveis</h3>
          <p className="text-sm text-slate-600">Análises automáticas processadas pelo sistema</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{analises.length} análises processadas</span>
          </div>
          {clientesAptos.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{clientesAptos.length} clientes aptos</span>
            </div>
          )}
        </div>
      </div>

      {/* Lista de análises */}
      <div className="grid gap-4">
        {/* Clientes sem análise - mostrar primeiro */}
        {clientesAptos.map((cliente) => (
          <div
            key={`cliente-${cliente.user_id}`}
            className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Cabeçalho do card */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-yellow-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{cliente.nome_completo}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(cliente.data_avaliacao)}
                      </span>
                      <span className="capitalize">{cliente.sexo}</span>
                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                        Apto para análise
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dados básicos */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Ruler className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600 uppercase">Altura</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {(cliente.altura * 100).toFixed(0)} cm
                    </span>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Scale className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600 uppercase">Peso</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {cliente.peso.toFixed(1)} kg
                    </span>
                  </div>

                  <div className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-slate-600" />
                      <span className="text-xs font-medium text-slate-600 uppercase">IMC</span>
                    </div>
                    <span className="text-lg font-semibold text-slate-900">
                      {(cliente.peso / (cliente.altura * cliente.altura)).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">Fotos:</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    Lateral e frontal enviadas
                  </span>
                </div>
              </div>

              {/* Botão de ação */}
              <div className="flex flex-col gap-2 ml-4">
                <button
                  onClick={() => handleGerarAnalise(cliente)}
                  disabled={processando === cliente.user_id}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {processando === cliente.user_id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Gerar Análise
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Análises existentes */}
        {analises.map((analise) => {
          const imcClass = getIMCClassification(analise.imc);
          
          return (
            <div
              key={analise.id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Cabeçalho do card */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{analise.nome_completo}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(analise.created_at)}
                        </span>
                        <span className="capitalize">{analise.sexo}</span>
                        <span>{analise.idade_calculada} anos</span>
                      </div>
                    </div>
                  </div>

                  {/* Dados principais */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Ruler className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">Altura</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {(analise.altura_usada * 100).toFixed(0)} cm
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Scale className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">Peso</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {analise.peso_usado.toFixed(1)} kg
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">IMC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-semibold text-slate-900">
                          {analise.imc.toFixed(1)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${imcClass.color}`}>
                          {imcClass.label}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="w-4 h-4 text-slate-600" />
                        <span className="text-xs font-medium text-slate-600 uppercase">% Gordura</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        {analise.percentual_gordura.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Indicadores de risco */}
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-600">Cintura/Quadril:</span>
                    <span className="font-medium">{analise.razao_cintura_quadril.toFixed(2)}</span>
                    
                    <span className="text-slate-600 ml-4">TMB:</span>
                    <span className="font-medium">{analise.tmb.toFixed(0)} kcal</span>
                    
                    {analise.calculado_automaticamente && (
                      <span className="ml-auto flex items-center gap-1 text-blue-600 text-xs">
                        <Brain className="w-3 h-3" />
                        Automático
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(analise)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Detalhes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de detalhes */}
      {showModal && selectedAnalise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header fixo */}
            <div className="p-6 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      Análise Corporal Completa
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                      <span className="font-semibold">{selectedAnalise.nome_completo}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(selectedAnalise.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-4 h-4" />
                        {selectedAnalise.idade_calculada} anos
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Corpo com scroll */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {/* Usar o componente ResultadosAnalise com os dados da análise selecionada */}
                {(() => {
                  // Calcular valores dos índices
                  const indiceMassaMagra = selectedAnalise.massa_magra / Math.pow(selectedAnalise.altura_usada, 2);
                  const indiceMassaGorda = selectedAnalise.massa_gorda / Math.pow(selectedAnalise.altura_usada, 2);
                  const sexo = selectedAnalise.sexo as 'M' | 'F';
                  
                  // Classificar todos os indicadores usando as funções importadas
                  const classIMM = classificarIndiceMassaMagra(indiceMassaMagra, sexo);
                  const classIMG = classificarIndiceMassaGorda(indiceMassaGorda);
                  const classRCQ = classificarRazaoCinturaQuadril(selectedAnalise.razao_cintura_quadril, sexo);
                  const classRCE = classificarRazaoCinturaEstatura(selectedAnalise.razao_cintura_estatura);
                  const classIC = classificarIndiceConicidade(selectedAnalise.indice_conicidade);
                  const classCintura = classificarCintura(selectedAnalise.medida_cintura, sexo);
                  const classQuadril = classificarQuadril(selectedAnalise.medida_quadril, sexo);
                  
                  return (
                    <ResultadosAnalise 
                      resultado={{
                        composicao: {
                          percentualGordura: selectedAnalise.percentual_gordura,
                          massaGorda: selectedAnalise.massa_gorda,
                          massaMagra: selectedAnalise.massa_magra,
                          tmb: selectedAnalise.tmb,
                          imc: selectedAnalise.imc,
                          aguaCorporal: selectedAnalise.massa_magra * 0.723,
                          aguaCorporalPercentual: (selectedAnalise.massa_magra * 0.723 / selectedAnalise.peso_usado) * 100
                        },
                        indices: {
                          indiceGrimaldi: selectedAnalise.shaped_score,
                          razaoCinturaQuadril: {
                            valor: selectedAnalise.razao_cintura_quadril,
                            faixa: classRCQ.faixa,
                            descricao: classRCQ.descricao
                          },
                          razaoCinturaEstatura: {
                            valor: selectedAnalise.razao_cintura_estatura,
                            faixa: classRCE.faixa,
                            descricao: classRCE.descricao
                          },
                          indiceConicidade: {
                            valor: selectedAnalise.indice_conicidade,
                            faixa: classIC.faixa,
                            descricao: classIC.descricao
                          },
                          indiceMassaMagra: {
                            valor: indiceMassaMagra,
                            faixa: classIMM.faixa,
                            descricao: classIMM.descricao
                          },
                          indiceMassaGorda: {
                            valor: indiceMassaGorda,
                            faixa: classIMG.faixa,
                            descricao: classIMG.descricao
                          },
                          cintura: {
                            valor: selectedAnalise.medida_cintura,
                            faixa: classCintura.faixa,
                            descricao: classCintura.descricao
                          },
                          quadril: {
                            valor: selectedAnalise.medida_quadril,
                            faixa: classQuadril.faixa,
                            descricao: classQuadril.descricao
                          }
                        },
                    medidas: {
                      bracos: selectedAnalise.medida_bracos,
                      antebracos: selectedAnalise.medida_antebracos,
                      cintura: selectedAnalise.medida_cintura,
                      quadril: selectedAnalise.medida_quadril,
                      coxas: selectedAnalise.medida_coxas,
                      panturrilhas: selectedAnalise.medida_panturrilhas
                    },
                        perfil: {
                          altura: selectedAnalise.altura_usada,
                          peso: selectedAnalise.peso_usado,
                          idade: selectedAnalise.idade_calculada,
                          sexo: selectedAnalise.sexo as 'M' | 'F'
                        }
                      }}
                    />
                  );
                })()}

                {/* Informações adicionais para admin */}
                <div className="mt-8 p-6 bg-slate-50 rounded-lg">
                  <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Informações Administrativas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">ID do usuário</p>
                      <p className="font-mono text-sm">{selectedAnalise.user_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">ID da análise</p>
                      <p className="font-mono text-sm">{selectedAnalise.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Processamento</p>
                      <p className="flex items-center gap-1 text-sm">
                        {selectedAnalise.calculado_automaticamente ? (
                          <><Zap className="w-4 h-4 text-blue-600" /> Automático (MediaPipe)</>
                        ) : (
                          <><User className="w-4 h-4 text-gray-600" /> Manual</>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Data/Hora</p>
                      <p className="text-sm">{formatDate(selectedAnalise.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de análise corporal */}
      {showAnaliseModal && clienteSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">
                    Gerar Análise Corporal
                  </h3>
                  <p className="text-slate-600">{clienteSelecionado.nome_completo}</p>
                </div>
                <button
                  onClick={() => setShowAnaliseModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {(() => {
                // Determinar sexo correto: usar sexo do perfil, não o tipo_avaliacao
                const sexoReal = clienteSelecionado.sexo?.toLowerCase();
                const sexoFinal = sexoReal === 'masculino' || sexoReal === 'm' ? 'M' : 'F';
                
                console.log(`🔍 Debug Sexo - Cliente: ${clienteSelecionado.nome_completo}`);
                console.log(`📋 Sexo do perfil: "${clienteSelecionado.sexo}"`);
                console.log(`📊 Tipo avaliação: "${clienteSelecionado.tipo_avaliacao}"`);
                console.log(`✅ Sexo final usado: "${sexoFinal}"`);
                
                return (
                  <AnaliseCorpoMediaPipe
                    fotoLateralUrl={clienteSelecionado.foto_lateral_url}
                    fotoAberturaUrl={clienteSelecionado.foto_abertura_url}
                    alturaReal={clienteSelecionado.altura}
                    peso={clienteSelecionado.peso}
                    sexo={sexoFinal}
                    onMedidasExtraidas={handleMedidasExtraidas}
                    onError={handleError}
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Loader2,
  Info,
  FileText,
  Camera,
  CheckCircle,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useActivityLoggerContext } from '../providers/ActivityLoggerProvider';
import MedidasCorporais from '../components/analise-corporal/MedidasCorporais';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { useAnaliseCorpData } from '../hooks/useAnaliseCorpData';

export const AnaliseCorporal = React.memo(function AnaliseCorporal() {
  const [user, setUser] = useState<User | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const activityLogger = useActivityLoggerContext();
  const hasLoadedRef = useRef(false);
  
  // Hook para dados da análise corporal com validações
  const { 
    dadosCorporais, 
    fotos, 
    loading, 
    error: dataError, 
    liberado,
    refetch,
    clearCache
  } = useAnaliseCorpData();
  
  // Hook de visibilidade para prevenir re-fetching
  usePageVisibility({
    preventRefetchOnFocus: true
  });

  // Verificar requisitos para acesso à análise com memoização
  const statusRequisitos = React.useMemo(() => {
    if (loading || !user) return null;
    
    const requisitos = {
      dadosCorporais: !!dadosCorporais,
      fotosCompletas: !!(fotos?.foto_lateral_url && fotos?.foto_abertura_url),
      liberado: liberado === true
    };
    
    const requisitosAtendidos = Object.values(requisitos).every(r => r);
    
    // Debug temporário para diagnóstico
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Debug verificarRequisitos:', {
        dadosCorporais: !!dadosCorporais,
        fotos: fotos,
        foto_lateral_url: fotos?.foto_lateral_url,
        foto_abertura_url: fotos?.foto_abertura_url,
        fotosCompletas: !!(fotos?.foto_lateral_url && fotos?.foto_abertura_url),
        liberado: liberado,
        requisitosAtendidos,
        dataError
      });
    }
    
    return {
      ...requisitos,
      todos: requisitosAtendidos,
      erro: dataError
    };
  }, [loading, user, dadosCorporais, fotos, liberado, dataError]);

  useEffect(() => {
    async function loadAnalysisPage() {
      // Se já carregou uma vez, não recarregar
      if (hasLoadedRef.current) {
        return;
      }
      
      try {
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Registrar acesso à página
          try {
            await activityLogger.logPageVisit('Página de Análise Corporal', '/analise-corporal');
          } catch (error) {
            console.error('Erro ao registrar acesso à página de análise corporal:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar página de análise:', error);
        setPageError('Erro ao verificar sua sessão.');
      } finally {
        hasLoadedRef.current = true;
      }
    }

    loadAnalysisPage();
  }, [navigate, activityLogger]);


  if (loading || !user) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin rounded-full h-12 w-12 text-purple-500" />
            <span className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Carregando dados da análise corporal...
            </span>
          </div>
        </div>
      </Layout>
    );
  }

  if (pageError) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className={`text-center max-w-md p-6 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          } border`}>
            <AlertTriangle className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <h2 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Erro
            </h2>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {pageError}
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Verificar se todos os requisitos estão atendidos
  if (statusRequisitos && !statusRequisitos.todos) {
    return (
      <Layout>
        <div className={`min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        } px-4 py-8`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className={`p-4 rounded-2xl mb-6 w-fit mx-auto ${
                isDarkMode ? 'bg-orange-900/30' : 'bg-orange-100'
              }`}>
                <Brain className={`h-12 w-12 ${
                  isDarkMode ? 'text-orange-400' : 'text-orange-600'
                }`} />
              </div>
              <h1 className={`text-4xl font-bold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Análise Corporal
              </h1>
              <p className={`text-lg ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Para acessar sua análise corporal, você precisa completar alguns requisitos
              </p>
            </div>

            {/* Status dos Requisitos */}
            <div className={`p-8 rounded-2xl shadow-lg border mb-8 ${
              isDarkMode 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-2xl font-bold mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Requisitos para Análise
              </h2>

              <div className="space-y-4">
                {/* Avaliação Nutricional */}
                <div className={`flex items-center p-4 rounded-xl border ${
                  statusRequisitos.dadosCorporais
                    ? isDarkMode 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-green-50 border-green-200'
                    : isDarkMode 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className={`p-3 rounded-xl mr-4 ${
                    statusRequisitos.dadosCorporais
                      ? isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {statusRequisitos.dadosCorporais ? (
                      <CheckCircle className={`h-6 w-6 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <FileText className={`h-6 w-6 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Avaliação Nutricional
                    </h3>
                    <p className={`text-sm ${
                      statusRequisitos.dadosCorporais
                        ? isDarkMode ? 'text-green-200' : 'text-green-700'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {statusRequisitos.dadosCorporais 
                        ? 'Formulário preenchido com sucesso' 
                        : 'Preencha o formulário de avaliação nutricional'}
                    </p>
                  </div>
                  {!statusRequisitos.dadosCorporais && (
                    <button
                      onClick={() => navigate('/avaliacoes')}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      Preencher
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>

                {/* Fotos */}
                <div className={`flex items-center p-4 rounded-xl border ${
                  statusRequisitos.fotosCompletas
                    ? isDarkMode 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-green-50 border-green-200'
                    : isDarkMode 
                      ? 'bg-gray-800 border-gray-600' 
                      : 'bg-gray-50 border-gray-300'
                }`}>
                  <div className={`p-3 rounded-xl mr-4 ${
                    statusRequisitos.fotosCompletas
                      ? isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                      : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {statusRequisitos.fotosCompletas ? (
                      <CheckCircle className={`h-6 w-6 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <Camera className={`h-6 w-6 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Fotos Corporais
                    </h3>
                    <p className={`text-sm ${
                      statusRequisitos.fotosCompletas
                        ? isDarkMode ? 'text-green-200' : 'text-green-700'
                        : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {statusRequisitos.fotosCompletas 
                        ? 'Fotos lateral e de abertura enviadas' 
                        : 'Envie as fotos lateral e de abertura'}
                    </p>
                  </div>
                  {!statusRequisitos.fotosCompletas && (
                    <button
                      onClick={() => navigate('/fotos')}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        isDarkMode 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }`}
                    >
                      Enviar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </button>
                  )}
                </div>

                {/* Status de Liberação */}
                <div className={`flex items-center p-4 rounded-xl border ${
                  statusRequisitos.liberado
                    ? isDarkMode 
                      ? 'bg-green-900/20 border-green-500/30' 
                      : 'bg-green-50 border-green-200'
                    : isDarkMode 
                      ? 'bg-yellow-900/20 border-yellow-500/30' 
                      : 'bg-yellow-50 border-yellow-300'
                }`}>
                  <div className={`p-3 rounded-xl mr-4 ${
                    statusRequisitos.liberado
                      ? isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                      : isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                  }`}>
                    {statusRequisitos.liberado ? (
                      <CheckCircle className={`h-6 w-6 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                    ) : (
                      <UserCheck className={`h-6 w-6 ${
                        isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Aprovação da Equipe
                    </h3>
                    <p className={`text-sm ${
                      statusRequisitos.liberado
                        ? isDarkMode ? 'text-green-200' : 'text-green-700'
                        : isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                    }`}>
                      {statusRequisitos.liberado 
                        ? 'Seu perfil foi aprovado pela equipe' 
                        : 'Aguardando aprovação da equipe técnica'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="mt-8 pt-6 border-t border-gray-300 dark:border-gray-600 space-y-3">
                {/* Botão debug temporário - só em desenvolvimento */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    onClick={() => {
                      console.log('🔄 Forçando atualização dos dados...');
                      clearCache();
                      refetch();
                    }}
                    className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                  >
                    🔄 Atualizar Dados (Debug)
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                  }`}
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>

            {/* Mostrar erro APENAS se for técnico (não por requisito faltante) */}
            {statusRequisitos.erro && !statusRequisitos.erro.includes('não encontrados') && (
              <div className={`p-4 rounded-xl border mb-6 ${
                isDarkMode 
                  ? 'bg-red-900/20 border-red-500/30' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  <AlertTriangle className={`h-5 w-5 mr-3 ${
                    isDarkMode ? 'text-red-400' : 'text-red-600'
                  }`} />
                  <p className={`text-sm ${
                    isDarkMode ? 'text-red-200' : 'text-red-700'
                  }`}>
                    {statusRequisitos.erro}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      } px-4 py-8`}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`p-3 rounded-2xl mr-4 ${
                isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
              }`}>
                <Brain className={`h-8 w-8 ${
                  isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <div>
                <h1 className={`text-4xl font-bold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Análise Corporal
                </h1>
                <p className={`text-lg ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Análise automatizada de composição corporal
                </p>
              </div>
            </div>

            {/* Informações sobre a análise */}
            <div className={`p-6 rounded-2xl border mb-6 ${
              isDarkMode 
                ? 'bg-blue-900/20 border-blue-500/30' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start">
                <Info className={`h-6 w-6 mr-4 mt-1 flex-shrink-0 ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <div>
                  <h3 className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? 'text-blue-200' : 'text-blue-800'
                  }`}>
                    Como funciona a análise corporal?
                  </h3>
                  <div className={`text-sm space-y-2 ${
                    isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    <p>
                      • <strong>Extração de medidas:</strong> Utilizamos tecnologia avançada para extrair medidas corporais precisas das suas fotos
                    </p>
                    <p>
                      • <strong>Cálculos científicos:</strong> Aplicamos fórmulas validadas científicamente para determinar composição corporal
                    </p>
                    <p>
                      • <strong>Análise de risco:</strong> Avaliamos indicadores de risco cardiometabólico baseados em evidências médicas
                    </p>
                    <p>
                      • <strong>Resultados visuais:</strong> Apresentamos os dados de forma clara com escalas coloridas e explicações detalhadas
                    </p>
                    
                    <div className={`mt-4 p-3 rounded-lg border-l-4 ${
                      isDarkMode 
                        ? 'bg-yellow-900/20 border-yellow-500/50' 
                        : 'bg-yellow-50 border-yellow-400'
                    }`}>
                      <p className={`text-sm ${
                        isDarkMode ? 'text-yellow-200' : 'text-yellow-800'
                      }`}>
                        <strong>⚠️ Importante:</strong> O sistema de análise automatizada pode apresentar uma margem de variação de 0 a 5cm nas medidas corporais. Os resultados são estimativas baseadas em algoritmos avançados e devem ser considerados como referência orientativa.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de recursos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  <Activity className={`h-6 w-6 ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Composição Corporal
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Percentual de gordura, massa magra, TMB e outros indicadores essenciais
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-yellow-900/30' : 'bg-yellow-100'
                }`}>
                  <TrendingUp className={`h-6 w-6 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Escalas de Risco
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Avaliação de risco cardiometabólico com base em parâmetros científicos
                </p>
              </div>

              <div className={`p-6 rounded-2xl border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
                <div className={`p-3 rounded-xl mb-4 w-fit ${
                  isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Brain className={`h-6 w-6 ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Tecnologia Avançada
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Sistema automatizado para extração precisa de medidas corporais
                </p>
              </div>
            </div>
          </div>

          {/* Componente principal de análise */}
          <div className={`p-6 rounded-2xl shadow-lg border ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <MedidasCorporais />
          </div>
        </div>
      </div>
    </Layout>
  );
});
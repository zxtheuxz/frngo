import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Scale, ArrowLeft, Loader2, Clock, Sun, Moon, FileText, Activity, Heart, Play, X, Calendar, TrendingUp, Award, Bell, User, BarChart3, Lock } from 'lucide-react';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { extrairNomeExercicio, encontrarVideoDoExercicio } from '../utils/exercicios';
import { BotaoMetodoTreino } from '../components/BotaoMetodoTreino';
import { formatarMetodoPDF, encontrarMetodoTreino } from '../utils/metodosTreino';
import { ProgramacaoCard } from '../components/ProgramacaoCard';

// Design limpo e profissional
const themeStyles = {
  light: {
    background: "bg-gray-50",
    text: "text-gray-900",
    textSecondary: "text-gray-600",
    card: "bg-white shadow-sm border border-gray-200",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonSecondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
    input: "bg-white border border-gray-300 focus:border-blue-500",
    scrollbar: {
      track: "bg-gray-100",
      thumb: "bg-gray-400 hover:bg-gray-500"
    }
  },
  dark: {
    background: "bg-gray-900",
    text: "text-white",
    textSecondary: "text-gray-300",
    card: "bg-gray-800 border border-gray-700",
    button: "bg-blue-600 hover:bg-blue-700 text-white",
    buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
    input: "bg-gray-800 border border-gray-600 focus:border-blue-400",
    scrollbar: {
      track: "bg-gray-800",
      thumb: "bg-gray-600 hover:bg-gray-500"
    }
  }
};

// Estilos básicos sem animações
const animationStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: var(--scrollbar-track);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--scrollbar-thumb);
    border-radius: 3px;
  }
`;

// Interface para os exercícios
interface Exercicio {
  numero: string;
  nome: string;
  series: string;
  repeticoes: string;
}

// Interface para o treino
interface Treino {
  letra: string;
  descricao: string;
  titulo: string;
  exercicios: Exercicio[];
}

interface Perfil {
  liberado: string; // 'sim' ou 'nao'
  resultado_fisica: string; // Texto com o resultado da avaliação física
  resultado_nutricional: string; // Texto com o resultado da avaliação nutricional
  nome?: string; // Optional nome
  nome_completo?: string;
  user_id?: string; // ID do usuário no Supabase
}

// Componente Modal de Vídeo
const VideoModal = ({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  // Extrair o ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*$/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeVideoId(videoUrl);
  
  // Log para debug
  console.log("Abrindo vídeo modal com URL:", videoUrl);
  console.log("ID do vídeo extraído:", videoId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={(e) => {
      // Fechar o modal quando clicar fora do container do vídeo
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-1"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="relative pt-[56.25%]">
          {videoId ? (
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-white flex-col p-6">
              <div className="text-center mb-4">Erro ao carregar o vídeo</div>
              <div className="text-sm text-gray-400 text-center">URL inválida ou não suportada: {videoUrl}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export function Resultados() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [ultimaAvaliacao, setUltimaAvaliacao] = useState<string | null>(null);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  // Aplicar estilos de animação
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = animationStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Atualize o estilo da scrollbar dinamicamente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        ${themeStyle.scrollbar.track};
        border-radius: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        ${themeStyle.scrollbar.thumb};
        border-radius: 8px;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isDarkMode]);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        setCarregando(true);
        
        if (!id) {
          console.log('ID não fornecido na URL, buscando perfil do usuário logado');
          
          // Obter o usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Usuário não autenticado');
            setCarregando(false);
            return;
          }
          
          // Buscar o perfil do usuário logado
          const { data: perfilUsuario, error: perfilError } = await supabase
            .from('perfis')
            .select('*, nome_completo')
            .eq('user_id', user.id)
            .single();
            
          if (perfilError) {
            console.error('Erro ao buscar perfil do usuário:', perfilError);
            setCarregando(false);
            return;
          }
          
          console.log('Dados do perfil do usuário logado:', perfilUsuario);
          
          if (!perfilUsuario) {
            console.error('Nenhum perfil encontrado para o usuário logado');
            setCarregando(false);
            return;
          }
          
          console.log('Campo liberado:', perfilUsuario.liberado, typeof perfilUsuario.liberado);
          
          // Verificar se o campo liberado é 'sim' (case insensitive)
          const liberado = typeof perfilUsuario.liberado === 'string' && 
                          perfilUsuario.liberado.toLowerCase() === 'sim';
          
          console.log('Perfil liberado?', liberado);
          
          setPerfil(perfilUsuario);
          setPerfilLiberado(liberado);
          setCarregando(false);
          return;
        }
        
        console.log('Buscando perfil com ID:', id);
        
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }
        
        console.log('Dados do perfil recebidos:', data);
        
        if (!data) {
          console.error('Nenhum dado de perfil encontrado');
          setCarregando(false);
          return;
        }
        
        console.log('Campo liberado:', data.liberado, typeof data.liberado);
        
        // Verificar se o campo liberado é 'sim' (case insensitive)
        const liberado = typeof data.liberado === 'string' && 
                        data.liberado.toLowerCase() === 'sim';
        
        console.log('Perfil liberado?', liberado);
        
        setPerfil(data);
        setPerfilLiberado(liberado);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        alert('Erro ao carregar os dados. Por favor, tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    buscarPerfil();
  }, [id]);

  // Dados de progresso
  useEffect(() => {
    if (perfil) {
      // Data será mostrada como "Não realizada" até implementação futura
    }
  }, [perfil]);

  // Função para extrair observações personalizadas
  const extrairObservacoesPersonalizadas = (conteudo: string): string | null => {
    // Procurar o índice do primeiro "TREINO" no conteúdo
    const regexPrimeiroTreino = /TREINO\s+[A-Z]/i;
    const matchPrimeiroTreino = conteudo.match(regexPrimeiroTreino);
    
    if (matchPrimeiroTreino && matchPrimeiroTreino.index && matchPrimeiroTreino.index > 0) {
      // Extrair todo o texto antes do primeiro treino
      const observacoes = conteudo.substring(0, matchPrimeiroTreino.index).trim();
      
      // Retornar apenas se houver conteúdo significativo
      if (observacoes.length > 0) {
        return observacoes;
      }
    }
    
    return null;
  };

  // Função memoizada para buscar vídeos (simplificada para Resultados.tsx)
  const encontrarVideoDoExercicioMemoizado = React.useCallback((nomeExercicio: string, dispositivo: 'APP' | 'WEB' | 'PDF' = 'PDF') => {
    return encontrarVideoDoExercicio(nomeExercicio);
  }, []);

  // Função para processar conteúdo de treino
  const processarConteudoTreino = (conteudo: string) => {
    try {
      // Extrair observações localmente
      let conteudoParaProcessar = conteudo;
      const indexPrimeiroTreino = conteudo.search(/TREINO\s+[A-Z]/i);
      
      if (indexPrimeiroTreino > 0) {
        // Se há texto antes do primeiro treino, remover para processar apenas os treinos
        conteudoParaProcessar = conteudo.substring(indexPrimeiroTreino);
      }
      
      const linhas = conteudoParaProcessar.split('\n').filter(linha => linha.trim().length > 0);
      
      const treinos: Treino[] = [];
      let treinoAtual: Treino | null = null;
      
      // Regex melhorado para capturar treino e mês
      const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]:\s*|\s+)(.+)?/i;
      const regexExercicio = /^(\d+)\s*[-–—]\s*(.+)/i;
      
      // Processar cada linha
      for (const linha of linhas) {
        const linhaTrimmed = linha.trim();
        
        // Detectar início de novo treino
        const matchTreino = linhaTrimmed.match(regexTreino);
        if (matchTreino) {
          // Salvar treino anterior se existir
          if (treinoAtual && treinoAtual.exercicios.length > 0) {
            treinos.push(treinoAtual);
          }
          
          // Criar novo treino
          treinoAtual = {
            letra: matchTreino[1],
            descricao: matchTreino[2] || '',
            titulo: linhaTrimmed,
            exercicios: []
          };
          continue;
        }
        
        // Se estamos processando um treino
        if (treinoAtual) {
          // Verificar se é um exercício numerado
          const matchExercicio = linha.match(regexExercicio);
          
          if (matchExercicio) {
            const numero = matchExercicio[1];
            const nomeCompleto = matchExercicio[2].trim();
            
            // Extrair séries e repetições (código existente)
            const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)/;
            const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
            
            let nome = nomeCompleto;
            let series = '';
            let repeticoes = '';
            
            // Verificar se o exercício já contém informações sobre séries e repetições
            if (matchSeriesReps) {
              // Remover a parte de séries/reps do nome
              nome = nomeCompleto.replace(matchSeriesReps[0], '').trim();
              series = matchSeriesReps[1] + 'x';
              repeticoes = matchSeriesReps[2];
            } else {
              // Tentar encontrar padrões específicos como "3 X 12 (CADA LADO)"
              const regexEspecial = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)\s*\(([^)]+)\)/;
              const matchEspecial = nomeCompleto.match(regexEspecial);
              
              if (matchEspecial) {
                nome = nomeCompleto.replace(matchEspecial[0], '').trim() + ' (' + matchEspecial[3] + ')';
                series = matchEspecial[1] + 'x';
                repeticoes = matchEspecial[2];
              }
            }
            
            // Adicionar à lista de exercícios, usando valores padrão se necessário
            treinoAtual.exercicios.push({
              numero,
              nome,
              series: series || '3x', // Valor padrão
              repeticoes: repeticoes || '12/10/8' // Valor padrão
            });
          }
        }
      }
      
      // Adicionar o último treino se existir
      if (treinoAtual) {
        treinos.push(treinoAtual);
      }
      
      return treinos;
    } catch (error) {
      console.error('Erro ao processar ficha de treino:', error);
      return [];
    }
  };

  

  // Função genérica para renderizar resultados
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado disponível ainda.</div>;
    }

    // Verificar se o conteúdo parece ser um planejamento alimentar
    const pareceSerPlanejamentoAlimentar = conteudo.includes('Planejamento alimentar') || 
                                           conteudo.includes('Café da manhã') ||
                                           conteudo.includes('Almoço') ||
                                           conteudo.includes('Jantar') ||
                                           conteudo.includes('kcal') ||
                                           conteudo.includes('Colação') ||
                                           conteudo.includes('Ceia');
    
    // Se parece ser um planejamento alimentar, renderizar como plano alimentar
    if (pareceSerPlanejamentoAlimentar) {
      try {
        // Código para renderizar plano alimentar
        // ...
        return <div>Renderização do plano alimentar</div>;
      } catch (error) {
        console.error('Erro ao processar plano alimentar:', error);
        // Em caso de erro, renderizar como texto simples
        return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
      }
    }
    
    // Caso contrário, renderizar como texto simples
    return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
  };



  // Loading state
  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      </Layout>
    );
  }

  // Renderização principal
  return (
    <Layout>
      <div className={`min-h-screen ${themeStyle.background} p-4 md:p-8`}>
                  {/* Header */}
        <div className="mb-8">
          <div className={`${themeStyle.card} rounded-lg p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center`}>
                  <User className={`w-6 h-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                </div>
                <div>
                  <h1 className={`text-xl sm:text-2xl font-semibold ${themeStyle.text}`}>
                    Olá, {perfil?.nome_completo || 'Usuário'}
                  </h1>
                  <p className={`${themeStyle.textSecondary} text-sm`}>
                    Acesse suas programações
                  </p>
                </div>
              </div>
              
              <div className={`mt-4 sm:mt-0 px-3 py-1.5 rounded-full text-xs font-medium self-start sm:self-center ${ 
                perfilLiberado 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
              }`}>
                {perfilLiberado ? 'Ativo' : 'Aguardando liberação'}
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>2</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>Programações</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>PDF</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>Downloads</div>
              </div>
              <div className={`text-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className={`text-2xl font-bold ${themeStyle.text}`}>24.5</div>
                <div className={`text-sm ${themeStyle.textSecondary}`}>IMC Objetivo</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de programação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProgramacaoCard
            title="Programação Física"
            icon={<Activity className="w-5 h-5 text-white" />}
            isLiberado={perfilLiberado}
            ultimaAvaliacao={ultimaAvaliacao}
            onView={() => {
              if (perfilLiberado) {
                navigate(`/resultado-fisico${id ? `?id=${id}` : ''}`);
              } else {
                alert('Sua programação física ainda está sendo preparada. Aguarde a liberação do administrador.');
              }
            }}
            themeStyle={themeStyle}
            buttonClass={`${themeStyle.button}`}
            buttonSecondaryClass={`${themeStyle.buttonSecondary}`}
            hasContent={!!perfil?.resultado_fisica}
          />
          
          <ProgramacaoCard
            title="Programação Nutricional"
            icon={<Heart className="w-5 h-5 text-white" />}
            isLiberado={perfilLiberado}
            ultimaAvaliacao={ultimaAvaliacao}
            onView={() => {
              if (perfilLiberado) {
                navigate(`/resultado-nutricional${id ? `?id=${id}` : ''}`);
              } else {
                alert('Sua programação nutricional ainda está sendo preparada. Aguarde a liberação do administrador.');
              }
            }}
            themeStyle={themeStyle}
            buttonClass="bg-orange-600 hover:bg-orange-700 text-white"
            buttonSecondaryClass="bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:hover:bg-orange-900/50 dark:text-orange-300"
            hasContent={!!perfil?.resultado_nutricional}
          />
        </div>

        {/* Dicas úteis */}
        <div className={`${themeStyle.card} rounded-lg p-6 mb-8`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center`}>
              <Bell className="w-4 h-4 text-white" />
            </div>
            <h3 className={`text-lg font-semibold ${themeStyle.text}`}>Dicas Importantes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-blue-500`}>
              <h4 className={`font-medium text-blue-600 dark:text-blue-400 text-sm mb-2`}>Hidratação</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>Mantenha-se hidratado com pelo menos 2L de água diariamente</p>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-purple-500`}>
              <h4 className={`font-medium text-purple-600 dark:text-purple-400 text-sm mb-2`}>Descanso</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>8 horas de sono para otimizar sua recuperação</p>
            </div>
            
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} border-l-4 border-orange-500`}>
              <h4 className={`font-medium text-orange-600 dark:text-orange-400 text-sm mb-2`}>Alimentação</h4>
              <p className={`text-sm ${themeStyle.textSecondary}`}>Refeições regulares a cada 3 horas</p>
            </div>
          </div>
        </div>


        {videoModalUrl && (
          <VideoModal
            videoUrl={videoModalUrl}
            onClose={() => setVideoModalUrl(null)}
          />
        )}
      </div>
    </Layout>
  );
} 
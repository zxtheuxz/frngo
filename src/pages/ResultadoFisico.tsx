import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { jsPDF } from 'jspdf';
import { Play, Download, ArrowLeft, BarChart3, Filter, TrendingUp, Calendar, Activity, Target, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import BotaoMetodoTreino from '../components/BotaoMetodoTreino';
import { encontrarVideoDoExercicio as encontrarVideoUtils } from '../utils/exercicios';
import { formatarMetodoPDF, encontrarMetodoTreino } from '../utils/metodosTreino';

// Definição do objeto themeStyles que faltava
const themeStyles = {
  light: {
    scrollbar: {
      track: 'background-color: #f1f1f1',
      thumb: 'background-color: #c1c1c1'
    }
  },
  dark: {
    scrollbar: {
      track: 'background-color: #2e2e2e',
      thumb: 'background-color: #555'
    }
  }
};

interface Exercicio {
  numero: string;
  nome: string;
  series: string;
  repeticoes: string;
  grupoMuscular?: string;
  volume?: number;
  intensidade?: 'baixa' | 'media' | 'alta';
}

interface Treino {
  letra: string;
  descricao: string;
  titulo: string;
  exercicios: Exercicio[];
  mes?: number;
  semana?: number;
}

interface TreinoPorMes {
  mes: number;
  treinos: Treino[];
  volumeTotal: number;
  intensidadeMedia: string;
  frequenciaSemanal: number;
}

interface Perfil {
  liberado: string; // 'sim' ou 'nao'
  resultado_fisica: string; // Texto com o resultado da programação física
  nome?: string; // Optional nome
  nome_completo?: string;
}

interface DadosFisicos {
  objetivo?: string;
  tempo_inativo?: string;
  experiencia_musculacao?: string;
  disponibilidade_semanal?: number | string;
}

type OrdenacaoTipo = 'padrao' | 'alfabetica' | 'volume' | 'intensidade';
type FiltroGrupoMuscular = '' | 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'core';

// Componente para exibir o modal de vídeo (memoizado)
const VideoModal = React.memo(({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  // Cache do ID do vídeo extraído
  const [videoId, setVideoId] = useState<string | null>(null);
  
  // Extrair ID apenas uma vez quando o URL mudar
  useEffect(() => {
    const getYoutubeVideoId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };
    
    setVideoId(getYoutubeVideoId(videoUrl));
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden w-full max-w-3xl">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Vídeo Demonstrativo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="w-full aspect-video">
          {videoId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
              <p className="text-gray-600 dark:text-gray-300">Vídeo não disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export function ResultadoFisico() {
  const navigate = useNavigate();
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  
  // Novos estados para memoização
  const [treinosProcessados, setTreinosProcessados] = useState<Treino[]>([]);
  const [ehFichaTreino, setEhFichaTreino] = useState<boolean>(false);
  const videoUrlCache = React.useRef(new Map<string, string | null>());
  
  // Novo estado para mensagens de carregamento sequenciais
  const [mensagemCarregamento, setMensagemCarregamento] = useState<string>('Buscando informações do seu Perfil');
  const [primeiroCarregamento, setPrimeiroCarregamento] = useState<boolean>(true);
  
  // Adicionar o novo estado
  const [dadosFisicos, setDadosFisicos] = useState<DadosFisicos | null>(null);
  
  // Novos estados para as funcionalidades melhoradas
  const [mesSelecionado, setMesSelecionado] = useState(1);
  const [mostrarComparacao, setMostrarComparacao] = useState(false);
  const [filtroGrupoMuscular, setFiltroGrupoMuscular] = useState<FiltroGrupoMuscular>('');
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>('padrao');
  const [treinosPorMes, setTreinosPorMes] = useState<TreinoPorMes[]>([]);
  const [visualizacao, setVisualizacao] = useState<'lista' | 'cards'>('cards');
  
  // Estados para controlar as animações de ajuda
  const [mostrarAnimacoesMeses, setMostrarAnimacoesMeses] = useState(true);
  const [mostrarAnimacaoNutricional, setMostrarAnimacaoNutricional] = useState(true);
  
  // Estado para observações personalizadas
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState<string | null>(null);
  const [observacoesExpandidas, setObservacoesExpandidas] = useState<boolean>(true);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  // Adicionar useEffect para limpar o cache da sessão
  useEffect(() => {
    console.log('[ResultadoFisico] Componente montado, limpando caches');
    // Limpar o cache da sessão na inicialização da página
    sessionStorage.clear();
  }, []);

  // Funções auxiliares para as novas funcionalidades
  const identificarGrupoMuscular = (nomeExercicio: string): string => {
    const nome = nomeExercicio.toLowerCase();
    
    if (nome.includes('supino') || nome.includes('peito') || nome.includes('peitoral') || 
        nome.includes('flexão') || nome.includes('crucifixo') || nome.includes('fly')) {
      return 'peito';
    }
    if (nome.includes('puxada') || nome.includes('remada') || nome.includes('costas') || 
        nome.includes('dorsal') || nome.includes('pulley') || nome.includes('barra fixa')) {
      return 'costas';
    }
    if (nome.includes('agachamento') || nome.includes('leg') || nome.includes('quadríceps') || 
        nome.includes('posterior') || nome.includes('glúteo') || nome.includes('panturrilha') ||
        nome.includes('coxa') || nome.includes('stiff')) {
      return 'pernas';
    }
    if (nome.includes('desenvolvimento') || nome.includes('ombro') || nome.includes('elevação') || 
        nome.includes('lateral') || nome.includes('frontal') || nome.includes('posterior de ombro')) {
      return 'ombros';
    }
    if (nome.includes('bíceps') || nome.includes('tríceps') || nome.includes('rosca') || 
        nome.includes('martelo') || nome.includes('testa') || nome.includes('francês')) {
      return 'bracos';
    }
    if (nome.includes('abdominal') || nome.includes('prancha') || nome.includes('core') || 
        nome.includes('oblíquo') || nome.includes('lombar')) {
      return 'core';
    }
    
    return 'outros';
  };

  const calcularVolumeExercicio = (series: string, repeticoes: string): number => {
    const numSeries = parseInt(series.replace(/[^\d]/g, '')) || 3;
    const numRepeticoes = parseInt(repeticoes.split(/[\/\-x]/)[0]) || 12;
    return numSeries * numRepeticoes;
  };

  const determinarIntensidade = (repeticoes: string): 'baixa' | 'media' | 'alta' => {
    const numRepeticoes = parseInt(repeticoes.split(/[\/\-x]/)[0]) || 12;
    
    if (numRepeticoes <= 6) return 'alta';
    if (numRepeticoes <= 12) return 'media';
    return 'baixa';
  };

  const processarTreinosComMetadados = (treinos: Treino[]): Treino[] => {
    return treinos.map(treino => ({
      ...treino,
      exercicios: treino.exercicios.map(exercicio => ({
        ...exercicio,
        grupoMuscular: identificarGrupoMuscular(exercicio.nome),
        volume: calcularVolumeExercicio(exercicio.series, exercicio.repeticoes),
        intensidade: determinarIntensidade(exercicio.repeticoes)
      }))
    }));
  };

  const organizarTreinosPorMes = (treinos: Treino[]): TreinoPorMes[] => {
    // Agrupar treinos por mês baseado no mês extraído da descrição
    const treinosPorMesMap = new Map<number, Treino[]>();
    
    treinos.forEach(treino => {
      const mes = treino.mes || 1; // Use o mês extraído ou default para 1
      
      if (!treinosPorMesMap.has(mes)) {
        treinosPorMesMap.set(mes, []);
      }
      
      // Adicionar metadados aos exercícios
      const treinoComMetadados = {
        ...treino,
        exercicios: treino.exercicios.map(exercicio => ({
          ...exercicio,
          grupoMuscular: identificarGrupoMuscular(exercicio.nome),
          volume: calcularVolumeExercicio(exercicio.series, exercicio.repeticoes),
          intensidade: determinarIntensidade(exercicio.repeticoes)
        }))
      };
      
      treinosPorMesMap.get(mes)!.push(treinoComMetadados);
    });
    
    // Converter para array de TreinoPorMes
    const treinosPorMesArray: TreinoPorMes[] = [];
    
    // Ordenar os meses (1, 2, 3...)
    const mesesOrdenados = Array.from(treinosPorMesMap.keys()).sort();
    
    mesesOrdenados.forEach(mes => {
      const treinosDoMes = treinosPorMesMap.get(mes)!;
      
      const volumeTotal = treinosDoMes.reduce((total, treino) => 
        total + treino.exercicios.reduce((subTotal, exercicio) => 
          subTotal + (exercicio.volume || 0), 0), 0);
      
      // Determinar intensidade média baseada no mês
      let intensidadeMedia = 'Média';
      if (mes === 1) intensidadeMedia = 'Baixa';
      else if (mes === 2) intensidadeMedia = 'Média';
      else if (mes === 3) intensidadeMedia = 'Alta';
      
      treinosPorMesArray.push({
        mes,
        treinos: treinosDoMes,
        volumeTotal,
        intensidadeMedia,
        frequenciaSemanal: typeof dadosFisicos?.disponibilidade_semanal === 'number' 
          ? dadosFisicos.disponibilidade_semanal 
          : parseInt(String(dadosFisicos?.disponibilidade_semanal)) || 3
      });
    });
    
    return treinosPorMesArray;
  };

  const filtrarExerciciosPorGrupo = (exercicios: Exercicio[], grupo: FiltroGrupoMuscular): Exercicio[] => {
    if (!grupo) return exercicios;
    return exercicios.filter(exercicio => exercicio.grupoMuscular === grupo);
  };

  const ordenarExercicios = (exercicios: Exercicio[], criterio: OrdenacaoTipo): Exercicio[] => {
    const exerciciosOrdenados = [...exercicios];
    
    switch (criterio) {
      case 'alfabetica':
        return exerciciosOrdenados.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'volume':
        return exerciciosOrdenados.sort((a, b) => (b.volume || 0) - (a.volume || 0));
      case 'intensidade':
        const intensidadeOrdem = { 'alta': 3, 'media': 2, 'baixa': 1 };
        return exerciciosOrdenados.sort((a, b) => 
          (intensidadeOrdem[b.intensidade || 'media']) - (intensidadeOrdem[a.intensidade || 'media']));
      default:
        return exerciciosOrdenados;
    }
  };

  // Memoizar os treinos filtrados e ordenados do mês selecionado
  const treinosDoMesFiltrados = useMemo(() => {
    const mesData = treinosPorMes.find(m => m.mes === mesSelecionado);
    if (!mesData) {
      return [];
    }

    return mesData.treinos.map(treino => ({
      ...treino,
      exercicios: ordenarExercicios(
        filtrarExerciciosPorGrupo(treino.exercicios, filtroGrupoMuscular),
        ordenacao
      )
    })).filter(treino => treino.exercicios.length > 0); // Remover treinos sem exercícios após filtro
  }, [treinosPorMes, mesSelecionado, filtroGrupoMuscular, ordenacao]);

  const calcularEstatisticasDoMes = (mes: number) => {
    const mesData = treinosPorMes.find(m => m.mes === mes);
    if (!mesData) return { volumeTotal: 0, intensidadeMedia: 'Média', frequenciaSemanal: 3 };
    
    return {
      volumeTotal: mesData.volumeTotal,
      intensidadeMedia: mesData.intensidadeMedia,
      frequenciaSemanal: mesData.frequenciaSemanal
    };
  };

  // Atualize o estilo da scrollbar dinamicamente
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        ${themeStyle.scrollbar.track};
        border-radius: 10px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        ${themeStyle.scrollbar.thumb};
        border-radius: 10px;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, [isDarkMode]);

  // Efeito para mensagens de carregamento sequenciais
  useEffect(() => {
    if (!carregando || !primeiroCarregamento) return;

    const mensagens = [
      'Buscando informações do seu Perfil',
      'Buscando Programação Personalizada',
      'Compilando dados de treino',
      'Carregando Vídeos',
      'Pronto feito, fique à vontade seu FRANGO!'
    ];

    let index = 0;

    const intervalId = setInterval(() => {
      if (index < mensagens.length - 1) {
        setMensagemCarregamento(mensagens[index]);
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 1200);

    return () => clearInterval(intervalId);
  }, [carregando, primeiroCarregamento]);

  useEffect(() => {
    const buscarPerfil = async () => {
      try {
        setCarregando(true);
        
        // Definir primeira mensagem de carregamento
        setMensagemCarregamento('Buscando informações do seu Perfil');
        
        if (!id) {
          console.log('ID não fornecido na URL, buscando perfil do usuário logado');
          
          // Obter o usuário logado
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) {
            console.error('Usuário não autenticado');
            setCarregando(false);
            return;
          }
          
          // Aguardar um tempo para a primeira mensagem ser exibida
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Buscando Programação Personalizada');
          
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
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Compilando dados de treino');
          
          console.log('Dados do perfil do usuário logado:', perfilUsuario);
          
          if (!perfilUsuario) {
            console.error('Nenhum perfil encontrado para o usuário logado');
            setCarregando(false);
            return;
          }
          
          // Verificar se o campo liberado é 'sim' (case insensitive)
          const liberado = typeof perfilUsuario.liberado === 'string' && 
                          perfilUsuario.liberado.toLowerCase() === 'sim';
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Carregando Vídeos');
          
          setPerfil(perfilUsuario);
          setPerfilLiberado(liberado);
          
          // Buscar dados da avaliação física
          const { data: dadosAvaliacao, error: avaliacaoError } = await supabase
            .from('avaliacao_fisica')
            .select('objetivo, tempo_inativo, experiencia_musculacao, disponibilidade_semanal')
            .eq('user_id', user.id)
            .single();
            
          if (!avaliacaoError && dadosAvaliacao) {
            setDadosFisicos(dadosAvaliacao);
          }
          
          // Aguardar um pouco mais para mostrar a última mensagem
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Pronto feito, fique à vontade seu FRANGO!');
          
          // Finalizar carregamento após exibir a última mensagem
          await new Promise(resolve => setTimeout(resolve, 1500));
          setCarregando(false);
          setPrimeiroCarregamento(false);
          return;
        }
        
        // Código similar para quando um ID é fornecido
        console.log('Buscando perfil com ID:', id);
        
        // Aguardar um tempo para a primeira mensagem ser exibida
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Buscando Programação Personalizada');
        
        const { data, error } = await supabase
          .from('perfis')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Erro ao buscar perfil:', error);
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Compilando dados de treino');
        
        console.log('Dados do perfil recebidos:', data);
        
        if (!data) {
          console.error('Nenhum dado de perfil encontrado');
          setCarregando(false);
          return;
        }
        
        // Verificar se o campo liberado é 'sim' (case insensitive)
        const liberado = typeof data.liberado === 'string' && 
                        data.liberado.toLowerCase() === 'sim';
        
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Carregando Vídeos');
        
        setPerfil(data);
        setPerfilLiberado(liberado);
        
        // Buscar dados da avaliação física
        const { data: dadosAvaliacao, error: avaliacaoError } = await supabase
          .from('avaliacao_fisica')
          .select('objetivo, tempo_inativo, experiencia_musculacao, disponibilidade_semanal')
          .eq('user_id', data.user_id) // Assumimos que temos user_id na tabela perfis
          .single();
          
        if (!avaliacaoError && dadosAvaliacao) {
          setDadosFisicos(dadosAvaliacao);
        }
        
        // Aguardar um pouco mais para mostrar a última mensagem
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Pronto feito, fique à vontade seu FRANGO!');
        
        // Finalizar carregamento após exibir a última mensagem
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCarregando(false);
        setPrimeiroCarregamento(false);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        setCarregando(false);
        setPrimeiroCarregamento(false);
        alert('Erro ao carregar os dados. Por favor, tente novamente.');
      }
    };

    buscarPerfil();
  }, [id]);

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

  // Processamento único dos dados quando o perfil muda
  useEffect(() => {
    if (perfil?.resultado_fisica) {
      const conteudo = perfil.resultado_fisica;
      
      // Verificar se parece ser uma ficha de treino (buscar em qualquer lugar do conteúdo)
      const pareceSerFichaDeTreino = /TREINO\s+[A-Z]/i.test(conteudo) || 
                                     conteudo.includes('exercício') ||
                                     conteudo.includes('exercicio') ||
                                     conteudo.includes('séries') ||
                                     conteudo.includes('series') ||
                                     /\d+\s*[-–—]\s*\w+.*\d+\s*[xX×]\s*\d+/i.test(conteudo);
      
      setEhFichaTreino(pareceSerFichaDeTreino);
      
      // Extrair observações personalizadas se for ficha de treino
      if (pareceSerFichaDeTreino) {
        const observacoes = extrairObservacoesPersonalizadas(conteudo);
        setObservacoesPersonalizadas(observacoes);
      }
      
      if (pareceSerFichaDeTreino) {
        // Processar o conteúdo uma única vez
        const processarConteudoTreino = () => {
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
            const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]\s*|\s+)(.+)?/i;
            const regexExercicio = /^(\d+)\s*[-–—]\s*(.+)/i;
            
            for (let i = 0; i < linhas.length; i++) {
              const linha = linhas[i].trim();
              
              // Verificar se é uma linha de treino
              const matchTreino = linha.match(regexTreino);
              
              if (matchTreino) {
                // Se já temos um treino atual, adicionar ao array
                if (treinoAtual) {
                  treinos.push(treinoAtual);
                }
                
                const descricaoCompleta = matchTreino[2] || '';
                
                // Extrair o mês da descrição usando regex para parênteses
                let mes = 1; // Default
                const regexMes = /\((.*?mês.*?)\)/i;
                const matchMes = descricaoCompleta.match(regexMes);
                
                if (matchMes) {
                  const textoMes = matchMes[1].toLowerCase();
                  if (textoMes.includes('primeiro') || textoMes.includes('1')) {
                    mes = 1;
                  } else if (textoMes.includes('segundo') || textoMes.includes('2')) {
                    mes = 2;
                  } else if (textoMes.includes('terceiro') || textoMes.includes('3')) {
                    mes = 3;
                  }
                }
                
                // console.log(`Processando treino: ${linha}, Mês extraído: ${mes}`);
                
                // Criar novo treino
                treinoAtual = {
                  letra: matchTreino[1], // A, B, C, etc.
                  descricao: descricaoCompleta,
                  titulo: linha,
                  exercicios: [],
                  mes: mes // Adicionar o mês extraído
                };
                continue;
              }
              
              // Se estamos em um treino, verificar se é um exercício ou cabeçalho
              if (treinoAtual) {
                // Verificar se contém "Séries" (provavelmente cabeçalho)
                if (linha.includes('Séries') || linha.includes('Rep.')) {
                  continue; // Pular esta linha
                }
                
                // Verificar se é um exercício numerado
                const matchExercicio = linha.match(regexExercicio);
                
                if (matchExercicio) {
                  const numero = matchExercicio[1];
                  const nomeCompleto = matchExercicio[2].trim();
                  
                  // Extrair séries e repetições (código existente)
                  // ... 
                  
                  // Copie aqui toda a lógica existente de extração de séries e repetições
                  const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9\/]+(?:\s*a\s*\d+)?)/;
                  const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
                  
                  let nome = nomeCompleto;
                  let series = '';
                  let repeticoes = '';
                  
                  // O resto do código de processamento...
                  // Copie exatamente o código que já existe para processamento
                
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
                  
                  // Verificar séries e repetições na próxima linha e demais verificações
                  // (copie todo o código existente para essas verificações)
                  
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
        
        const treinos = processarConteudoTreino();
        setTreinosProcessados(treinos);
      }
    }
  }, [perfil?.resultado_fisica, id]);

  // Organizar treinos por mês quando os treinos processados mudarem
  useEffect(() => {
    if (treinosProcessados.length > 0) {
      const treinosPorMesOrganizados = organizarTreinosPorMes(treinosProcessados);
      setTreinosPorMes(treinosPorMesOrganizados);
      
      // Definir o mês inicial baseado no que está disponível
      if (treinosPorMesOrganizados.length > 0) {
        setMesSelecionado(1);
      }
    }
  }, [treinosProcessados, dadosFisicos]);

  // Timer para esconder as animações após alguns segundos
  useEffect(() => {
    if (!carregando && perfilLiberado && perfil?.resultado_fisica) {
      // Esconder animação dos meses após 8 segundos
      const timerMeses = setTimeout(() => {
        setMostrarAnimacoesMeses(false);
      }, 8000);

      // Esconder animação nutricional após 6 segundos
      const timerNutricional = setTimeout(() => {
        setMostrarAnimacaoNutricional(false);
      }, 6000);

      return () => {
        clearTimeout(timerMeses);
        clearTimeout(timerNutricional);
      };
    }
  }, [carregando, perfilLiberado, perfil?.resultado_fisica]);

  // Modificar a função encontrarVideoDoExercicioMemoizado para salvar no localStorage após a primeira busca
  const encontrarVideoDoExercicioMemoizado = React.useCallback((nomeExercicio: string, dispositivo: 'APP' | 'WEB' | 'PDF' = 'WEB') => {
    console.log(`[ResultadoFisico] Buscando vídeo para: "${nomeExercicio}"`);
    const cacheKey = `video_${nomeExercicio.trim()}_${dispositivo}`;
    
    // Verificar se já temos o URL no cache da sessão atual
    const cachedResult = sessionStorage.getItem(cacheKey);
    if (cachedResult) {
      console.log(`[ResultadoFisico] Retornando do cache da sessão: ${cachedResult}`);
      return cachedResult === "null" ? null : cachedResult;
    }
    
    // Verificar se já temos o URL no cache da referência
    if (videoUrlCache.current.has(cacheKey)) {
      const result = videoUrlCache.current.get(cacheKey);
      console.log(`[ResultadoFisico] Retornando do cache da referência: ${result}`);
      return result;
    }
    
    // Se não tiver no cache, buscar o URL
    console.log(`[ResultadoFisico] Não encontrado em cache, buscando o URL do vídeo`);
    const videoUrl = encontrarVideoUtils(nomeExercicio, dispositivo);
    
    // Atualizar os caches
    videoUrlCache.current.set(cacheKey, videoUrl);
    try {
      sessionStorage.setItem(cacheKey, videoUrl || "null");
    } catch (error) {
      console.error('[ResultadoFisico] Erro ao salvar no cache:', error);
    }
    
    return videoUrl;
  }, []);

  // Função para gerar PDF da programação física
  const gerarPDF = async () => {
    console.log('Iniciando geração do PDF físico...');
    
    if (!perfil) {
      console.error('Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_fisica;
    
    if (!conteudo) {
      console.error('Conteúdo físico não disponível');
      alert('Não há resultado de programação física disponível para gerar o PDF');
      return;
    }
    
    try {
      setGerandoPDF(true);
      
      console.log('Conteúdo encontrado, tamanho:', conteudo.length);
      console.log('Iniciando criação do documento PDF...');
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      console.log('Documento PDF criado com sucesso');
      
      // Definições de margens e dimensões
      const margemEsquerda = 10;
      const margemDireita = 10;
      const margemSuperior = 20;
      const margemInferior = 10;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      console.log('Configurações do documento:', { 
        margemEsquerda, 
        margemDireita, 
        margemSuperior, 
        margemInferior, 
        larguraUtil,
        larguraPagina: doc.internal.pageSize.width,
        alturaPagina: doc.internal.pageSize.height
      });
      
      // Variáveis de controle de página e posição
      let paginaAtual = 1;
      let posicaoY = margemSuperior + 5;
      
      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pagina: number) => {
        // Retângulo roxo do cabeçalho
        doc.setFillColor(147, 51, 234); // Roxo #9333EA
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // Texto branco
        doc.text('PROGRAMAÇÃO FÍSICA', doc.internal.pageSize.width / 2, 13, { align: 'center' });
        
        // Data e nome do cliente
        const dataAtual = new Date().toLocaleDateString('pt-BR');
        const nomeCliente = perfil?.nome_completo || perfil?.nome || 'Usuário';
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0); // Texto preto
        doc.text(`Cliente: ${nomeCliente}`, margemEsquerda, 28);
        doc.text(`Data: ${dataAtual}`, doc.internal.pageSize.width - margemDireita, 28, { align: 'right' });
      };
      
      // Função para adicionar rodapé
      const adicionarRodape = (pagina: number, totalPaginas: number) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Página ${pagina} de ${totalPaginas}`, 
          doc.internal.pageSize.width / 2, 
          doc.internal.pageSize.height - 10, 
          { align: 'center' }
        );
      };
      
      // Adicionar primeira página
      adicionarCabecalho(paginaAtual);
      
      // Verificar se parece ser uma ficha de treino
      const pareceSerFichaDeTreino = conteudo.includes('TREINO A') || 
                                     conteudo.includes('TREINO B') || 
                                     conteudo.toLowerCase().includes('treino a') ||
                                     conteudo.toLowerCase().includes('treino b') ||
                                     conteudo.includes('exercício') ||
                                     conteudo.includes('exercicio') ||
                                     conteudo.includes('séries') ||
                                     conteudo.includes('series');
      
      console.log('Parece ser ficha de treino?', pareceSerFichaDeTreino);
      
      if (pareceSerFichaDeTreino) {
            // Renderizar os treinos no PDF
            console.log('Renderizando treinos no PDF...');
            doc.setTextColor(0, 0, 0); // Texto preto
            
            // Calcular total de páginas (estimativa)
        const totalPaginas = Math.ceil(treinosProcessados.length / 2) + 1;
            
            // Processar cada treino
        for (let t = 0; t < treinosProcessados.length; t++) {
          const treino = treinosProcessados[t];
              
              // Verificar se precisamos de uma nova página
              if (posicaoY > (doc.internal.pageSize.height - margemInferior - 30)) {
                adicionarRodape(paginaAtual, totalPaginas);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }
              
              // Título do treino com borda arredondada
              doc.setFillColor(147, 51, 234); // Roxo #9333EA
              doc.roundedRect(margemEsquerda, posicaoY, larguraUtil, 10, 1, 1, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10); // Tamanho um pouco maior para o título
              doc.setTextColor(255, 255, 255); // Texto branco para o título do treino
              doc.text(`TREINO ${treino.letra}${treino.descricao ? ': ' + treino.descricao : ''}`, 
                      margemEsquerda + 3, 
                      posicaoY + 7);
              
              posicaoY += 12;
              
              // Cabeçalho da tabela - com fundo preto como na imagem
              doc.setFillColor(0, 0, 0); // Fundo preto
              doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.55, 6, 'F'); // Exercício (55% da largura)
              doc.rect(margemEsquerda + larguraUtil * 0.55, posicaoY, larguraUtil * 0.12, 6, 'F'); // Séries (12%)
              doc.rect(margemEsquerda + larguraUtil * 0.67, posicaoY, larguraUtil * 0.15, 6, 'F'); // Repetições (15%)
              doc.rect(margemEsquerda + larguraUtil * 0.82, posicaoY, larguraUtil * 0.18, 6, 'F'); // Vídeo (18%)
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9); // Padronizando tamanho da fonte
              doc.setTextColor(255, 255, 255); // Texto branco
              doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
              doc.text('Séries', margemEsquerda + larguraUtil * 0.61, posicaoY + 4, { align: 'center' });
              doc.text('Repetições', margemEsquerda + larguraUtil * 0.745, posicaoY + 4, { align: 'center' });
              doc.text('Vídeo', margemEsquerda + larguraUtil * 0.91, posicaoY + 4, { align: 'center' });
              
              posicaoY += 8;
              
              // Exercícios
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 0);
              
              for (const exercicio of treino.exercicios) {
                // Verificar espaço necessário para o exercício
                const alturaExercicio = 8;
                
                // Verificar se precisamos de uma nova página
                if (posicaoY + alturaExercicio > (doc.internal.pageSize.height - margemInferior - 10)) {
                  adicionarRodape(paginaAtual, totalPaginas);
                  doc.addPage();
                  paginaAtual++;
                  adicionarCabecalho(paginaAtual);
                  posicaoY = margemSuperior + 5;
                  
                  // Redesenhar o cabeçalho da tabela na nova página - com fundo preto
                  doc.setFillColor(0, 0, 0); // Fundo preto
                  doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.55, 6, 'F'); // Exercício (55% da largura)
                  doc.rect(margemEsquerda + larguraUtil * 0.55, posicaoY, larguraUtil * 0.12, 6, 'F'); // Séries (12%)
                  doc.rect(margemEsquerda + larguraUtil * 0.67, posicaoY, larguraUtil * 0.15, 6, 'F'); // Repetições (15%)
                  doc.rect(margemEsquerda + larguraUtil * 0.82, posicaoY, larguraUtil * 0.18, 6, 'F'); // Vídeo (18%)
                  
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9); // Padronizando tamanho da fonte
                  doc.setTextColor(255, 255, 255); // Texto branco
                  doc.text('Exercício', margemEsquerda + 2, posicaoY + 4);
                  doc.text('Séries', margemEsquerda + larguraUtil * 0.61, posicaoY + 4, { align: 'center' });
                  doc.text('Repetições', margemEsquerda + larguraUtil * 0.745, posicaoY + 4, { align: 'center' });
                  doc.text('Vídeo', margemEsquerda + larguraUtil * 0.91, posicaoY + 4, { align: 'center' });
                  
                  posicaoY += 8;
                }
                
                // Linhas alternadas com fundo branco e cinza claro
            if ((treinosProcessados.indexOf(treino) % 2) === 0) {
                  doc.setFillColor(245, 245, 245);
                } else {
                  doc.setFillColor(255, 255, 255);
                }
                doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaExercicio, 'F');
                
                // Nome do exercício - Não remover qualquer menção ao método do nome do exercício
                const nomeExercicioLimpo = exercicio.nome
                  .replace(/^\d+\s*[-–—]\s*/, '') // Remover apenas o número de exercício se houver
                  .trim();
                
                // Formatar número e nome do exercício
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9); // Padronizando tamanho
                
                // Limitar o texto do exercício para não ultrapassar a coluna
                const textoExercicio = `${exercicio.numero} - ${nomeExercicioLimpo}`;
                const textoTruncado = doc.splitTextToSize(textoExercicio, larguraUtil * 0.52)[0];
                doc.text(textoTruncado, margemEsquerda + 2, posicaoY + alturaExercicio/2 + 1);
                
                // Séries
                doc.text(exercicio.series, margemEsquerda + larguraUtil * 0.61, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
                
                // Repetições
                doc.text(exercicio.repeticoes, margemEsquerda + larguraUtil * 0.745, posicaoY + alturaExercicio/2 + 1, { align: 'center' });
                
                // Adicionar botão "VER VÍDEO" na coluna dedicada
            const videoUrl = encontrarVideoDoExercicioMemoizado(exercicio.nome, 'PDF');
                
                if (videoUrl) {
                  // Posição para o botão "VER VÍDEO" na coluna dedicada
                  const larguraBotao = 25; // Largura reduzida
                  const alturaBotao = 6; // Altura ajustada
                  const posXBotao = margemEsquerda + larguraUtil * 0.91; // Centro da coluna de vídeo
                  const posYBotao = posicaoY + (alturaExercicio - alturaBotao) / 2;
                  
                  // Desenhar botão "VER VÍDEO" com fundo roxo
                  doc.setFillColor(147, 51, 234); // Roxo #9333EA
                  doc.roundedRect(posXBotao - larguraBotao/2, posYBotao, larguraBotao, alturaBotao, 1, 1, 'F');
                  
                  // Texto "VER VÍDEO" em branco
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(8); // Fonte menor para caber melhor
                  doc.setTextColor(255, 255, 255);
                  doc.text('VER VÍDEO', posXBotao, posYBotao + alturaBotao/2 + 1, { align: 'center' });
                  
                  // Adicionar link para o vídeo do YouTube
                  doc.link(
                    posXBotao - larguraBotao/2, 
                    posYBotao, 
                    larguraBotao, 
                    alturaBotao, 
                    { url: videoUrl }
                  );
                  
                  // Voltar para a cor de texto padrão
                  doc.setTextColor(0, 0, 0);
                }
                
                // Adicionar método se existir
                const metodoInfo = formatarMetodoPDF(exercicio.nome);
                if (metodoInfo) {
                  posicaoY += alturaExercicio;
                  
                  // Título do método
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(9); // Padronizado para 9
                  doc.setTextColor(0, 0, 255); // Azul para o título do método
                  doc.text(`MÉTODO ${metodoInfo.metodoNome}:`, margemEsquerda + 2, posicaoY + 4);
                  
                  // Calcular a altura necessária para a descrição
                  const descricaoLinhas = doc.splitTextToSize(metodoInfo.descricao, larguraUtil - 10);
                  const alturaDescricao = descricaoLinhas.length * 5 + 10; // 5pt por linha + margens
                  
                  // Fundo azul claro para o corpo do método
                  doc.setFillColor(230, 240, 255);
                  doc.rect(margemEsquerda, posicaoY + 6, larguraUtil, alturaDescricao, 'F');
                  
                  // Descrição do método
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(9); // Padronizado para 9
                  doc.setTextColor(0, 0, 200); // Azul mais vivo para a descrição
                  
                  // Desenhar o texto da descrição linha por linha
                  for (let i = 0; i < descricaoLinhas.length; i++) {
                    doc.text(descricaoLinhas[i], margemEsquerda + 5, posicaoY + 12 + (i * 5));
                  }
                  
                  // Ajustar altura conforme o número de linhas na descrição
                  posicaoY += alturaDescricao;
                  
                  // Importante: Redefinir a cor de texto para preto após o método
                  doc.setTextColor(0, 0, 0);
                } else {
                  posicaoY += alturaExercicio;
                }
              }
              
              // Redefinir a cor do texto para preto antes de continuar
              doc.setTextColor(0, 0, 0);
              posicaoY += 15;
            }
            
            // Adicionar rodapé na última página
            adicionarRodape(paginaAtual, totalPaginas);
      } else {
        // Usar o método padrão para texto simples
        processarTextoSimples();
      }
      
      // Função para processar texto simples sem formatação específica
      function processarTextoSimples() {
        // Configuração de estilo
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        
        // Dividir o conteúdo em linhas
        const linhas = conteudo.split('\n');
        
        // Estimar o número total de páginas
        const alturaLinha = 5; // altura estimada por linha em mm
        const totalLinhas = linhas.length;
        const linhasPorPagina = Math.floor((doc.internal.pageSize.height - margemSuperior - margemInferior) / alturaLinha);
        const totalPaginas = Math.ceil(totalLinhas / linhasPorPagina);
        
        // Adicionar primeira página
        let linhaAtual = 0;
        
        while (linhaAtual < totalLinhas) {
          // Verificar se precisamos de uma nova página
          if (posicaoY >= (doc.internal.pageSize.height - margemInferior)) {
            adicionarRodape(paginaAtual, totalPaginas);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          const linha = linhas[linhaAtual].trim();
          
          // Verificar se é um título
          if (linha.match(/^[A-Z\s]{5,}$/) || 
              linha.match(/^TREINO\s+[A-Z]/) || 
              linha.includes('FICHA DE TREINO')) {
            // Renderizar como título
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(147, 51, 234); // Roxo #9333EA
            doc.text(linha, margemEsquerda, posicaoY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            posicaoY += 7;
          } else {
            // Renderizar como texto normal
            const linhasSplitadas = doc.splitTextToSize(linha, larguraUtil);
            for (const linhaSplitada of linhasSplitadas) {
              if (posicaoY >= (doc.internal.pageSize.height - margemInferior)) {
                adicionarRodape(paginaAtual, totalPaginas);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }
              
              doc.text(linhaSplitada, margemEsquerda, posicaoY);
              posicaoY += 5;
            }
          }
          
          linhaAtual++;
        }
        
        // Adicionar rodapé na última página
        adicionarRodape(paginaAtual, totalPaginas);
      }
      
      // Salvar o PDF
      console.log('Preparando para salvar o PDF...');
      try {
        doc.save('programacao_fisica.pdf');
        console.log('PDF gerado e salvo com sucesso!');
      } catch (saveError) {
        console.error('Erro ao salvar o PDF:', saveError);
        throw saveError;
      }
    } catch (error) {
      console.error('Erro ao gerar PDF da programação física:', error);
      alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
    } finally {
      setTimeout(() => {
        setGerandoPDF(false);
        console.log('Estado gerandoPDF definido como false');
      }, 1000);
    }
  };

  // Componente otimizado para cada exercício (memoizado)
  const ExercicioCard = React.memo(({ exercicio, index }: { exercicio: Exercicio, index: number }) => {
    // Usar a versão memoizada para encontrar vídeos
    const videoUrl = encontrarVideoDoExercicioMemoizado(exercicio.nome, 'WEB');
    
    // Função para obter a cor da intensidade
    const getIntensidadeCor = (intensidade?: 'baixa' | 'media' | 'alta') => {
      switch (intensidade) {
        case 'alta': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
        case 'media': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
        case 'baixa': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
        default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
      }
    };

    // Função para obter a cor do grupo muscular
    const getGrupoMuscularCor = (grupo?: string) => {
      const cores = {
        'peito': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
        'costas': 'text-green-600 bg-green-100 dark:bg-green-900/20',
        'pernas': 'text-red-600 bg-red-100 dark:bg-red-900/20',
        'ombros': 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
        'bracos': 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
        'core': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      };
      return cores[grupo as keyof typeof cores] || 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    };

    return (
      <div className="bg-purple-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex flex-col mb-3">
          <div className="flex items-start mb-2">
            <div className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold">{exercicio.numero}</span>
            </div>
            <div className="flex-1">
              <span className="text-gray-800 dark:text-white font-medium block">
                {exercicio.nome}
              </span>
              
              {/* Tags de Grupo Muscular e Intensidade */}
              <div className="flex gap-2 mt-1 flex-wrap">
                {exercicio.grupoMuscular && exercicio.grupoMuscular !== 'outros' && (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getGrupoMuscularCor(exercicio.grupoMuscular)}`}>
                    {exercicio.grupoMuscular === 'bracos' ? 'braços' : exercicio.grupoMuscular}
                  </span>
                )}
                {exercicio.intensidade && (
                  <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${getIntensidadeCor(exercicio.intensidade)}`}>
                    {exercicio.intensidade}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="pl-8 mb-3 flex items-center gap-2">
            {videoUrl && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVideoModalUrl(videoUrl);
                }}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-full inline-flex items-center transition-colors"
              >
                <Play className="w-3 h-3 mr-1.5" />VER VÍDEO
              </button>
            )}
            
            <BotaoMetodoTreino nomeExercicio={exercicio.nome} />
          </div>
        </div>
        
        <div className="grid grid-cols-2 pl-8">
          <div className="pr-4">
            <div className="uppercase text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
              SÉRIES
            </div>
            <div className="font-bold text-lg">
              {exercicio.series}
            </div>
          </div>
          <div>
            <div className="uppercase text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
              REPETIÇÕES
            </div>
            <div className="font-bold text-lg">
              {exercicio.repeticoes}
            </div>
          </div>
        </div>
      </div>
    );
  });

  // Componente otimizado para cada treino (memoizado)
  const TreinoCard = React.memo(({ treino, index }: { treino: Treino, index: number }) => {
    return (
      <div className="mb-6">
        <div className="bg-purple-600 px-4 py-3 rounded-t-lg flex items-center">
          <div className="bg-white/20 rounded-full w-8 h-8 flex items-center justify-center mr-3">
            <span className="text-white font-bold">{treino.letra}</span>
                </div>
          <h2 className="text-lg font-semibold text-white">
            TREINO {treino.letra}{treino.descricao ? ': ' + treino.descricao : ''}
          </h2>
              </div>
        
        <div>
          {treino.exercicios.map((exercicio, exIndex) => (
            <ExercicioCard key={exIndex} exercicio={exercicio} index={exIndex} />
            ))}
        </div>
          </div>
        );
  });

  // Componentes para as novas funcionalidades
  const ProgressoMensal = () => {
    if (treinosPorMes.length <= 1) return null;

    return (
      <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            Progresso do Programa
          </span>
          <span className="text-sm font-bold text-purple-600">
            Mês {mesSelecionado} de {treinosPorMes.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(mesSelecionado / treinosPorMes.length) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const CardsEstatisticas = () => {
    const estatisticas = calcularEstatisticasDoMes(mesSelecionado);
    
    // Formatar o volume para exibição mais limpa
    const volumeFormatado = estatisticas.volumeTotal > 1000 
      ? `${(estatisticas.volumeTotal / 1000).toFixed(1)}k`
      : estatisticas.volumeTotal.toString();

    return (
      <div className="grid grid-cols-3 gap-2 mb-3">
        {/* Card de Volume */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-1">
            <Activity className="w-4 h-4 text-purple-600 mr-1" />
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Volume Semanal
            </h3>
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-purple-600">
              {volumeFormatado}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              rep
            </span>
          </div>
        </div>

        {/* Card de Frequência */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-1">
            <Calendar className="w-4 h-4 text-purple-600 mr-1" />
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Frequência Semanal
            </h3>
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-purple-600">
              {estatisticas.frequenciaSemanal}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              dias
            </span>
          </div>
        </div>

        {/* Card de Intensidade */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-1">
            <Target className="w-4 h-4 text-purple-600 mr-1" />
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Intensidade Média
            </h3>
          </div>
          <div className="flex items-baseline">
            <span className="text-xl font-bold text-purple-600">
              {estatisticas.intensidadeMedia}
            </span>
          </div>
        </div>
      </div>
    );
  };



  const FiltrosEOrdenacao = () => {
    return (
      <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                className="px-2 py-1.5 rounded text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filtroGrupoMuscular}
                onChange={(e) => setFiltroGrupoMuscular(e.target.value as FiltroGrupoMuscular)}
              >
                <option value="">Todos os Grupos Musculares</option>
                <option value="peito">Peito</option>
                <option value="costas">Costas</option>
                <option value="pernas">Pernas</option>
                <option value="ombros">Ombros</option>
                <option value="bracos">Braços</option>
                <option value="core">Core/Abdômen</option>
              </select>
            </div>

            <select 
              className="px-2 py-1.5 rounded text-sm border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as OrdenacaoTipo)}
            >
              <option value="padrao">Ordem Padrão</option>
              <option value="alfabetica">Ordem Alfabética</option>
              <option value="volume">Maior Volume</option>
              <option value="intensidade">Maior Intensidade</option>
            </select>
          </div>

          <button 
            onClick={() => setMostrarComparacao(!mostrarComparacao)}
            className="flex items-center text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors text-sm"
          >
            <BarChart3 className="w-4 h-4 mr-1" />
            {mostrarComparacao ? 'Ocultar' : 'Mostrar'} Comparação
          </button>
        </div>
      </div>
    );
  };

  const TabelaComparacao = () => {
    if (!mostrarComparacao || treinosPorMes.length <= 1) return null;

    return (
      <div className="mb-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-2 flex items-center">
          <TrendingUp className="w-4 h-4 mr-1 text-purple-600" />
          Evolução Mensal
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-600 dark:text-gray-300">Mês</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-300">Volume</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-300">Intensidade</th>
                <th className="text-right py-2 text-gray-600 dark:text-gray-300">Frequência</th>
              </tr>
            </thead>
            <tbody>
              {treinosPorMes.map(mesData => {
                const isAtual = mesData.mes === mesSelecionado;
                return (
                  <tr 
                    key={mesData.mes} 
                    className={`border-b border-gray-100 dark:border-gray-700 ${
                      isAtual ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className={`py-2 ${isAtual ? 'font-bold text-purple-600' : 'text-gray-800 dark:text-white'}`}>
                      {mesData.mes}º Mês
                    </td>
                    <td className="text-right py-2 text-gray-800 dark:text-white">
                      {mesData.volumeTotal}
                    </td>
                    <td className="text-right py-2 text-gray-800 dark:text-white">
                      {mesData.intensidadeMedia}
                    </td>
                    <td className="text-right py-2 text-gray-800 dark:text-white">
                      {mesData.frequenciaSemanal} dias
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Função renderizarResultado otimizada
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado disponível ainda.</div>;
    }

    // Renderizar como texto simples se não for ficha de treino
    if (!ehFichaTreino) {
        return <pre className="whitespace-pre-wrap">{conteudo}</pre>;
      }
    
    // Renderizar os treinos processados
    if (treinosProcessados.length === 0) {
      return <div className="flex justify-center p-4">Processando dados...</div>;
    }

    return (
      <div>
        {/* Observações Personalizadas */}
        {observacoesPersonalizadas && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm overflow-hidden">
            <div 
              className="p-4 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
              onClick={() => setObservacoesExpandidas(!observacoesExpandidas)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                    Observações do Preparador Físico
                  </h3>
                </div>
                {observacoesExpandidas ? (
                  <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
            </div>
            
            {observacoesExpandidas && (
              <div className="px-4 pb-4 border-t border-amber-200 dark:border-amber-800">
                <div className="pt-4">
                  <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm leading-relaxed">
                    {observacoesPersonalizadas}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Progresso Mensal */}
        <ProgressoMensal />

        {/* Cards de Estatísticas */}
        <CardsEstatisticas />

        {/* Abas dos Meses */}
        <AbsMeses />

        {/* Filtros e Ordenação */}
        <FiltrosEOrdenacao />

        {/* Tabela de Comparação */}
        <TabelaComparacao />

        {/* Treinos do Mês Selecionado */}
        <div>
          {treinosDoMesFiltrados.map((treino, index) => (
            <TreinoCard key={`${treino.letra}-${index}`} treino={treino} index={index} />
          ))}
        </div>
      </div>
    );
  };

  // Componente para exibir tela de carregamento com mensagens sequenciais
  const TelaCarregamento = () => (
    <div className="flex flex-col items-center justify-center py-12 h-[50vh]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-purple-100 dark:border-purple-900 relative overflow-hidden">
        {/* Efeito de gradiente decorativo no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800"></div>
        
        <div className="relative bg-purple-100 dark:bg-purple-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
          {mensagemCarregamento.includes('FRANGO') ? (
            <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <>
              <svg className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="absolute w-full h-full rounded-full bg-purple-200 dark:bg-purple-800/40 animate-ping opacity-30"></span>
            </>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {mensagemCarregamento.includes('FRANGO') 
            ? 'Carregamento Finalizado!' 
            : 'Carregando Programação Física'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[50px] flex items-center justify-center">
          <span className={`transition-all duration-500 ${mensagemCarregamento.includes('FRANGO') ? 'text-green-600 dark:text-green-400 font-bold text-lg' : ''}`}>
            {mensagemCarregamento}
          </span>
        </p>
        
        {!mensagemCarregamento.includes('FRANGO') && (
          <div className="flex justify-center space-x-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></span>
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-75"></span>
            <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-150"></span>
          </div>
        )}
      </div>
    </div>
  );

  // Renderização principal do componente
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modal de vídeo */}
      {videoModalUrl && (
        <VideoModal videoUrl={videoModalUrl} onClose={() => setVideoModalUrl(null)} />
      )}
      
      {/* Layout Responsivo */}
      <div className="lg:flex lg:h-screen">
        {/* Layout Desktop - Split Screen */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 overflow-hidden border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen relative">
          <div className="flex-1 flex flex-col">
            {/* Cabeçalho Desktop */}
            <div className="mb-4 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="mb-3 p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-between mb-1 relative">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Programação Física
                </h1>
                
                {/* Abas dos Meses - Desktop */}
                {!carregando && perfilLiberado && perfil?.resultado_fisica && treinosPorMes.length > 1 && (
                  <div className="relative flex space-x-1 overflow-visible">
                    {/* Indicador animado apontando para os botões */}
                    {mostrarAnimacoesMeses && (
                      <div className="absolute -top-8 left-0 right-0 z-20 animate-bounce pointer-events-none">
                        <div className="bg-purple-600 text-white text-xs px-2 py-1 rounded-lg shadow-lg mx-auto w-fit max-w-full">
                          👆 Escolha o mês aqui
                        </div>
                        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-purple-600 mx-auto mt-0"></div>
                      </div>
                    )}
                    
                    {treinosPorMes.map((mesData) => (
                      <button 
                        key={mesData.mes}
                        className={`
                          relative px-3 py-1.5 text-sm font-semibold rounded-lg transition-all duration-200
                          ${mesSelecionado === mesData.mes ? 
                            'bg-purple-800 text-white shadow-md' : 
                            'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                          }
                        `}
                        onClick={() => {
                          setMesSelecionado(mesData.mes);
                          setMostrarAnimacoesMeses(false); // Esconder animação ao clicar
                        }}
                      >
                        {/* Pulso animado para chamar atenção */}
                        {mostrarAnimacoesMeses && (
                          <div className="absolute inset-0 rounded-lg bg-purple-400 opacity-25 animate-ping"></div>
                        )}
                        <span className="relative">{mesData.mes}º Mês</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-1 w-24 bg-purple-600 mb-3 rounded-full"></div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Confira sua ficha de treino personalizada e comece a transformar seu corpo hoje mesmo.
              </p>
            </div>

            {/* Seus Dados */}
            {dadosFisicos && (
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-3">Seus Dados</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Objetivo
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {dadosFisicos.objetivo?.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Tempo Inativo
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {typeof dadosFisicos?.tempo_inativo === 'string' 
                        ? dadosFisicos.tempo_inativo.replace(/_/g, '-').replace(/_meses$/, ' meses')
                        : dadosFisicos?.tempo_inativo || 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Experiência
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white capitalize">
                      {dadosFisicos.experiencia_musculacao?.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Disponibilidade
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {typeof dadosFisicos.disponibilidade_semanal === 'string' 
                        ? dadosFisicos.disponibilidade_semanal.replace(/\s*dias\s*por\s*semana\s*/i, "").trim() + " dias/sem"
                        : dadosFisicos.disponibilidade_semanal + " dias/sem"
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="mb-4 space-y-2">
              <div className="relative overflow-visible">
                {/* Indicador animado para o botão nutricional */}
                {mostrarAnimacaoNutricional && (
                  <div className="absolute -top-8 left-0 right-0 z-20 animate-bounce pointer-events-none">
                    <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded-lg shadow-lg mx-auto w-fit max-w-full">
                      🍎 Veja também sua dieta
                    </div>
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-600 mx-auto mt-0"></div>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    navigate('/resultado-nutricional');
                    setMostrarAnimacaoNutricional(false); // Esconder animação ao clicar
                  }}
                  className="relative w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition-all overflow-hidden"
                >
                  {/* Brilho animado de fundo */}
                  {mostrarAnimacaoNutricional && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-30 animate-pulse"></div>
                  )}
                  
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="relative w-4 h-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="relative">Ver Programação Nutricional</span>
                </button>
              </div>

              <button
                onClick={() => {
                  console.log("Botão 'Baixar PDF' clicado");
                  gerarPDF();
                }}
                disabled={gerandoPDF || !perfil?.resultado_fisica || carregando}
                className={`
                  w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${gerandoPDF || !perfil?.resultado_fisica || carregando
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow'}
                `}
              >
                {gerandoPDF ? 
                  'Gerando PDF...' : 
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </>
                }
              </button>
            </div>

            {/* Conteúdo de Controle Desktop */}
            {!carregando && perfilLiberado && perfil?.resultado_fisica && (
              <div className="flex-1 flex flex-col space-y-3">
                <ProgressoMensal />
                <CardsEstatisticas />
                <FiltrosEOrdenacao />
                <TabelaComparacao />
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito Desktop */}
        <div className="hidden lg:block lg:w-1/2 bg-white dark:bg-gray-900 overflow-y-auto">
          <div className="p-8">
            {carregando ? (
              <TelaCarregamento />
            ) : !perfilLiberado ? (
              <div className="bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 p-6 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                      Acesso Pendente
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-200">
                      Seu acesso aos resultados ainda não foi liberado. Entre em contato com o administrador.
                    </p>
                  </div>
                </div>
              </div>
            ) : perfil?.resultado_fisica ? (
              <div>
                {/* Observações Personalizadas */}
                {observacoesPersonalizadas && (
                  <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm overflow-hidden">
                    <div 
                      className="p-4 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                      onClick={() => setObservacoesExpandidas(!observacoesExpandidas)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                            Observações do Preparador Físico
                          </h3>
                        </div>
                        {observacoesExpandidas ? (
                          <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                    </div>
                    
                    {observacoesExpandidas && (
                      <div className="px-4 pb-4 border-t border-amber-200 dark:border-amber-800">
                        <div className="pt-4">
                          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm leading-relaxed">
                            {observacoesPersonalizadas}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  Treinos do {mesSelecionado}º Mês
                </h2>
                
                <div className="space-y-6">
                  {treinosDoMesFiltrados.map((treino, index) => (
                    <TreinoCard key={`${treino.letra}-${index}`} treino={treino} index={index} />
                  ))}
                </div>
                
                {treinosDoMesFiltrados.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 dark:text-gray-600 mb-4">
                      <Filter className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                      Nenhum treino encontrado
                    </h3>
                    <p className="text-gray-500 dark:text-gray-500">
                      Tente ajustar os filtros ou selecionar outro mês.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="text-center max-w-md">
                  <div className="relative bg-purple-100 dark:bg-purple-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="absolute w-full h-full rounded-full bg-purple-200 dark:bg-purple-800/40 animate-ping opacity-30"></span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    Resultado em Processamento
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    A programação física está sendo elaborada pela nossa equipe de especialistas.
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></span>
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-75"></span>
                    <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-150"></span>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Você receberá uma notificação assim que estiver disponível.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Layout Mobile - Rolável */}
        <div className="lg:hidden min-h-screen bg-gray-50 dark:bg-gray-900">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Cabeçalho Mobile */}
            <div className="mb-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="mb-4 p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <h1 className="text-2xl font-bold">
                <div className="text-purple-600">Programação Física</div>
              </h1>
              <div className="h-1 w-32 bg-purple-600 mt-2 mb-4 rounded-full"></div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Confira sua ficha de treino personalizada e comece a transformar seu corpo hoje mesmo.
              </p>
            </div>

            {/* Seus Dados Mobile */}
            {dadosFisicos && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400 mb-4">Seus Dados</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Objetivo
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {dadosFisicos.objetivo?.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Tempo Inativo
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {typeof dadosFisicos?.tempo_inativo === 'string' 
                        ? dadosFisicos.tempo_inativo.replace(/_/g, '-').replace(/_meses$/, ' meses')
                        : dadosFisicos?.tempo_inativo || 'Não informado'}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Experiência
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {dadosFisicos.experiencia_musculacao?.toLowerCase()}
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Disponibilidade Semanal
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                      {typeof dadosFisicos.disponibilidade_semanal === 'string' 
                        ? dadosFisicos.disponibilidade_semanal.replace(/\s*dias\s*por\s*semana\s*/i, "").trim() + " dias por semana"
                        : dadosFisicos.disponibilidade_semanal + " dias por semana"
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo principal Mobile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-purple-100 dark:border-purple-900">
              <div className="relative border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="w-1 h-6 bg-purple-600 rounded-full mr-3"></div>
                    <h2 className="text-base font-medium text-gray-800 dark:text-white">
                      Sua programação física
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative">
                      {/* Indicador animado mobile */}
                      {mostrarAnimacaoNutricional && (
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10 animate-pulse">
                          <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                            🍎 Sua dieta aqui
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          navigate('/resultado-nutricional');
                          setMostrarAnimacaoNutricional(false); // Esconder animação ao clicar
                        }}
                        className="relative flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition-all overflow-hidden"
                      >
                        {/* Brilho animado de fundo */}
                        {mostrarAnimacaoNutricional && (
                          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 opacity-30 animate-pulse"></div>
                        )}
                        
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="relative w-4 h-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        <span className="relative">Ver Programação Nutricional</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        console.log("Botão 'Baixar PDF' clicado");
                        gerarPDF();
                      }}
                      disabled={gerandoPDF || !perfil?.resultado_fisica || carregando}
                      className={`
                        flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium 
                        ${gerandoPDF || !perfil?.resultado_fisica || carregando
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all'}
                      `}
                    >
                      {gerandoPDF ? 
                        'Gerando PDF...' : 
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar PDF
                        </>
                      }
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-0">
                {carregando ? (
                  <TelaCarregamento />
                ) : !perfilLiberado ? (
                  <div className="bg-yellow-50 dark:bg-gray-700 border-l-4 border-yellow-400 p-4 m-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                          Seu acesso aos resultados ainda não foi liberado. Entre em contato com o administrador.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : perfil?.resultado_fisica ? (
                  <div className="custom-scrollbar overflow-y-auto">
                    {/* Controles Mobile */}
                    {!carregando && perfilLiberado && perfil?.resultado_fisica && (
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <ProgressoMensal />
                        <CardsEstatisticas />
                        <FiltrosEOrdenacao />
                        <TabelaComparacao />
                        
                        {/* Abas dos Meses Mobile - Em baixo */}
                        {treinosPorMes.length > 1 && (
                          <div className="mb-4 relative">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Selecione o Mês:
                              </h4>
                              {/* Indicador animado para mobile */}
                              {mostrarAnimacoesMeses && (
                                <div className="flex items-center text-purple-600 animate-pulse">
                                  <span className="text-xs mr-1">Toque aqui</span>
                                  <span className="text-lg">👇</span>
                                </div>
                              )}
                            </div>
                            <div className="relative flex space-x-2">
                              {/* Brilho animado de fundo */}
                              {mostrarAnimacoesMeses && (
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200 opacity-30 animate-pulse"></div>
                              )}
                              
                              {treinosPorMes.map((mesData) => (
                                <button 
                                  key={mesData.mes}
                                  className={`
                                    relative flex-1 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200
                                    ${mesSelecionado === mesData.mes ? 
                                      'bg-purple-800 text-white shadow-md' : 
                                      'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
                                    }
                                  `}
                                  onClick={() => {
                                    setMesSelecionado(mesData.mes);
                                    setMostrarAnimacoesMeses(false); // Esconder animação ao clicar
                                  }}
                                >
                                  {/* Pulso individual para cada botão */}
                                  {mostrarAnimacoesMeses && (
                                    <div className="absolute inset-0 rounded-lg bg-purple-400 opacity-20 animate-ping"></div>
                                  )}
                                  <span className="relative">{mesData.mes}º Mês</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Treinos Mobile */}
                    <div className="p-4">
                      {/* Observações Personalizadas Mobile */}
                      {observacoesPersonalizadas && (
                        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm overflow-hidden">
                          <div 
                            className="p-4 cursor-pointer hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors"
                            onClick={() => setObservacoesExpandidas(!observacoesExpandidas)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                                  Observações do Preparador Físico
                                </h3>
                              </div>
                              {observacoesExpandidas ? (
                                <ChevronUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                              )}
                            </div>
                          </div>
                          
                          {observacoesExpandidas && (
                            <div className="px-4 pb-4 border-t border-amber-200 dark:border-amber-800">
                              <div className="pt-4">
                                <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm leading-relaxed">
                                  {observacoesPersonalizadas}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-6">
                        {treinosDoMesFiltrados.map((treino, index) => (
                          <TreinoCard key={`${treino.letra}-${index}`} treino={treino} index={index} />
                        ))}
                      </div>
                      
                      {treinosDoMesFiltrados.length === 0 && (
                        <div className="text-center py-12">
                          <div className="text-gray-400 dark:text-gray-600 mb-4">
                            <Filter className="w-16 h-16 mx-auto" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                            Nenhum treino encontrado
                          </h3>
                          <p className="text-gray-500 dark:text-gray-500">
                            Tente ajustar os filtros ou selecionar outro mês.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-purple-100 dark:border-purple-900 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-400 via-purple-600 to-purple-800"></div>
                      
                      <div className="relative bg-purple-100 dark:bg-purple-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="absolute w-full h-full rounded-full bg-purple-200 dark:bg-purple-800/40 animate-ping opacity-30"></span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Resultado em Processamento</h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        A programação física está sendo elaborada pela nossa equipe de especialistas.
                      </p>
                      
                      <div className="flex justify-center space-x-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce"></span>
                        <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-75"></span>
                        <span className="w-3 h-3 rounded-full bg-purple-600 animate-bounce delay-150"></span>
                      </div>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        Você receberá uma notificação assim que estiver disponível.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
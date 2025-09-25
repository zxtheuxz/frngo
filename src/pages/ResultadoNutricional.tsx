import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { jsPDF } from 'jspdf';
import { Play, Download, ArrowLeft, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

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

interface Perfil {
  liberado: string; // 'sim' ou 'nao'
  resultado_nutricional: string; // Texto com o resultado da avaliação nutricional
  nome?: string; // Optional nome
  nome_completo?: string;
  sexo?: string; // Alterado de genero para sexo
}

interface DadosCliente {
  peso: number;
  altura: number;
  peso_habitual: number;
}

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

// Adicionar estilos customizados para scrollbar
const addCustomScrollbarStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.1);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(249, 115, 22, 0.5);
      border-radius: 3px;
    }
    
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(249, 115, 22, 0.7);
    }
  `;
  
  if (!document.head.querySelector('style[data-custom-scrollbar]')) {
    style.setAttribute('data-custom-scrollbar', 'true');
    document.head.appendChild(style);
  }
};

export function ResultadoNutricional() {
  const navigate = useNavigate();
  const [gerandoPDF, setGerandoPDF] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [dadosCliente, setDadosCliente] = useState<DadosCliente | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  
  // Adicionar estilos da scrollbar quando o componente monta
  useEffect(() => {
    addCustomScrollbarStyles();
  }, []);
  
  // Novos estados para mensagens de carregamento sequenciais
  const [mensagemCarregamento, setMensagemCarregamento] = useState<string>('Buscando informações do seu Perfil');
  const [primeiroCarregamento, setPrimeiroCarregamento] = useState<boolean>(true);
  
  // Estados para navegação por seções
  const [secaoSelecionada, setSecaoSelecionada] = useState<string>('completo');
  const [secoesDisponiveis, setSecoesDisponiveis] = useState<string[]>([]);
  
  // Estado para observações personalizadas
  const [observacoesPersonalizadas, setObservacoesPersonalizadas] = useState<string | null>(null);
  const [observacoesExpandidas, setObservacoesExpandidas] = useState<boolean>(true);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  // Função para extrair observações personalizadas do nutricionista
  const extrairObservacoesNutricional = (conteudo: string): string | null => {
    const refeicoes = ['Café da manhã', 'Colação', 'Almoço', 'Lanche da Tarde', 'Jantar', 'Ceia'];
    let indexPrimeiraRefeicao = conteudo.length;
    
    // Encontrar o índice da primeira refeição
    for (const refeicao of refeicoes) {
      const regex = new RegExp(`^${refeicao}\\s*$`, 'im');
      const match = conteudo.match(regex);
      
      if (match && match.index !== undefined && match.index < indexPrimeiraRefeicao) {
        indexPrimeiraRefeicao = match.index;
      }
    }
    
    // Se encontrou alguma refeição e há texto antes dela
    if (indexPrimeiraRefeicao > 0 && indexPrimeiraRefeicao < conteudo.length) {
      const observacoes = conteudo.substring(0, indexPrimeiraRefeicao).trim();
      
      // Remover o título padrão do planejamento se existir
      const titulosPadrao = [
        /Planejamento alimentar.*kcal.*/i,
        /Emagrecimento.*kcal.*/i,
        /Ganho.*massa.*kcal.*/i
      ];
      
      let observacoesLimpas = observacoes;
      for (const regex of titulosPadrao) {
        observacoesLimpas = observacoesLimpas.replace(regex, '').trim();
      }
      
      // Retornar apenas se houver conteúdo significativo após limpar
      if (observacoesLimpas.length > 0) {
        return observacoesLimpas;
      }
    }
    
    return null;
  };

  // Função para extrair seções disponíveis do conteúdo
  const extrairSecoesDisponiveis = (conteudo: string) => {
    const secoes = [];
    const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
    
    const regexRefeicao = /^(Café da manhã|Colação|Almoço|Lanche da Tarde|Lanche da Tarde Substituto|Jantar|Ceia)\s*$/i;
    const regexListaCompras = /^Lista de compras\s*$/i;
    
    for (const linha of linhas) {
      const matchRefeicao = linha.match(regexRefeicao);
      const matchListaCompras = linha.match(regexListaCompras);
      
      if (matchRefeicao) {
        let nomeSecao = matchRefeicao[1];
        // Unificar "Lanche da Tarde Substituto" com "Lanche da Tarde"
        if (nomeSecao.toLowerCase().includes('lanche da tarde')) {
          nomeSecao = 'Lanche da Tarde';
        }
        if (!secoes.includes(nomeSecao)) {
          secoes.push(nomeSecao);
        }
      } else if (matchListaCompras) {
        if (!secoes.includes('Lista de Compras')) {
          secoes.push('Lista de Compras');
        }
      }
    }
    
    return secoes;
  };

  // Função para filtrar conteúdo por seção
  const filtrarConteudoPorSecao = (conteudo: string, secao: string) => {
    if (secao === 'completo') return conteudo;
    
    const linhas = conteudo.split('\n');
    const linhasFiltradas = [];
    let capturandoSecao = false;
    let tituloGeral = '';
    
    // Primeiro, capturar o título geral
    for (const linha of linhas) {
      if (linha.includes('kcal') && (linha.includes('Emagrecimento') || linha.includes('Ganho'))) {
        tituloGeral = linha;
        break;
      }
      if (linha.includes('Planejamento alimentar') || linha.includes('Planejamneto alimentar')) {
        tituloGeral = linha;
        break;
      }
    }
    
    // Adicionar título geral se existir
    if (tituloGeral) {
      linhasFiltradas.push(tituloGeral);
      linhasFiltradas.push(''); // Linha em branco
    }
    
    const regexRefeicao = /^(Café da manhã|Colação|Almoço|Lanche da Tarde|Lanche da Tarde Substituto|Jantar|Ceia)\s*$/i;
    const regexListaCompras = /^Lista de compras\s*$/i;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].trim();
      
      // Verificar se é o início da seção desejada
      const matchRefeicao = linha.match(regexRefeicao);
      const matchListaCompras = linha.match(regexListaCompras);
      
      if (matchRefeicao) {
        let nomeSecaoAtual = matchRefeicao[1];
        if (nomeSecaoAtual.toLowerCase().includes('lanche da tarde')) {
          nomeSecaoAtual = 'Lanche da Tarde';
        }
        
        if (nomeSecaoAtual === secao) {
          capturandoSecao = true;
          linhasFiltradas.push(linha);
        } else {
          capturandoSecao = false;
        }
      } else if (matchListaCompras && secao === 'Lista de Compras') {
        capturandoSecao = true;
        linhasFiltradas.push(linha);
      } else if (capturandoSecao) {
        // Verificar se chegamos a uma nova seção
        const proximaRefeicao = linha.match(regexRefeicao);
        const proximaListaCompras = linha.match(regexListaCompras);
        
        if (proximaRefeicao || proximaListaCompras) {
          // Se chegamos a uma nova seção diferente da atual, parar de capturar
          let nomeProximaSecao = '';
          if (proximaRefeicao) {
            nomeProximaSecao = proximaRefeicao[1];
            if (nomeProximaSecao.toLowerCase().includes('lanche da tarde')) {
              nomeProximaSecao = 'Lanche da Tarde';
            }
          } else if (proximaListaCompras) {
            nomeProximaSecao = 'Lista de Compras';
          }
          
          if (nomeProximaSecao !== secao) {
            capturandoSecao = false;
          } else {
            linhasFiltradas.push(linha);
          }
        } else {
          linhasFiltradas.push(linha);
        }
      }
    }
    
    return linhasFiltradas.join('\n');
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
      'Buscando Avaliação Nutricional',
      'Compilando dados nutricionais',
      'Carregando Informações',
      'Pronto feito, fique à vontade!'
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
        console.log('[DEBUG] Iniciando buscarPerfil...');
        setCarregando(true);
        
        // Definir primeira mensagem de carregamento
        setMensagemCarregamento('Buscando informações do seu Perfil');
        
        if (!id) {
          console.log('[DEBUG] ID não fornecido na URL, buscando perfil do usuário logado');
          
          // Obter o usuário logado
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          console.log('[DEBUG] Resultado auth.getUser:', { user, error: userError });
          
          if (!user) {
            console.error('[DEBUG] Usuário não autenticado');
            setCarregando(false);
            return;
          }
          
          // Aguardar um tempo para a primeira mensagem ser exibida
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Buscando Avaliação Nutricional');
          
          // Buscar o perfil do usuário logado
          console.log('[DEBUG] Buscando perfil para user_id:', user.id);
          const { data: perfilUsuario, error: perfilError } = await supabase
            .from('perfis')
            .select('*, nome_completo')
            .eq('user_id', user.id)
            .single();
            
          console.log('[DEBUG] Resultado busca perfil:', { perfilUsuario, error: perfilError });
          
          if (perfilError) {
            console.error('[DEBUG] Erro ao buscar perfil do usuário:', perfilError);
            setCarregando(false);
            return;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Compilando dados nutricionais');
          
          console.log('[DEBUG] Dados do perfil do usuário logado:', perfilUsuario);
          
          if (!perfilUsuario) {
            console.error('[DEBUG] Nenhum perfil encontrado para o usuário logado');
            setCarregando(false);
            return;
          }
          
          // Verificar se o campo liberado é 'sim' (case insensitive)
          const liberado = typeof perfilUsuario.liberado === 'string' && 
                          perfilUsuario.liberado.toLowerCase() === 'sim';
          
          console.log('[DEBUG] Status liberado:', liberado);
          
          await new Promise(resolve => setTimeout(resolve, 1200));
          setMensagemCarregamento('Carregando Informações');
          
          setPerfil(perfilUsuario);
          setPerfilLiberado(liberado);

          // Buscar dados do cliente baseado no sexo
          const tabela = perfilUsuario.sexo === 'feminino' ? 'avaliacao_nutricional_feminino' : 'avaliacao_nutricional';
          console.log('[DEBUG] Buscando dados na tabela:', tabela);
          
          // Primeiro verificar se existem registros
          const { count, error: countError } = await supabase
            .from(tabela)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (countError) {
            console.error('[DEBUG] Erro ao verificar registros:', countError);
            setCarregando(false);
            return;
          }

          if (count && count > 0) {
            // Se existirem registros, buscar os detalhes
            const { data: dadosAvaliacao, error: erroAvaliacao } = await supabase
              .from(tabela)
              .select('peso, altura, peso_habitual')
              .eq('user_id', user.id)
              .single();

            console.log('[DEBUG] Resultado busca avaliação:', { dadosAvaliacao, error: erroAvaliacao });

            if (!erroAvaliacao && dadosAvaliacao) {
              console.log('[DEBUG] Dados da avaliação encontrados:', dadosAvaliacao);
              setDadosCliente(dadosAvaliacao);
            } else {
              console.log('[DEBUG] Erro ao buscar detalhes da avaliação:', erroAvaliacao);
            }
          } else {
            console.log('[DEBUG] Nenhum registro encontrado na tabela:', tabela);
          }
          
          // Aguardar um pouco mais para mostrar a última mensagem
          await new Promise(resolve => setTimeout(resolve, 1500));
          setMensagemCarregamento('Pronto feito, fique à vontade!');
          
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
        setMensagemCarregamento('Buscando Avaliação Nutricional');
        
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
        setMensagemCarregamento('Compilando dados nutricionais');
        
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
        setMensagemCarregamento('Carregando Informações');
        
        setPerfil(data);
        setPerfilLiberado(liberado);
        
        // Buscar dados do cliente baseado no sexo
        const tabela = data.sexo === 'feminino' ? 'avaliacao_nutricional_feminino' : 'avaliacao_nutricional';
        
        // Primeiro verificar se existem registros
        const { count, error: countError } = await supabase
          .from(tabela)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', data.user_id);

        if (countError) {
          console.error('[DEBUG] Erro ao verificar registros:', countError);
          setCarregando(false);
          return;
        }

        if (count && count > 0) {
          // Se existirem registros, buscar os detalhes
          const { data: dadosAvaliacao, error: erroAvaliacao } = await supabase
            .from(tabela)
            .select('peso, altura, peso_habitual')
            .eq('user_id', data.user_id)
            .single();

          if (!erroAvaliacao && dadosAvaliacao) {
            setDadosCliente(dadosAvaliacao);
          } else {
            console.log('[DEBUG] Erro ao buscar detalhes da avaliação:', erroAvaliacao);
          }
        } else {
          console.log('[DEBUG] Nenhum registro encontrado na tabela:', tabela);
        }
        
        // Aguardar um pouco mais para mostrar a última mensagem
        await new Promise(resolve => setTimeout(resolve, 1200));
        setMensagemCarregamento('Pronto feito, fique à vontade!');
        
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

  // Extrair seções disponíveis e observações quando o perfil for carregado
  useEffect(() => {
    if (perfil?.resultado_nutricional) {
      const secoes = extrairSecoesDisponiveis(perfil.resultado_nutricional);
      // Filtrar "Lista de Compras" das seções disponíveis
      const secoesFiltradas = secoes.filter(secao => secao !== 'Lista de Compras');
      setSecoesDisponiveis(secoesFiltradas);

      // Extrair observações personalizadas
      const observacoes = extrairObservacoesNutricional(perfil.resultado_nutricional);
      setObservacoesPersonalizadas(observacoes);
    }
  }, [perfil?.resultado_nutricional]);

  // Função para gerar PDF da avaliação nutricional
  const gerarPDF = async () => {
    console.log('[gerarPDF] Iniciando geração...');
    
    if (!perfil) {
      console.error('[gerarPDF] Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_nutricional;
    
    if (!conteudo) {
      console.error('[gerarPDF] Conteúdo nutricional não disponível');
      alert('Não há resultado de avaliação nutricional disponível para gerar o PDF');
      return;
    }

    try {
      console.log('[gerarPDF] Definindo estado...');
      setGerandoPDF(true);
      
      console.log('[gerarPDF] Conteúdo encontrado, tamanho:', conteudo.length);
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Definições de margens e dimensões
      const margemEsquerda = 10;
      const margemDireita = 10;
      const margemSuperior = 25;
      const margemInferior = 15;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      // Variáveis de controle de página e posição
      let paginaAtual = 1;
      let posicaoY = margemSuperior + 5;
      
      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pagina: number) => {
        // Retângulo laranja do cabeçalho com cor mais suave
        doc.setFillColor(251, 146, 60); // Laranja #FB923C
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // Texto branco
        doc.text('AVALIAÇÃO NUTRICIONAL', doc.internal.pageSize.width / 2, 13, { align: 'center' });
        
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
      
      // Verificar se o conteúdo parece ser um planejamento alimentar
      const pareceSerPlanejamentoAlimentar = conteudo.includes('Planejamento alimentar') || 
                                       conteudo.includes('Café da manhã') ||
                                       conteudo.includes('Almoço') ||
                                       conteudo.includes('Jantar') ||
                                       conteudo.includes('kcal') ||
                                       conteudo.includes('Colação') ||
                                       conteudo.includes('Ceia');
                                        
      if (pareceSerPlanejamentoAlimentar) {
        try {
          // Dividir o conteúdo em linhas
          const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
          
          // Array para armazenar as refeições
          const refeicoes: any[] = [];
          let refeicaoAtual: any = null;
          let tituloGeral = '';
          let listaDeCompras: string[] = [];
          let emListaDeCompras = false;
          
          // Expressões regulares para identificar refeições
          const regexRefeicao = /^(Café da manhã|Colação|Almoço|Lanche da Tarde|Lanche da Tarde Substituto|Jantar|Ceia)\s*$/i;
          const regexObservacoes = /^Observações:(.+)/i;
          const regexSubstituicoes = /^• Opções de substituição para (.+):$/i;
          const regexAlimento = /^([^•].+)$/i;
          const regexTitulo = /^Planejam[e|n]to Alimentar\s+(.+)/i;
          const regexListaCompras = /^Lista de compras\s*$/i;
          
          // Variáveis para controle
          let emObservacoes = false;
          let emSubstituicoes = false;
          let alimentoAtual = '';
          let substituicoes: string[] = [];
          
          // Processar cada linha
          for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i].trim();
            
            // Verificar se é uma linha com o tipo/calorias do plano
            if (linha.includes('kcal') && (linha.includes('Emagrecimento') || linha.includes('Ganho'))) {
              console.log('[gerarPDF] Encontrada linha de calorias/objetivo:', linha);
              
              // Verificar e corrigir duplicações no título
              if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                  linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                console.log('[gerarPDF] Detectada duplicação no título:', linha);
                tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
              } else {
                tituloGeral = linha;
              }
              continue;
            }
            
            // Verificar se é o título geral
            const matchTitulo = linha.match(regexTitulo);
            if (matchTitulo) {
              console.log('[gerarPDF] Encontrado título:', linha);
              if (!tituloGeral) {
                // Verificar e corrigir duplicações no título
                if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                    linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                  console.log('[gerarPDF] Detectada duplicação no título:', linha);
                  tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
                } else {
                  tituloGeral = linha;
                }
              }
              continue;
            }
            
            // Verificar se é o início da lista de compras
            const matchListaCompras = linha.match(regexListaCompras);
            if (matchListaCompras || (linha.includes('Lista de compras') && !emSubstituicoes)) {
              emListaDeCompras = true;
              emObservacoes = false;
              emSubstituicoes = false;
              
              // Se estávamos em uma refeição, adicioná-la antes
              if (refeicaoAtual) {
                refeicoes.push(refeicaoAtual);
                refeicaoAtual = null;
              }
              continue;
            }
            
            // Se estamos na lista de compras, adicionar item
            if (emListaDeCompras) {
              // Filtrar apenas ingredientes válidos
              if (!linha.match(regexRefeicao) && !linha.match(regexTitulo) && 
                  !linha.includes('Planejamento alimentar') && 
                  !linha.startsWith('•') &&
                  !linha.includes('Receita culinária') &&
                  !linha.includes('Rendimento:') &&
                  !linha.includes('Ingredientes:') &&
                  !linha.includes('Forma de preparo:') &&
                  !linha.includes('porção(ões)') &&
                  !linha.match(/^\d+\)/) && // Ignora instruções numeradas
                  linha.length > 2 && linha.length < 100) { // Tamanho razoável
                listaDeCompras.push(linha);
              }
              continue;
            }
            
            // Verificar se é um nome de refeição
            const matchRefeicao = linha.match(regexRefeicao);
            if (matchRefeicao) {
              // Se já temos uma refeição atual, adicionar ao array
              if (refeicaoAtual) {
                refeicoes.push(refeicaoAtual);
              }
              
              // Criar nova refeição
              refeicaoAtual = {
                nome: matchRefeicao[1],
                alimentos: [],
                observacoes: '',
              };
              
              emObservacoes = false;
              emSubstituicoes = false;
              continue;
            }
            
            // Verificar se estamos em uma refeição
            if (refeicaoAtual) {
              // Verificar se é o início de observações
              const matchObservacoes = linha.match(regexObservacoes);
              if (matchObservacoes) {
                emObservacoes = true;
                refeicaoAtual.observacoes = matchObservacoes[1].trim();
                continue;
              }
              
              // Se estamos em observações, adicionar à observação atual
              if (emObservacoes) {
                refeicaoAtual.observacoes += ' ' + linha;
                continue;
              }
              
              // Verificar se é o início de substituições
              const matchSubstituicoes = linha.match(regexSubstituicoes);
              if (matchSubstituicoes) {
                emSubstituicoes = true;
                alimentoAtual = matchSubstituicoes[1].trim();
                substituicoes = [];
                continue;
              }
              
              // Se estamos em substituições
              if (emSubstituicoes) {
                if (linha.startsWith('•')) {
                  // Nova substituição, salvar as anteriores
                  if (substituicoes.length > 0) {
                    // Encontrar o alimento correspondente
                    const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                      (alimento: any) => alimento.nome === alimentoAtual
                    );
                    
                    if (alimentoIndex !== -1) {
                      refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                    }
                    
                    // Reiniciar para a nova substituição
                    const novoMatchSubstituicoes = linha.match(/^• Opções de substituição para (.+):$/i);
                    if (novoMatchSubstituicoes) {
                      alimentoAtual = novoMatchSubstituicoes[1].trim();
                      substituicoes = [];
                    }
                  }
                } else {
                  // Adicionar à lista de substituições
                  substituicoes.push(linha);
                  
                  // Verificar se estamos no final da lista de substituições
                  if (i + 1 === linhas.length || 
                      linhas[i + 1].match(regexRefeicao) || 
                      linhas[i + 1].match(regexObservacoes) ||
                      linhas[i + 1].match(regexListaCompras) ||
                      linhas[i + 1].startsWith('•')) {
                    // Encontrar o alimento correspondente
                    const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                      (alimento: any) => alimento.nome === alimentoAtual
                    );
                    
                    if (alimentoIndex !== -1) {
                      refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                    }
                    
                    // Fim das substituições
                    if (i + 1 < linhas.length && !linhas[i + 1].startsWith('•')) {
                      emSubstituicoes = false;
                    }
                  }
                }
                continue;
              }
              
              // Se não estamos em observações nem substituições, deve ser um alimento
              const matchAlimento = linha.match(regexAlimento);
              if (matchAlimento && !linha.startsWith('•') && !linha.includes('Lista de compras')) {
                // Extrair nome e porção
                const partes = linha.split('\n');
                const nome = partes[0].trim();
                const porcao = i + 1 < linhas.length ? linhas[i + 1].trim() : '';
                
                // Pular a linha da porção se necessário
                if (porcao && !porcao.startsWith('•') && !porcao.match(regexRefeicao) && !porcao.match(regexObservacoes)) {
                  i++;
                }
                
                // Adicionar à lista de alimentos
                refeicaoAtual.alimentos.push({
                  nome,
                  porcao: porcao || '',
                  substituicoes: []
                });
              }
            }
          }
          
          // Adicionar a última refeição
          if (refeicaoAtual) {
            refeicoes.push(refeicaoAtual);
          }
          
          // Extrair informações do título para destacar o tipo de dieta
          let tipoDieta = "";
          let objetivoDieta = "";
          let caloriasTexto = "";
          
          if (tituloGeral) {
            // Verificar se contém informações sobre calorias
            const matchCalorias = tituloGeral.match(/(\d+)\s*kcal/i);
            if (matchCalorias) {
              caloriasTexto = matchCalorias[1] + " kcal";
            }
            
            // Verificar se contém informações sobre emagrecimento ou ganho
            if (tituloGeral.toLowerCase().includes("emagrecimento")) {
              objetivoDieta = "Emagrecimento";
            } else if (tituloGeral.toLowerCase().includes("ganho")) {
              objetivoDieta = "Ganho Muscular";
            }
          }
          
          // Adicionar o título do planejamento alimentar com bordas arredondadas
          doc.setFillColor(251, 146, 60); // Laranja #FB923C
          doc.roundedRect(margemEsquerda, posicaoY, larguraUtil, 10, 1, 1, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255); // Branco
          doc.text('PLANEJAMENTO ALIMENTAR', doc.internal.pageSize.width / 2, posicaoY + 6, { align: 'center' });
          posicaoY += 15;
          
          // Adicionar informações de calorias e objetivo em destaque
          if (caloriasTexto || objetivoDieta) {
            let infoText = '';
            if (caloriasTexto) infoText += caloriasTexto;
            if (caloriasTexto && objetivoDieta) infoText += ' - ';
            if (objetivoDieta) infoText += objetivoDieta;
            
            doc.setFillColor(245, 245, 245); // Cinza claro
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
            doc.setFontSize(10);
            doc.setTextColor(236, 72, 21); // Laranja
            doc.setFont('helvetica', 'bold');
            doc.text(infoText, doc.internal.pageSize.width / 2, posicaoY + 5, { align: 'center' });
            posicaoY += 13;
          }
          
          // Renderizar cada refeição como uma tabela
          for (const refeicao of refeicoes) {
            // Verificar se precisa de nova página
            const alturaEstimadaRefeicao = 15 + (refeicao.alimentos.length * 15);
            if (posicaoY + alturaEstimadaRefeicao > doc.internal.pageSize.height - margemInferior - 20) {
              adicionarRodape(paginaAtual, paginaAtual + 1);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
            }
            
            // Título da refeição com bordas arredondadas
            doc.setFillColor(251, 146, 60); // Laranja #FB923C
            doc.roundedRect(margemEsquerda, posicaoY, larguraUtil, 8, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(refeicao.nome.toUpperCase(), doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
            posicaoY += 12;
            
            // Cabeçalho da tabela com fundo preto
            doc.setFillColor(0, 0, 0); // Preto
            doc.rect(margemEsquerda, posicaoY, larguraUtil * 0.65, 7, 'F');
            doc.rect(margemEsquerda + larguraUtil * 0.65, posicaoY, larguraUtil * 0.35, 7, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Alimento', margemEsquerda + 3, posicaoY + 5);
            doc.text('Porção', margemEsquerda + larguraUtil * 0.65 + 3, posicaoY + 5);
            posicaoY += 7;
            
            // Conteúdo da tabela
            for (let i = 0; i < refeicao.alimentos.length; i++) {
              const alimento = refeicao.alimentos[i];
              const ehPar = i % 2 === 0;
              
              // Fundo da linha
              doc.setFillColor(ehPar ? 255 : 240, ehPar ? 255 : 240, ehPar ? 255 : 240);
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
              
              // Texto da linha com melhor espaçamento
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              
              // Truncar texto longo do alimento se necessário
              const textoAlimento = doc.splitTextToSize(alimento.nome, larguraUtil * 0.6)[0];
              doc.text(textoAlimento, margemEsquerda + 3, posicaoY + 5);
              
              // Truncar texto da porção se necessário  
              const textoPorcao = doc.splitTextToSize(alimento.porcao, larguraUtil * 0.32)[0];
              doc.text(textoPorcao, margemEsquerda + larguraUtil * 0.65 + 3, posicaoY + 5);
              posicaoY += 7;
              
              // Adicionar substituições se existirem
              if (alimento.substituicoes && alimento.substituicoes.length > 0) {
                // Fundo para substituições
                doc.setFillColor(255, 240, 220); // Laranja bem claro
                
                // Calcular a altura total necessária para exibir todas as substituições
                let alturaTotal = 8; // Altura para o título
                
                // Processar cada substituição individualmente
                const substituicoesProcessadas = [];
                for (const substituicao of alimento.substituicoes) {
                  // Separar cada opção de substituição se tiverem " - ou - "
                  const opcoes = substituicao.split(' - ou - ');
                  for (const opcao of opcoes) {
                    const linhasOpcao = doc.splitTextToSize('• ' + opcao.trim(), larguraUtil - 15);
                    substituicoesProcessadas.push(linhasOpcao);
                    alturaTotal += linhasOpcao.length * 4.5;
                  }
                }
                
                alturaTotal += 2; // Espaçamento final
                
                // Desenhar o retângulo de fundo com a altura correta
                doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaTotal, 'F');
                
                // Título das substituições
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(236, 72, 21); // Cor laranja para o título
                doc.text('Opções de Substituição:', margemEsquerda + 5, posicaoY + 5);
                posicaoY += 8;
                
                // Listar cada substituição formatada
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8); // Fonte menor para substituições
                doc.setTextColor(0, 0, 0);
                
                for (const linhasOpcao of substituicoesProcessadas) {
                  doc.text(linhasOpcao, margemEsquerda + 10, posicaoY);
                  posicaoY += linhasOpcao.length * 4.5;
                }
                
                posicaoY += 2;
              }
              
              // Verificar se precisa de nova página para o próximo alimento
              if (i < refeicao.alimentos.length - 1) {
                const proximoAlimento = refeicao.alimentos[i + 1];
                const temSubstituicoes = proximoAlimento.substituicoes && proximoAlimento.substituicoes.length > 0;
                const alturaProximoItem = 7 + (temSubstituicoes ? (proximoAlimento.substituicoes.length * 5 + 10) : 0);
                
                if (posicaoY + alturaProximoItem > doc.internal.pageSize.height - margemInferior - 20) {
                  adicionarRodape(paginaAtual, paginaAtual + 1);
                  doc.addPage();
                  paginaAtual++;
                  adicionarCabecalho(paginaAtual);
                  posicaoY = margemSuperior + 5;
                }
              }
            }
            
            // Adicionar observações se existirem
            if (refeicao.observacoes) {
              // Verificar se precisa de nova página
              if (posicaoY + 15 > doc.internal.pageSize.height - margemInferior - 20) {
                adicionarRodape(paginaAtual, paginaAtual + 1);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }
              
              doc.setFillColor(240, 240, 240);
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
              
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 0);
              doc.text('Observações: ', margemEsquerda + 5, posicaoY + 5);
              
              const obsTexto = refeicao.observacoes;
              doc.setFont('helvetica', 'normal');
              const obsWidth = doc.getTextWidth('Observações: ');
              const linhasObs = doc.splitTextToSize(obsTexto, larguraUtil - obsWidth - 10);
              
              if (linhasObs.length > 1) {
                // Se tiver múltiplas linhas, adicionar em linhas separadas
                posicaoY += 7;
                doc.text(linhasObs, margemEsquerda + 5, posicaoY);
                posicaoY += linhasObs.length * 5;
              } else {
                // Se for uma única linha, adicionar na mesma linha
                doc.text(obsTexto, margemEsquerda + 5 + obsWidth, posicaoY + 5);
                posicaoY += 7;
              }
            }
            
            posicaoY += 10; // Espaço após cada refeição
          }
          
          // Adicionar Lista de Compras se existir - TEMPORARIAMENTE DESABILITADO
          /* if (listaDeCompras.length > 0) {
            // Filtrar e limpar lista de compras
            const listaLimpa = listaDeCompras
              .filter(item => item && item.trim().length > 2)
              .map(item => item.trim());

            // Verificar se precisa de nova página
            const alturaEstimadaLista = 15 + Math.ceil(listaLimpa.length / 3) * 6;
            if (posicaoY + alturaEstimadaLista > doc.internal.pageSize.height - margemInferior - 20) {
              adicionarRodape(paginaAtual, paginaAtual + 1);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
            }

            // Título da lista de compras
            doc.setFillColor(251, 146, 60); // Laranja #FB923C
            doc.roundedRect(margemEsquerda, posicaoY, larguraUtil, 8, 1, 1, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text('LISTA DE COMPRAS', doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
            posicaoY += 12;

            // Calcular quantos itens por coluna (3 colunas)
            const itensTotal = listaLimpa.length;
            const itensPorColuna = Math.ceil(itensTotal / 3);
            const larguraColuna = larguraUtil / 3 - 3;

            // Desenhar itens em três colunas
            for (let i = 0; i < itensPorColuna; i++) {
              const itemColuna1 = i < listaLimpa.length ? listaLimpa[i] : null;
              const itemColuna2 = i + itensPorColuna < listaLimpa.length ? listaLimpa[i + itensPorColuna] : null;
              const itemColuna3 = i + (itensPorColuna * 2) < listaLimpa.length ? listaLimpa[i + (itensPorColuna * 2)] : null;

              // Verificar se precisa de nova página
              if (posicaoY + 7 > doc.internal.pageSize.height - margemInferior - 20) {
                adicionarRodape(paginaAtual, paginaAtual + 1);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
              }

              // Fundo colorido alternado
              const ehPar = i % 2 === 0;
              if (ehPar) {
                doc.setFillColor(245, 245, 245);
                doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
              }

              // Texto dos itens com 3 colunas
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(8);
              doc.setTextColor(0, 0, 0);

              // Calcular largura de cada coluna com margem
              const larguraColuna = (larguraUtil / 3) - 6;
              let alturaMaximaLinha = 7;

              // Processar texto de cada coluna
              const textosProcessados = [];

              // Coluna 1
              if (itemColuna1) {
                const textoColuna1 = doc.splitTextToSize('• ' + itemColuna1, larguraColuna);
                textosProcessados.push({
                  texto: textoColuna1,
                  posX: margemEsquerda + 3,
                  altura: textoColuna1.length * 4
                });
              }

              // Coluna 2
              if (itemColuna2) {
                const posX2 = margemEsquerda + larguraUtil / 3;
                const textoColuna2 = doc.splitTextToSize('• ' + itemColuna2, larguraColuna);
                textosProcessados.push({
                  texto: textoColuna2,
                  posX: posX2 + 3,
                  altura: textoColuna2.length * 4
                });
              }

              // Coluna 3
              if (itemColuna3) {
                const posX3 = margemEsquerda + (larguraUtil * 2) / 3;
                const textoColuna3 = doc.splitTextToSize('• ' + itemColuna3, larguraColuna);
                textosProcessados.push({
                  texto: textoColuna3,
                  posX: posX3 + 3,
                  altura: textoColuna3.length * 4
                });
              }

              // Encontrar altura máxima necessária
              if (textosProcessados.length > 0) {
                alturaMaximaLinha = Math.max(...textosProcessados.map(t => t.altura), 7);
              }

              // Renderizar os textos
              for (const item of textosProcessados) {
                let yOffset = 5;
                for (const linha of item.texto) {
                  doc.text(linha, item.posX, posicaoY + yOffset);
                  yOffset += 4;
                }
              }

              posicaoY += alturaMaximaLinha + 2;
            }
          } */
          
        } catch (error) {
          console.error('[gerarPDF] Erro ao processar planejamento alimentar:', error);
          console.log('[gerarPDF] Fallback para processamento como texto simples');
          processarTextoSimples(conteudo);
        }
      } else {
        // Processar como texto simples se não for um planejamento alimentar
        processarTextoSimples(conteudo);
      }
      
      function processarTextoSimples(texto: string) {
        console.log('[gerarPDF] Processando como texto simples');
        const paragrafos = texto.split('\n');
        
        for (let i = 0; i < paragrafos.length; i++) {
          const paragrafo = paragrafos[i].trim();
          
          // Pular linhas em branco
          if (paragrafo === '') {
            posicaoY += 3;
            continue;
          }
          
          // Dividir o texto em linhas para caber na largura da página
          const linhasTexto = doc.splitTextToSize(paragrafo, larguraUtil);
          const alturaTexto = linhasTexto.length * 5;
          
          // Verificar se precisa de nova página
          if (posicaoY + alturaTexto > doc.internal.pageSize.height - margemInferior - 20) {
            adicionarRodape(paginaAtual, paginaAtual + 1);
            doc.addPage();
            paginaAtual++;
            adicionarCabecalho(paginaAtual);
            posicaoY = margemSuperior + 5;
          }
          
          // Verificar se é um título (todo em maiúsculas)
          const ehTitulo = paragrafo === paragrafo.toUpperCase() && paragrafo.length > 3 && paragrafo.length < 50;
          
          if (ehTitulo) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
          } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
          }
          
          doc.text(linhasTexto, margemEsquerda, posicaoY);
          posicaoY += alturaTexto + (ehTitulo ? 5 : 3);
        }
      }
      
      // Adicionar rodapé na última página
      adicionarRodape(paginaAtual, paginaAtual);
      
      // Salvar o PDF
      const nomeArquivoCliente = perfil?.nome_completo || perfil?.nome || 'usuario';
      const nomeArquivo = `resultado_nutricional_${nomeArquivoCliente.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      
      console.log('[gerarPDF] Salvando PDF como:', nomeArquivo);
      doc.save(nomeArquivo);
      
      console.log('[gerarPDF] PDF gerado com sucesso!');
      alert('PDF da avaliação nutricional gerado com sucesso!');
    } catch (error) {
      console.error('[gerarPDF] Erro ao gerar PDF:', error);
      
      if (error instanceof Error) {
        console.error('[gerarPDF] Detalhes:', error.message);
        console.error('[gerarPDF] Stack:', error.stack);
      }
      
      alert('Erro ao gerar o PDF da avaliação nutricional. Tente novamente.');
    } finally {
      // Resetar o estado de geração
      console.log('[gerarPDF] Finalizando, resetando estado...');
      setTimeout(() => {
        setGerandoPDF(false);
      }, 1000);
    }
  };

  // Componente para exibir tela de carregamento com mensagens sequenciais
  const TelaCarregamento = () => (
    <div className="flex flex-col items-center justify-center py-12 h-[50vh]">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-orange-100 dark:border-orange-900 relative overflow-hidden">
        {/* Efeito de gradiente decorativo no topo */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800"></div>
        
        <div className="relative bg-orange-100 dark:bg-orange-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
          {mensagemCarregamento.includes('vontade') ? (
            <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : (
            <>
              <svg className="w-12 h-12 text-orange-600 dark:text-orange-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              <span className="absolute w-full h-full rounded-full bg-orange-200 dark:bg-orange-800/40 animate-ping opacity-30"></span>
            </>
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          {mensagemCarregamento.includes('vontade') 
            ? 'Carregamento Finalizado!' 
            : 'Carregando Avaliação Nutricional'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6 min-h-[50px] flex items-center justify-center">
          <span className={`transition-all duration-500 ${mensagemCarregamento.includes('vontade') ? 'text-green-600 dark:text-green-400 font-bold text-lg' : ''}`}>
            {mensagemCarregamento}
          </span>
        </p>
        
        {!mensagemCarregamento.includes('vontade') && (
          <div className="flex justify-center space-x-2 mb-4">
            <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce"></span>
            <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-75"></span>
            <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-150"></span>
          </div>
        )}
      </div>
    </div>
  );

  // Função para renderizar o conteúdo do resultado nutricional
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado nutricional disponível ainda.</div>;
    }

    // Função para processar texto simples
    const processarTextoSimples = (texto: string) => {
      return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm">
            {texto}
          </pre>
        </div>
      );
    };

    // Verificar se o conteúdo parece ser um planejamento alimentar
    const pareceSerPlanejamentoAlimentar = conteudo.includes('Planejamento alimentar') || 
                                      conteudo.includes('Café da manhã') ||
                                      conteudo.includes('Almoço') ||
                                      conteudo.includes('Jantar') ||
                                      conteudo.includes('kcal') ||
                                      conteudo.includes('Colação') ||
                                      conteudo.includes('Ceia');

    if (pareceSerPlanejamentoAlimentar) {
      try {
        // Dividir o conteúdo em linhas
        const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
        
        // Array para armazenar as refeições
        const refeicoes: any[] = [];
        let refeicaoAtual: any = null;
        let tituloGeral = '';
        let listaDeCompras: string[] = [];
        let emListaDeCompras = false;
        
        // Expressões regulares para identificar refeições
        const regexRefeicao = /^(Café da manhã|Colação|Almoço|Lanche da Tarde|Lanche da Tarde Substituto|Jantar|Ceia)\s*$/i;
        const regexObservacoes = /^Observações:(.+)/i;
        const regexSubstituicoes = /^• Opções de substituição para (.+):$/i;
        const regexAlimento = /^([^•].+)$/i;
        const regexTitulo = /^Planejam[e|n]to Alimentar\s+(.+)/i;
        const regexListaCompras = /^Lista de compras\s*$/i;
        
        // Variáveis para controle
        let emObservacoes = false;
        let emSubstituicoes = false;
        let alimentoAtual = '';
        let substituicoes: string[] = [];
        
        // Processar cada linha
        for (let i = 0; i < linhas.length; i++) {
          const linha = linhas[i].trim();
          
          // Verificar se é uma linha com o tipo/calorias do plano
          if (linha.includes('kcal') && (linha.includes('Emagrecimento') || linha.includes('Ganho'))) {
            console.log('Encontrada linha de calorias/objetivo:', linha);
            
            // Verificar e corrigir duplicações no título
            if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
              console.log('Detectada duplicação no título:', linha);
              tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
            } else {
              tituloGeral = linha;
            }
            continue;
          }
          
          // Verificar se é o título geral
          const matchTitulo = linha.match(regexTitulo);
          if (matchTitulo) {
            console.log('Encontrado título:', linha);
            if (!tituloGeral) {
              // Verificar e corrigir duplicações no título
              if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                  linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                console.log('Detectada duplicação no título:', linha);
                tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
              } else {
                tituloGeral = linha;
              }
            }
            continue;
          }
          
          // Verificar se é o início da lista de compras
          const matchListaCompras = linha.match(regexListaCompras);
          if (matchListaCompras || (linha.includes('Lista de compras') && !emSubstituicoes)) {
            emListaDeCompras = true;
            emObservacoes = false;
            emSubstituicoes = false;
            
            // Se estávamos em uma refeição, adicioná-la antes
            if (refeicaoAtual) {
              refeicoes.push(refeicaoAtual);
              refeicaoAtual = null;
            }
            continue;
          }
          
          // Se estamos na lista de compras, adicionar item
          if (emListaDeCompras) {
            // Ignorar linhas que parecem títulos de refeição ou outras seções
            if (!linha.match(regexRefeicao) && !linha.match(regexTitulo) && 
                !linha.includes('Planejamento alimentar') && !linha.startsWith('•')) {
              listaDeCompras.push(linha);
            }
            continue;
          }
          
          // Verificar se é um nome de refeição
          const matchRefeicao = linha.match(regexRefeicao);
          if (matchRefeicao) {
            // Se já temos uma refeição atual, adicionar ao array
            if (refeicaoAtual) {
              refeicoes.push(refeicaoAtual);
            }
            
            // Criar nova refeição
            refeicaoAtual = {
              nome: matchRefeicao[1],
              alimentos: [],
              observacoes: '',
            };
            
            emObservacoes = false;
            emSubstituicoes = false;
            continue;
          }
          
          // Verificar se estamos em uma refeição
          if (refeicaoAtual) {
            // Verificar se é o início de observações
            const matchObservacoes = linha.match(regexObservacoes);
            if (matchObservacoes) {
              emObservacoes = true;
              refeicaoAtual.observacoes = matchObservacoes[1].trim();
              continue;
            }
            
            // Se estamos em observações, adicionar à observação atual
            if (emObservacoes) {
              refeicaoAtual.observacoes += ' ' + linha;
              continue;
            }
            
            // Verificar se é o início de substituições
            const matchSubstituicoes = linha.match(regexSubstituicoes);
            if (matchSubstituicoes) {
              emSubstituicoes = true;
              alimentoAtual = matchSubstituicoes[1].trim();
              substituicoes = [];
              continue;
            }
            
            // Se estamos em substituições
            if (emSubstituicoes) {
              if (linha.startsWith('•')) {
                // Nova substituição, salvar as anteriores
                if (substituicoes.length > 0) {
                  // Encontrar o alimento correspondente
                  const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                    (alimento: any) => alimento.nome === alimentoAtual
                  );
                  
                  if (alimentoIndex !== -1) {
                    refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                  }
                  
                  // Reiniciar para a nova substituição
                  const novoMatchSubstituicoes = linha.match(/^• Opções de substituição para (.+):$/i);
                  if (novoMatchSubstituicoes) {
                    alimentoAtual = novoMatchSubstituicoes[1].trim();
                    substituicoes = [];
                  }
                }
              } else {
                // Adicionar à lista de substituições
                substituicoes.push(linha);
                
                // Verificar se estamos no final da lista de substituições
                if (i + 1 === linhas.length || 
                    linhas[i + 1].match(regexRefeicao) || 
                    linhas[i + 1].match(regexObservacoes) ||
                    linhas[i + 1].match(regexListaCompras) ||
                    linhas[i + 1].startsWith('•')) {
                  // Encontrar o alimento correspondente
                  const alimentoIndex = refeicaoAtual.alimentos.findIndex(
                    (alimento: any) => alimento.nome === alimentoAtual
                  );
                  
                  if (alimentoIndex !== -1) {
                    refeicaoAtual.alimentos[alimentoIndex].substituicoes = substituicoes;
                  }
                  
                  // Fim das substituições
                  if (i + 1 < linhas.length && !linhas[i + 1].startsWith('•')) {
                    emSubstituicoes = false;
                  }
                }
              }
              continue;
            }
            
            // Se não estamos em observações nem substituições, deve ser um alimento
            const matchAlimento = linha.match(regexAlimento);
            if (matchAlimento && !linha.startsWith('•') && !linha.includes('Lista de compras')) {
              // Extrair nome e porção
              const partes = linha.split('\n');
              const nome = partes[0].trim();
              const porcao = i + 1 < linhas.length ? linhas[i + 1].trim() : '';
              
              // Pular a linha da porção se necessário
              if (porcao && !porcao.startsWith('•') && !porcao.match(regexRefeicao) && !porcao.match(regexObservacoes)) {
                i++;
              }
              
              // Adicionar à lista de alimentos
              refeicaoAtual.alimentos.push({
                nome,
                porcao: porcao || '',
                substituicoes: []
              });
            }
          }
        }
        
        // Adicionar a última refeição
        if (refeicaoAtual) {
          refeicoes.push(refeicaoAtual);
        }
        
        // Extrair informações do título para destacar o tipo de dieta
        let tipoDieta = "";
        let objetivoDieta = "";
        let caloriasTexto = "";
        
        if (tituloGeral) {
          // Verificar se contém informações sobre calorias
          const matchCalorias = tituloGeral.match(/(\d+)\s*kcal/i);
          if (matchCalorias) {
            caloriasTexto = matchCalorias[1] + " kcal";
          }
          
          // Verificar se contém informações sobre emagrecimento ou ganho
          if (tituloGeral.toLowerCase().includes("emagrecimento")) {
            objetivoDieta = "Emagrecimento";
          } else if (tituloGeral.toLowerCase().includes("ganho")) {
            objetivoDieta = "Ganho Muscular";
          }
        }
        
        // Renderizar o planejamento alimentar em uma interface moderna
        return (
          <div className="space-y-6">
            {/* Observações Personalizadas do Nutricionista */}
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
                        Observações do Nutricionista
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

            {/* Título principal com informações de calorias e objetivo */}
            {tituloGeral && (
              <div className="bg-orange-500 text-white p-3 rounded-t-lg text-center font-bold text-lg">
                {tituloGeral}
              </div>
            )}
            
            {/* Lista de refeições */}
            <div className="space-y-6">
              {refeicoes.map((refeicao, index) => (
                <div 
                  key={index} 
                  className={`overflow-hidden rounded-xl shadow-lg border ${
                    isDarkMode 
                      ? 'border-orange-500/30 bg-slate-800/80' 
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="bg-orange-500 py-2 px-4 text-white font-bold text-center">
                    {refeicao.nome}
                  </div>
                  
                  {/* Layout desktop - tabela */}
                  <div className="hidden md:block">
                    <div className="grid grid-cols-2 bg-orange-500/80 font-bold text-white">
                      <div className="p-3 text-left border-r border-orange-300">Alimento</div>
                      <div className="p-3 text-left">Porção</div>
                    </div>
                    
                    {refeicao.alimentos.map((alimento: any, alIndex: number) => (
                      <div key={alIndex}>
                        <div className={`grid grid-cols-2 ${
                          alIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        } border-t border-orange-500/20 ${
                          isDarkMode ? 'text-black' : 'text-gray-800'
                        }`}>
                          <div className="p-3 border-r border-orange-500/20">{alimento.nome}</div>
                          <div className="p-3">{alimento.porcao}</div>
                        </div>
                        
                        {/* Substituições para desktop */}
                        {alimento.substituicoes && alimento.substituicoes.length > 0 && (
                          <div className="bg-orange-50 border-t border-orange-200 p-3 pl-8 grid grid-cols-1 gap-1">
                            <div className="text-orange-600 font-semibold mb-1">
                              Opções de substituição:
                            </div>
                            {alimento.substituicoes.map((sub: string, subIndex: number) => (
                              <div key={subIndex} className="text-gray-700 pl-2 border-l-2 border-orange-200">
                                {sub}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Layout mobile - lista */}
                  <div className="md:hidden">
                    {refeicao.alimentos.map((alimento: any, alIndex: number) => (
                      <div 
                        key={alIndex} 
                        className={`
                          ${alIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                          border-t border-orange-500/20 p-3
                          ${isDarkMode ? 'text-black' : 'text-gray-800'}
                        `}
                      >
                        <div className="font-bold text-orange-500 text-sm">Alimento:</div>
                        <div className="mb-2">{alimento.nome}</div>
                        
                        <div className="font-bold text-orange-500 text-sm">Porção:</div>
                        <div className="mb-2">{alimento.porcao}</div>
                        
                        {/* Substituições para mobile */}
                        {alimento.substituicoes && alimento.substituicoes.length > 0 && (
                          <div className="mt-2">
                            <div className="font-bold text-orange-500 text-sm">
                              Opções de substituição:
                            </div>
                            <div className="bg-orange-50 rounded p-2 mt-1">
                              {alimento.substituicoes.map((sub: string, subIndex: number) => (
                                <div key={subIndex} className="text-gray-700 mb-1 last:mb-0">
                                  {sub}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Observações */}
                  {refeicao.observacoes && (
                    <div className="bg-gray-100 p-3 border-t border-gray-200">
                      <span className="font-semibold">Observações:</span> {refeicao.observacoes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Lista de Compras - TEMPORARIAMENTE DESABILITADA */}
            {/* {listaDeCompras.length > 0 && (
              <div className="mt-8">
                <div className="bg-orange-500 text-white p-3 rounded-t-lg text-center font-bold text-lg">
                  Lista de Compras
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white dark:bg-gray-800 rounded-b-lg">
                  {listaDeCompras.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-3 rounded-lg ${
                        index % 2 === 0
                          ? 'bg-orange-50 dark:bg-orange-900/20'
                          : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                      <span className="text-gray-800 dark:text-gray-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )} */}
          </div>
        );
      } catch (error) {
        console.error('Erro ao processar planejamento alimentar:', error);
        // Em caso de erro, retornar o conteúdo bruto
        return processarTextoSimples(conteudo);
      }
    }

    // Renderizar como texto simples
    return (
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 font-sans text-sm">
          {conteudo}
        </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modal de vídeo */}
      {videoModalUrl && (
        <VideoModal videoUrl={videoModalUrl} onClose={() => setVideoModalUrl(null)} />
      )}
      
      {/* Layout Responsivo */}
      <div className="lg:flex lg:h-screen">
        {/* Layout Desktop - Split Screen */}
        <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
          <div className="flex-1 flex flex-col">
            {/* Cabeçalho Desktop */}
            <div className="mb-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="mb-3 p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Programação Nutricional
                </h1>
              </div>
              <div className="h-1 w-24 bg-orange-600 mb-3 rounded-full"></div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                Confira sua programação nutricional personalizada e comece a transformar sua saúde hoje mesmo.
              </p>
            </div>

            {/* Seus Dados Desktop */}
            {dadosCliente && (
              <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-3">Seus Dados</h3>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Peso Atual
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.peso} kg
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Altura
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.altura} cm
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1 text-xs">
                      Peso Habitual
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.peso_habitual} kg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação Desktop */}
            <div className="mb-4 space-y-2">
              <button
                onClick={() => navigate('/resultado-fisico')}
                className="w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ver Programação Física
              </button>

              <button
                onClick={() => {
                  console.log("Botão 'Baixar PDF' clicado");
                  gerarPDF();
                }}
                disabled={gerandoPDF || !perfil?.resultado_nutricional || carregando}
                className={`
                  w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${gerandoPDF || !perfil?.resultado_nutricional || carregando
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow'}
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

            {/* Navegação por Seções Desktop */}
            {!carregando && perfilLiberado && perfil?.resultado_nutricional && secoesDisponiveis.length > 0 && (
              <div className="flex-1 flex flex-col">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-orange-200 dark:border-orange-700 p-4 mb-4">
                  <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    Seções Disponíveis
                  </h4>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {/* Botão Ver Completo */}
                    <div 
                      className={`
                        flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 border-l-4
                        ${secaoSelecionada === 'completo' ? 
                          'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300' : 
                          'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-400'
                        }
                      `}
                      onClick={() => setSecaoSelecionada('completo')}
                    >
                      <div className="flex items-center">
                        <span className="text-lg mr-3">📋</span>
                        <span className="text-sm font-medium">Ver Completo</span>
                      </div>
                    </div>
                    
                    {/* Botões das Seções */}
                    {secoesDisponiveis.map((secao) => {
                      const icones: { [key: string]: string } = {
                        'Café da manhã': '☕',
                        'Colação': '🍎',
                        'Almoço': '🍽️',
                        'Lanche da Tarde': '🥪',
                        'Jantar': '🍛',
                        'Ceia': '🥛'
                      };
                      
                      return (
                        <div 
                          key={secao}
                          className={`
                            flex items-center p-2 rounded-md cursor-pointer transition-all duration-200 border-l-4
                            ${secaoSelecionada === secao ? 
                              'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300' : 
                              'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-400'
                            }
                          `}
                          onClick={() => setSecaoSelecionada(secao)}
                        >
                          <div className="flex items-center">
                            <span className="text-lg mr-3">{icones[secao] || '🍴'}</span>
                            <span className="text-sm font-medium">{secao}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Dica Importante - só mostra se não tiver seções ou não estiver carregado */}
            {(!perfil?.resultado_nutricional || secoesDisponiveis.length === 0) && (
              <div className="flex-1 flex flex-col justify-center">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200">Dica Importante</h4>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Siga sua programação nutricional com consistência. Pequenas mudanças diárias geram grandes resultados!
                  </p>
                </div>
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
            ) : perfil?.resultado_nutricional ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                  {secaoSelecionada === 'completo' 
                    ? 'Sua Programação Nutricional Completa'
                    : `${secaoSelecionada}`
                  }
                </h2>
                
                <div className="custom-scrollbar">
                  {renderizarResultado(filtrarConteudoPorSecao(perfil.resultado_nutricional, secaoSelecionada))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="text-center max-w-md">
                  <div className="relative bg-orange-100 dark:bg-orange-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span className="absolute w-full h-full rounded-full bg-orange-200 dark:bg-orange-800/40 animate-ping opacity-30"></span>
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                    Resultado em Processamento
                  </h2>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    A programação nutricional está sendo elaborada pela nossa equipe de especialistas.
                  </p>
                  
                  <div className="flex justify-center space-x-2 mb-4">
                    <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce"></span>
                    <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-75"></span>
                    <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-150"></span>
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
                className="mb-4 p-1.5 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <h1 className="text-2xl font-bold">
                <div className="text-orange-600">Programação Nutricional</div>
              </h1>
              <div className="h-1 w-32 bg-orange-600 mt-2 mb-4 rounded-full"></div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Confira sua programação nutricional personalizada e comece a transformar sua saúde hoje mesmo.
              </p>
            </div>

            {/* Seus Dados Mobile */}
            {dadosCliente && (
              <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-400 mb-4">Seus Dados</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Peso Atual
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.peso} kg
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Altura
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.altura} cm
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Peso Habitual
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {dadosCliente.peso_habitual} kg
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Conteúdo principal Mobile */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-orange-100 dark:border-orange-900">
              <div className="relative border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center">
                    <div className="w-1 h-6 bg-orange-600 rounded-full mr-3"></div>
                    <h2 className="text-base font-medium text-gray-800 dark:text-white">
                      Sua programação nutricional
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={() => navigate('/resultado-fisico')}
                      className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white shadow-sm hover:shadow transition-all"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Ver Programação Física
                    </button>

                    <button
                      onClick={() => {
                        console.log("Botão 'Baixar PDF' clicado");
                        gerarPDF();
                      }}
                      disabled={gerandoPDF || !perfil?.resultado_nutricional || carregando}
                      className={`
                        flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium 
                        ${gerandoPDF || !perfil?.resultado_nutricional || carregando
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm hover:shadow transition-all'}
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
                ) : perfil?.resultado_nutricional ? (
                  <div className="custom-scrollbar overflow-y-auto">
                    {/* Navegação por Seções Mobile */}
                    {!carregando && perfilLiberado && perfil?.resultado_nutricional && secoesDisponiveis.length > 0 && (
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                          </svg>
                          Seções Disponíveis
                        </h4>
                        
                        <div className="space-y-2">
                          {/* Botão Ver Completo Mobile */}
                          <div 
                            className={`
                              flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4
                              ${secaoSelecionada === 'completo' ? 
                                'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300' : 
                                'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-400'
                              }
                            `}
                            onClick={() => setSecaoSelecionada('completo')}
                          >
                            <span className="text-xl mr-3">📋</span>
                            <span className="text-sm font-medium">Ver Completo</span>
                          </div>
                          
                          {/* Lista de Seções Mobile */}
                          <div className="grid grid-cols-1 gap-2">
                            {secoesDisponiveis.map((secao) => {
                              const icones: { [key: string]: string } = {
                                'Café da manhã': '☕',
                                'Colação': '🍎',
                                'Almoço': '🍽️',
                                'Lanche da Tarde': '🥪',
                                'Jantar': '🍛',
                                'Ceia': '🥛'
                              };
                              
                              return (
                                <div 
                                  key={secao}
                                  className={`
                                    flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 border-l-4
                                    ${secaoSelecionada === secao ? 
                                      'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300' : 
                                      'bg-gray-50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-400'
                                    }
                                  `}
                                  onClick={() => setSecaoSelecionada(secao)}
                                >
                                  <span className="text-xl mr-3">{icones[secao] || '🍴'}</span>
                                  <span className="text-sm font-medium">{secao}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Conteúdo Nutricional Mobile */}
                    <div className="p-4">
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                          {secaoSelecionada === 'completo' 
                            ? 'Programação Nutricional Completa'
                            : `${secaoSelecionada}`
                          }
                        </h3>
                      </div>
                      {renderizarResultado(filtrarConteudoPorSecao(perfil.resultado_nutricional, secaoSelecionada))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full text-center shadow-lg border border-orange-100 dark:border-orange-900 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-400 via-orange-600 to-orange-800"></div>
                      
                      <div className="relative bg-orange-100 dark:bg-orange-900/30 w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span className="absolute w-full h-full rounded-full bg-orange-200 dark:bg-orange-800/40 animate-ping opacity-30"></span>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Resultado em Processamento</h2>
                      
                      <p className="text-gray-600 dark:text-gray-300 mb-6">
                        A programação nutricional está sendo elaborada pela nossa equipe de especialistas.
                      </p>
                      
                      <div className="flex justify-center space-x-2 mb-4">
                        <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce"></span>
                        <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-75"></span>
                        <span className="w-3 h-3 rounded-full bg-orange-600 animate-bounce delay-150"></span>
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
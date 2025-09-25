import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, Scale, ArrowLeft, Loader2, Download, Clock, Sun, Moon, FileText, Activity, Heart, Play, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import { extrairNomeExercicio, encontrarVideoDoExercicio } from '../utils/exercicios';
import { BotaoMetodoTreino } from '../components/BotaoMetodoTreino';
import { formatarMetodoPDF } from '../utils/metodosTreino';

// Adicione estas classes ao seu arquivo de estilos globais ou como uma constante
const themeStyles = {
  light: {
    background: "bg-gradient-to-b from-gray-100 to-white",
    text: "text-gray-800",
    textSecondary: "text-gray-600",
    card: "bg-white shadow-lg border border-gray-200",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
    buttonSecondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    input: "bg-white border border-gray-300 focus:border-orange-500",
    scrollbar: {
      track: "bg-gray-200",
      thumb: "bg-orange-400/50 hover:bg-orange-400/70"
    }
  },
  dark: {
    background: "bg-gradient-to-b from-slate-900 to-slate-800",
    text: "text-white",
    textSecondary: "text-gray-300",
    card: "bg-slate-800/80 backdrop-blur-sm border border-orange-500/20",
    button: "bg-orange-500 hover:bg-orange-600 text-white",
    buttonSecondary: "bg-slate-700 hover:bg-slate-600 text-white",
    input: "bg-slate-700 border border-slate-600 focus:border-orange-500",
    scrollbar: {
      track: "bg-slate-700",
      thumb: "bg-orange-500/50 hover:bg-orange-500/70"
    }
  }
};

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
}

// Componente Modal de Vídeo
const VideoModal = ({ videoUrl, onClose }: { videoUrl: string; onClose: () => void }) => {
  // Extrair o ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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
  const [gerandoFisica, setGerandoFisica] = useState(false);
  const [gerandoNutricional, setGerandoNutricional] = useState(false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [perfilLiberado, setPerfilLiberado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const location = useLocation();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  const [activeTab, setActiveTab] = useState<'fisica' | 'nutricional'>('fisica');
  const [error, setError] = useState<string | null>(null);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  
  // Obter o ID da query string
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

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

  // Função específica para gerar PDF da avaliação nutricional
  const gerarPDFNutricional = async () => {
    console.log('[gerarPDFNutricional] Iniciando geração...');
    
    if (!perfil) {
      console.error('[gerarPDFNutricional] Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_nutricional;
      
    if (!conteudo) {
      console.error('[gerarPDFNutricional] Conteúdo nutricional não disponível');
      alert('Não há resultado de avaliação nutricional disponível para gerar o PDF');
      return;
    }

    try {
      console.log('[gerarPDFNutricional] Definindo estado...');
        setGerandoNutricional(true);
      
      console.log('[gerarPDFNutricional] Conteúdo encontrado, tamanho:', conteudo.length);
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Definições de margens e dimensões
      const margemEsquerda = 15;
      const margemDireita = 15;
      const margemSuperior = 30;
      const margemInferior = 20;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      // Variáveis de controle de página e posição
      let paginaAtual = 1;
      let posicaoY = margemSuperior + 5;
      
      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pagina: number) => {
        // Retângulo laranja do cabeçalho
        doc.setFillColor(236, 72, 21); // Laranja vivo
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // Texto branco
        doc.text('RESULTADO DA AVALIAÇÃO NUTRICIONAL', doc.internal.pageSize.width / 2, 13, { align: 'center' });
        
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
              console.log('[gerarPDFNutricional] Encontrada linha de calorias/objetivo:', linha);
              
              // Verificar e corrigir duplicações no título
              if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                  linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                console.log('[gerarPDFNutricional] Detectada duplicação no título:', linha);
                tituloGeral = linha.replace(/planejam[e|n]to\s+alimentar\s+planejam[e|n]to\s+alimentar/i, 'Planejamento Alimentar');
              } else {
                tituloGeral = linha;
              }
              continue;
            }
            
            // Verificar se é o título geral
            const matchTitulo = linha.match(regexTitulo);
            if (matchTitulo) {
              console.log('[gerarPDFNutricional] Encontrado título:', linha);
              if (!tituloGeral) {
                // Verificar e corrigir duplicações no título
                if (linha.toLowerCase().includes('planejamento alimentar planejamento alimentar') || 
                    linha.toLowerCase().includes('planejamento alimentar planejamneto alimentar')) {
                  console.log('[gerarPDFNutricional] Detectada duplicação no título:', linha);
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
          
          // Adicionar a última refeição se existir
          if (refeicaoAtual) {
            refeicoes.push(refeicaoAtual);
          }
          
          // Extrair informações do título
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
          
          // Adicionar o título do planejamento alimentar logo após o cabeçalho
          doc.setFillColor(236, 72, 21); // Laranja
          doc.rect(margemEsquerda, posicaoY, larguraUtil, 10, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(255, 255, 255); // Branco
          doc.text('Planejamento Alimentar', doc.internal.pageSize.width / 2, posicaoY + 6, { align: 'center' });
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
            
            // Título da refeição
            doc.setFillColor(236, 72, 21); // Laranja vivo
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(refeicao.nome, doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
            posicaoY += 12;
            
            // Cabeçalho da tabela
            doc.setFillColor(245, 130, 32); // Laranja mais claro
            doc.rect(margemEsquerda, posicaoY, larguraUtil / 2, 7, 'F');
            doc.rect(margemEsquerda + larguraUtil / 2, posicaoY, larguraUtil / 2, 7, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text('Alimento', margemEsquerda + 5, posicaoY + 5);
            doc.text('Porção', margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
            posicaoY += 7;
            
            // Conteúdo da tabela
            for (let i = 0; i < refeicao.alimentos.length; i++) {
              const alimento = refeicao.alimentos[i];
              const ehPar = i % 2 === 0;
              
              // Fundo da linha
              doc.setFillColor(ehPar ? 255 : 240, ehPar ? 255 : 240, ehPar ? 255 : 240);
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 7, 'F');
              
              // Texto da linha
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'normal');
              doc.text(alimento.nome, margemEsquerda + 5, posicaoY + 5);
              doc.text(alimento.porcao, margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
              posicaoY += 7;
              
              // Adicionar substituições se existirem
              if (alimento.substituicoes && alimento.substituicoes.length > 0) {
                // Fundo para substituições
                doc.setFillColor(255, 240, 220); // Laranja bem claro
                
                // Calcular a altura total necessária para exibir todas as substituições
                let alturaTotal = 8; // Altura para o título
                
                // Pré-calcular as linhas de texto para cada substituição
                const todasAsLinhas = [];
                for (const substituicao of alimento.substituicoes) {
                  const linhasSubst = doc.splitTextToSize('• ' + substituicao, larguraUtil - 10);
                  todasAsLinhas.push(linhasSubst);
                  alturaTotal += linhasSubst.length * 5;
                }
                
                alturaTotal += 2; // Espaçamento final
                
                // Desenhar o retângulo de fundo com a altura correta
                doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaTotal, 'F');
                
                // Título das substituições
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(236, 72, 21); // Cor laranja para o título
                doc.text('Opções de Substituição:', margemEsquerda + 5, posicaoY + 5);
                posicaoY += 8;
                
                // Listar cada substituição
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                
                for (let j = 0; j < alimento.substituicoes.length; j++) {
                  doc.setFontSize(9);
                  // Usar as linhas pré-calculadas
                  const linhasSubst = todasAsLinhas[j];
                  doc.text(linhasSubst, margemEsquerda + 7, posicaoY);
                  posicaoY += linhasSubst.length * 5;
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
            // Verificar se precisa de nova página
            const alturaEstimadaLista = 15 + Math.ceil(listaDeCompras.length / 2) * 7;
            if (posicaoY + alturaEstimadaLista > doc.internal.pageSize.height - margemInferior - 20) {
              adicionarRodape(paginaAtual, paginaAtual + 1);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
            }

            // Título da lista de compras
            doc.setFillColor(236, 72, 21); // Laranja vivo
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text('Lista de Compras', doc.internal.pageSize.width / 2, posicaoY + 5.5, { align: 'center' });
            posicaoY += 12;

            // Calcular quantos itens por coluna
            const itensTotal = listaDeCompras.length;
            const itensPorColuna = Math.ceil(itensTotal / 2);
            const larguraColuna = larguraUtil / 2 - 5;

            // Desenhar itens em duas colunas
            for (let i = 0; i < itensPorColuna; i++) {
              const itemEsquerda = listaDeCompras[i];
              const itemDireita = i + itensPorColuna < itensTotal ? listaDeCompras[i + itensPorColuna] : null;

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

              // Texto dos itens
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              doc.setTextColor(0, 0, 0);

              // Item da esquerda
              doc.text('• ' + itemEsquerda, margemEsquerda + 5, posicaoY + 5);

              // Item da direita (se existir)
              if (itemDireita) {
                doc.text('• ' + itemDireita, margemEsquerda + larguraUtil / 2 + 5, posicaoY + 5);
              }

              posicaoY += 7;
            }
          } */
          
        } catch (error) {
          console.error('[gerarPDFNutricional] Erro ao processar planejamento alimentar:', error);
          console.log('[gerarPDFNutricional] Fallback para processamento como texto simples');
          processarTextoSimples();
        }
      } else {
        // Processar como texto simples se não for um planejamento alimentar
        processarTextoSimples();
      }
      
      function processarTextoSimples() {
        console.log('[gerarPDFNutricional] Processando como texto simples');
        const paragrafos = conteudo.split('\n');
        
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
      
      console.log('[gerarPDFNutricional] Salvando PDF como:', nomeArquivo);
      doc.save(nomeArquivo);
      
      console.log('[gerarPDFNutricional] PDF gerado com sucesso!');
      alert('PDF da avaliação nutricional gerado com sucesso!');
    } catch (error) {
      console.error('[gerarPDFNutricional] Erro ao gerar PDF:', error);
      
      if (error instanceof Error) {
        console.error('[gerarPDFNutricional] Detalhes:', error.message);
        console.error('[gerarPDFNutricional] Stack:', error.stack);
      }
      
      alert('Erro ao gerar o PDF da avaliação nutricional. Tente novamente.');
    } finally {
      // Resetar o estado de geração
      console.log('[gerarPDFNutricional] Finalizando, resetando estado...');
      setTimeout(() => {
        setGerandoNutricional(false);
      }, 1000);
    }
  };

  const gerarPDFFisica = async () => {
    console.log('[gerarPDFFisica] Iniciando geração...');
    
    if (!perfil) {
      console.error('[gerarPDFFisica] Perfil não encontrado');
      alert('Perfil não encontrado. Não é possível gerar o PDF.');
      return;
    }
    
    const conteudo = perfil.resultado_fisica;
    
    if (!conteudo) {
      console.error('[gerarPDFFisica] Conteúdo físico não disponível');
      alert('Não há resultado de avaliação física disponível para gerar o PDF');
      return;
    }
    
    try {
      console.log('[gerarPDFFisica] Definindo estado...');
      setGerandoFisica(true);
      
      console.log('[gerarPDFFisica] Conteúdo encontrado, tamanho:', conteudo.length);
      
      // Configuração do documento
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Definições de margens e dimensões - REDUZINDO MARGENS AINDA MAIS
      const margemEsquerda = 5;
      const margemDireita = 5;
      const margemSuperior = 20;
      const margemInferior = 10;
      const larguraUtil = doc.internal.pageSize.width - margemEsquerda - margemDireita;
      
      // Variáveis de controle de página e posição
      let paginaAtual = 1;
      let posicaoY = margemSuperior + 5;
      
      // Função para adicionar cabeçalho
      const adicionarCabecalho = (pagina: number) => {
        // Retângulo laranja do cabeçalho
        doc.setFillColor(236, 72, 21); // Laranja vivo
        doc.rect(0, 0, doc.internal.pageSize.width, 20, 'F');
        
        // Título
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255); // Texto branco
        doc.text('RESULTADO DA AVALIAÇÃO FÍSICA', doc.internal.pageSize.width / 2, 13, { align: 'center' });
        
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
      
      if (pareceSerFichaDeTreino) {
        // Processar como ficha de treino
        try {
          // Processar o conteúdo linha por linha para extrair treinos e exercícios
          const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
          
          // Array para armazenar os treinos
          const treinos: Treino[] = [];
          let treinoAtual: Treino | null = null;
          
          // Expressão regular para identificar linhas de treino (ex: "TREINO A: FEMININO (PRIMEIRO MÊS)")
          const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]\s*|\s+)(.+)?/i;
          
          // Expressão para identificar exercícios numerados
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
              
              // Criar novo treino
              treinoAtual = {
                letra: matchTreino[1], // A, B, C, etc.
                descricao: matchTreino[2] || '',
                titulo: linha,
                exercicios: []
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
                
                // Tentar extrair séries e repetições do nome
                const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9/]+(?:\s*a\s*\d+)?)/;
                const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
                
                let nome = nomeCompleto;
                let series = '';
                let repeticoes = '';
                
                if (matchSeriesReps) {
                  // Remover a parte de séries/reps do nome
                  nome = nomeCompleto.replace(matchSeriesReps[0], '').trim();
                  series = matchSeriesReps[1] + 'x';
                  repeticoes = matchSeriesReps[2];
                } else {
                  // Tentar encontrar padrões específicos como "3 X 12 (CADA LADO)"
                  const regexEspecial = /(\d+)\s*[xX]\s*([0-9/]+(?:\s*a\s*\d+)?)\s*\(([^)]+)\)/;
                  const matchEspecial = nomeCompleto.match(regexEspecial);
                  
                  if (matchEspecial) {
                    nome = nomeCompleto.replace(matchEspecial[0], '').trim() + ' (' + matchEspecial[3] + ')';
                    series = matchEspecial[1] + 'x';
                    repeticoes = matchEspecial[2];
                  }
                }
                
                // Verificar séries e repetições na próxima linha
                if (!series && i + 1 < linhas.length) {
                  const proximaLinha = linhas[i + 1].trim();
                  if (/^\d+x\s+\d+/.test(proximaLinha)) {
                    const partes = proximaLinha.split(/\s+/);
                    if (partes.length >= 2) {
                      series = partes[0];
                      repeticoes = partes[1];
                      i++; // Avançar para pular a linha processada
                    }
                  }
                }
                
                // Adicionar à lista de exercícios
                treinoAtual.exercicios.push({
                  numero,
                  nome,
                  series: series || '3x', // Valor padrão
                  repeticoes: repeticoes || '15/12/10' // Valor padrão
                });
              }
            }
          }
          
          // Adicionar o último treino se existir
          if (treinoAtual) {
            treinos.push(treinoAtual);
          }
          
          // Renderizar os treinos no PDF
          for (const treino of treinos) {
            // Verificar se precisa de nova página
            if (posicaoY + 100 > doc.internal.pageSize.height - margemInferior) {
              adicionarRodape(paginaAtual, paginaAtual + 1);
              doc.addPage();
              paginaAtual++;
              adicionarCabecalho(paginaAtual);
              posicaoY = margemSuperior + 5;
            }
            
            // Adicionar título do treino
            doc.setFillColor(236, 72, 21); // Laranja vivo
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 10, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(treino.titulo, doc.internal.pageSize.width / 2, posicaoY + 6.5, { align: 'center' });
            
            posicaoY += 10;
            
            // Adicionar cabeçalho da tabela
            doc.setFillColor(0, 0, 0);
            doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            
            // Dividir a largura em 4 colunas (exercício, séries, repetições, vídeo)
            const colunaExercicio = larguraUtil * 0.5; // 50% para exercício
            const colunaSeries = larguraUtil * 0.15; // 15% para séries
            const colunaReps = larguraUtil * 0.15; // 15% para repetições
            const colunaVideo = larguraUtil * 0.2; // 20% para vídeo
            
            doc.text('Exercício', margemEsquerda + 4, posicaoY + 5);
            doc.text('Séries', margemEsquerda + colunaExercicio + colunaSeries/2, posicaoY + 5, { align: 'center' });
            doc.text('Repetições', margemEsquerda + colunaExercicio + colunaSeries + colunaReps/2, posicaoY + 5, { align: 'center' });
            
            posicaoY += 8;
            
            // Adicionar exercícios
            for (let i = 0; i < treino.exercicios.length; i++) {
              const exercicio = treino.exercicios[i];
              const ehPar = i % 2 === 0;
              
              // Verificar se precisa de nova página
              if (posicaoY + 10 > doc.internal.pageSize.height - margemInferior) {
                adicionarRodape(paginaAtual, paginaAtual + 1);
                doc.addPage();
                paginaAtual++;
                adicionarCabecalho(paginaAtual);
                posicaoY = margemSuperior + 5;
                
                // Repetir cabeçalho da tabela na nova página
                doc.setFillColor(0, 0, 0);
                doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                
                doc.text('Exercício', margemEsquerda + 4, posicaoY + 5);
                doc.text('Séries', margemEsquerda + colunaExercicio + colunaSeries/2, posicaoY + 5, { align: 'center' });
                doc.text('Repetições', margemEsquerda + colunaExercicio + colunaSeries + colunaReps/2, posicaoY + 5, { align: 'center' });
                
                posicaoY += 8;
              }
              
              // Cor de fundo alternada para as linhas
              doc.setFillColor(ehPar ? 240 : 255, ehPar ? 240 : 255, ehPar ? 240 : 255);
              doc.rect(margemEsquerda, posicaoY, larguraUtil, 8, 'F');
              
              // Texto do exercício
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(9);
              
              const nomeExercicio = `${exercicio.numero} - ${exercicio.nome}`;
              const metodoInfo = formatarMetodoPDF(exercicio.nome);
              
              // Calcular altura necessária considerando se há método
              const linhasNome = doc.splitTextToSize(nomeExercicio, colunaExercicio - 8);
              let alturaNecessaria = Math.max(8, linhasNome.length * 4);
              
              // Se tiver método, adiciona mais espaço para a descrição
              if (metodoInfo) {
                // Quebrar a descrição do método em múltiplas linhas
                const linhasDescricao = doc.splitTextToSize(metodoInfo.descricao, colunaExercicio - 8);
                // Adicionar altura para o título do método + descrição (4 por linha)
                alturaNecessaria += 6 + (linhasDescricao.length * 3.5);
              }
              
              // Se o nome for muito longo ou tiver método, aumentar a altura da linha
              if (alturaNecessaria > 8) {
                doc.setFillColor(ehPar ? 240 : 255, ehPar ? 240 : 255, ehPar ? 240 : 255);
                doc.rect(margemEsquerda, posicaoY, larguraUtil, alturaNecessaria, 'F');
              }
              
              doc.text(linhasNome, margemEsquerda + 4, posicaoY + 4);
              
              // Adicionar informação do método se existir
              if (metodoInfo) {
                // Posição para o título do método
                const metodoTituloY = posicaoY + 4 + linhasNome.length * 4;
                
                // Fundo azul claro para destacar todo o método (título e descrição)
                const linhasDescricao = doc.splitTextToSize(metodoInfo.descricao, colunaExercicio - 12);
                const alturaMetodo = 6 + (linhasDescricao.length * 3.5);
                
                // Fundo azul claro para o bloco inteiro do método
                doc.setFillColor(210, 230, 255); // Azul bem claro
                doc.roundedRect(margemEsquerda + 4, metodoTituloY - 3, colunaExercicio - 8, alturaMetodo, 1, 1, 'F');
                
                // Título do método
                doc.setTextColor(0, 51, 153); // Azul escuro
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.text(`MÉTODO ${metodoInfo.metodoNome}:`, margemEsquerda + 7, metodoTituloY);
                
                // Descrição do método
                doc.setTextColor(0, 51, 153); // Azul escuro
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.text(linhasDescricao, margemEsquerda + 7, metodoTituloY + 4);
                
                // Restaurar configurações de texto
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
              }
              
              doc.text(exercicio.series, margemEsquerda + colunaExercicio + colunaSeries/2, posicaoY + 4, { align: 'center' });
              doc.text(exercicio.repeticoes, margemEsquerda + colunaExercicio + colunaSeries + colunaReps/2, posicaoY + 4, { align: 'center' });
              
              // Verificar se existe vídeo para este exercício
              const videoUrl = encontrarVideoDoExercicio(exercicio.nome, 'PDF');
              if (videoUrl) {
                // Desenhar o retângulo laranja do botão de vídeo
                const btnX = margemEsquerda + colunaExercicio + colunaSeries + colunaReps + 5;
                const btnY = posicaoY + 1;
                const btnWidth = colunaVideo - 10;
                const btnHeight = 6;
                
                doc.setFillColor(236, 72, 21); // Laranja vivo (mesmo do cabeçalho)
                doc.roundedRect(btnX, btnY, btnWidth, btnHeight, 1, 1, 'F');
                
                // Texto VER VÍDEO - ajustando para ficar perfeitamente centralizado
                doc.setTextColor(255, 255, 255);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                
                // Método alternativo de centralização para maior precisão
                const textoVideo = 'VER VÍDEO';
                const larguraTexto = doc.getTextWidth(textoVideo);
                const posXTexto = btnX + (btnWidth - larguraTexto) / 2;
                const posYTexto = btnY + btnHeight / 2 + 1.5;
                
                doc.text(textoVideo, posXTexto, posYTexto);
                
                // Adicionar link ao botão
                doc.link(btnX, btnY, btnWidth, btnHeight, { url: videoUrl });
              }
              
              posicaoY += alturaNecessaria;
            }
            
            // Adicionar espaço após a tabela
            posicaoY += 10;
          }
        } catch (error) {
          console.error('[gerarPDFFisica] Erro ao processar ficha de treino:', error);
          // Em caso de erro, cair para o processamento simples
          processarTextoSimples();
        }
      } else {
        // Processar como texto simples
        processarTextoSimples();
      }
      
      // Função para processar o conteúdo como texto simples
      function processarTextoSimples() {
        console.log('[gerarPDFFisica] Processando como texto simples');
        const paragrafos = conteudo.split('\n');
        
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
      const nomeArquivo = `resultado_fisica_${nomeArquivoCliente.replace(/\s+/g, '_').toLowerCase()}.pdf`;
      
      console.log('[gerarPDFFisica] Salvando PDF como:', nomeArquivo);
      doc.save(nomeArquivo);
      
      console.log('[gerarPDFFisica] PDF gerado com sucesso!');
      alert('PDF da avaliação física gerado com sucesso!');
    } catch (error) {
      console.error('[gerarPDFFisica] Erro ao gerar PDF:', error);
      
      if (error instanceof Error) {
        console.error('[gerarPDFFisica] Detalhes:', error.message);
        console.error('[gerarPDFFisica] Stack:', error.stack);
      }
      
      alert('Erro ao gerar o PDF da avaliação física. Tente novamente.');
    } finally {
      // Resetar o estado de geração
      console.log('[gerarPDFFisica] Finalizando, resetando estado...');
      setTimeout(() => {
          setGerandoFisica(false);
      }, 1000);
    }
  };

  const gerarPDF = async (tipo: 'FISICA' | 'NUTRICIONAL') => {
    console.log(`[gerarPDF] Iniciando função para tipo: ${tipo}`);
    
    // Para a avaliação física, usar a função específica otimizada
    if (tipo === 'FISICA') {
      return gerarPDFFisica();
    }
    
    // Resto do código para a avaliação nutricional...
    // ... existing code ...
  };

  // Adicionar um efeito para garantir que os estados de geração sejam resetados quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Limpar os estados quando o componente for desmontado
      setGerandoFisica(false);
      setGerandoNutricional(false);
    };
  }, []);
  
  // Adicionar um efeito para logar informações sobre os botões de download
  useEffect(() => {
    console.log('Estado dos botões de download:');
    console.log('- Gerando PDF Física:', gerandoFisica);
    console.log('- Gerando PDF Nutricional:', gerandoNutricional);
  }, [gerandoFisica, gerandoNutricional]);

  // Adicionar efeito de fundo e garantir que o conteúdo seja visível
  useEffect(() => {
    const background = isDarkMode 
      ? '#0f172a'
      : '#ffffff';
    
    document.documentElement.style.background = background;
    document.documentElement.style.backgroundColor = background;
    document.body.style.background = background;
    document.body.style.backgroundColor = background;
    
    // Remover o padrão de fundo
    document.body.style.backgroundImage = 'none';
    
    // Garantir que o conteúdo seja visível
    const resultadosContainer = document.querySelector('.resultados-container');
    if (resultadosContainer) {
      (resultadosContainer as HTMLElement).style.display = 'block';
      (resultadosContainer as HTMLElement).style.visibility = 'visible';
      (resultadosContainer as HTMLElement).style.opacity = '1';
    }
  }, [isDarkMode]);
  
  // Adicionar estilos de scrollbar personalizados
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      ::-webkit-scrollbar {
        width: 10px;
      }
      
      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 5px;
      }
      
      ::-webkit-scrollbar-thumb {
        background: rgba(251, 146, 60, 0.5);
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(251, 146, 60, 0.7);
      }
      
      .animate-fadeIn {
        animation: fadeIn 0.5s ease-out forwards;
      }
      
      .animate-slideIn {
        animation: slideIn 0.5s ease-out forwards;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (carregando) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
        </div>
      </Layout>
    );
  }

  // Componente para exibir o estado de aguardando resultados
  const AguardandoResultado = () => (
    <div className="flex flex-col items-center justify-center py-8 md:py-12">
      <div className="bg-orange-600/20 rounded-full p-4 mb-4 shadow-lg shadow-orange-900/10">
        <Clock className="w-10 h-10 text-orange-400" />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">Avaliação em Análise</h3>
      <p className="text-gray-300 text-center max-w-md mb-4">
        Suas avaliações estão sendo analisadas por nossos especialistas. 
        Em breve seus resultados estarão disponíveis.
      </p>
      <div className="flex space-x-2 items-center">
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-100"></span>
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-200"></span>
      </div>
    </div>
  );

  // Função para renderizar o conteúdo do resultado com formatação adequada
  const renderizarResultado = (conteudo: string | null) => {
    if (!conteudo) {
      return <div className="text-gray-500">Nenhum resultado disponível ainda.</div>;
    }

    // Verificar se o conteúdo parece ser uma ficha de treino
    const pareceSerFichaDeTreino = conteudo.includes('TREINO A') || 
                                  conteudo.includes('TREINO B') || 
                                  conteudo.toLowerCase().includes('treino a') ||
                                   conteudo.toLowerCase().includes('treino b') ||
                                   conteudo.includes('exercício') ||
                                   conteudo.includes('exercicio') ||
                                   conteudo.includes('séries') ||
                                   conteudo.includes('series');
    
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
              <div className={`overflow-hidden rounded-xl shadow-lg border ${
                isDarkMode
                  ? 'border-orange-500/30 bg-slate-800/80'
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="bg-orange-500 py-2 px-4 text-white font-bold text-center">
                  Lista de Compras
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {listaDeCompras.map((item, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${
                          index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                        } border border-gray-100`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )} */}
          </div>
        );
      } catch (error) {
        console.error('Erro ao processar planejamento alimentar:', error);
        // Em caso de erro, retornar o conteúdo bruto
        return processarTextoSimples();
      }
    }
    // Se não for planejamento alimentar, verificar se é ficha de treino
    else if (pareceSerFichaDeTreino) {
      try {
        // Processar o conteúdo linha por linha para extrair exercícios
        const linhas = conteudo.split('\n').filter(linha => linha.trim().length > 0);
        
        // Array para armazenar os treinos
        const treinos: Treino[] = [];
        let treinoAtual: Treino | null = null;
        
        // Expressão regular para identificar linhas de treino (ex: "TREINO A: FEMININO (PRIMEIRO MÊS)")
        const regexTreino = /TREINO\s+([A-Z])(?:\s*[:]\s*|\s+)(.+)?/i;
        
        // Expressão para identificar exercícios numerados
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
            
            // Criar novo treino
            treinoAtual = {
              letra: matchTreino[1], // A, B, C, etc.
              descricao: matchTreino[2] || '',
              titulo: linha,
              exercicios: []
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
              
              // Tentar extrair séries e repetições do nome
              const regexSeriesReps = /(\d+)\s*[xX]\s*([0-9/]+(?:\s*a\s*\d+)?)/;
              const matchSeriesReps = nomeCompleto.match(regexSeriesReps);
              
              let nome = nomeCompleto;
              let series = '';
              let repeticoes = '';
              
              if (matchSeriesReps) {
                // Remover a parte de séries/reps do nome
                nome = nomeCompleto.replace(matchSeriesReps[0], '').trim();
                series = matchSeriesReps[1] + 'x';
                repeticoes = matchSeriesReps[2];
              } else {
                // Tentar encontrar padrões específicos como "3 X 12 (CADA LADO)"
                const regexEspecial = /(\d+)\s*[xX]\s*([0-9/]+(?:\s*a\s*\d+)?)\s*\(([^)]+)\)/;
                const matchEspecial = nomeCompleto.match(regexEspecial);
                
                if (matchEspecial) {
                  nome = nomeCompleto.replace(matchEspecial[0], '').trim() + ' (' + matchEspecial[3] + ')';
                  series = matchEspecial[1] + 'x';
                  repeticoes = matchEspecial[2];
                }
              }
              
                // Verificar séries e repetições na próxima linha
              if (!series && i + 1 < linhas.length) {
                const proximaLinha = linhas[i + 1].trim();
                if (/^\d+x\s+\d+/.test(proximaLinha)) {
                  const partes = proximaLinha.split(/\s+/);
                  if (partes.length >= 2) {
                    series = partes[0];
                    repeticoes = partes[1];
                    i++; // Avançar para pular a linha processada
                  }
                }
              }
              
              // Adicionar à lista de exercícios
              treinoAtual.exercicios.push({
                numero,
                nome,
                series: series || '4x', // Valor padrão
                repeticoes: repeticoes || '10 a 12' // Valor padrão
              });
            }
          }
        }
        
        // Adicionar o último treino se existir
        if (treinoAtual) {
          treinos.push(treinoAtual);
        }
        
        // Renderizar os treinos
        return (
          <div className="space-y-8">
            {treinos.map((treino, index) => (
              <div key={index} className={`overflow-hidden rounded-xl shadow-lg border ${
                isDarkMode 
                  ? 'border-orange-500/30 bg-slate-800/80' 
                  : 'border-gray-200 bg-white'
              }`}>
                <div className="bg-orange-500 py-2 md:py-3 px-3 md:px-4 text-white font-bold text-center text-base md:text-lg">
                  {treino.titulo}
                </div>
                
                {/* Layout desktop - grid com 3 colunas */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-3 bg-orange-500/80 font-bold text-white">
                    <div className="p-3 text-left border-r border-orange-300 text-base">Exercício</div>
                    <div className="p-3 text-center border-r border-orange-300 text-base">Séries</div>
                    <div className="p-3 text-center text-base">Repetições</div>
                  </div>
                  
                  {treino.exercicios.map((exercicio, exIndex) => {
                    // Verificar se temos um vídeo para este exercício
                    const videoUrl = encontrarVideoDoExercicio(exercicio.nome, 'WEB');
                    
                    return (
                      <div key={exIndex} className={`grid grid-cols-3 
                        ${exIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                        border-t border-orange-500/20 ${isDarkMode ? 'text-black' : 'text-gray-800'}`}
                      >
                        <div className="p-3 flex flex-row items-start justify-between border-r border-orange-500/20">
                          <span className="mr-2 text-base flex-1">
                            <span className="font-medium">{exercicio.numero}</span> - {exercicio.nome}
                          </span>
                          <div className="flex flex-col items-end gap-1">
                            {videoUrl && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setVideoModalUrl(videoUrl);
                                }}
                                className="ml-1 px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-md flex items-center transition-colors flex-shrink-0"
                              >
                                <Play className="w-3 h-3 mr-1" />VER VÍDEO
                              </button>
                            )}
                            <BotaoMetodoTreino nomeExercicio={exercicio.nome} />
                          </div>
                        </div>
                        <div className="p-3 text-center border-r border-orange-500/20 text-base">{exercicio.series}</div>
                        <div className="p-3 text-center text-base">{exercicio.repeticoes}</div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Layout mobile - formato de lista */}
                <div className="md:hidden">                
                  {treino.exercicios.map((exercicio, exIndex) => {
                    // Verificar se temos um vídeo para este exercício
                    const videoUrl = encontrarVideoDoExercicio(exercicio.nome, 'WEB');
                    
                    return (
                      <div key={exIndex} className="bg-white dark:bg-gray-800 rounded-md shadow-sm mb-3 overflow-hidden">
                        <div className="p-3 border-b border-orange-500/20">
                          <div className="flex flex-col mb-2">
                            <span className="font-medium text-gray-800 dark:text-white text-base mb-1">
                              <span className="font-semibold">{exercicio.numero}</span> - {exercicio.nome}
                            </span>
                            <div className="flex flex-row gap-2 mt-1">
                              {videoUrl && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setVideoModalUrl(videoUrl);
                                  }}
                                  className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded-md flex items-center transition-colors"
                                >
                                  <Play className="w-3 h-3 mr-1" />VER VÍDEO
                                </button>
                              )}
                              <BotaoMetodoTreino nomeExercicio={exercicio.nome} />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="font-bold text-orange-500 text-sm">Séries:</div>
                              <div className="text-sm text-gray-800 dark:text-gray-200">{exercicio.series}</div>
                            </div>
                            <div>
                              <div className="font-bold text-orange-500 text-sm">Repetições:</div>
                              <div className="text-sm text-gray-800 dark:text-gray-200">{exercicio.repeticoes}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      } catch (error) {
        console.error("Erro ao processar a ficha de treino:", error);
          return processarTextoSimples();
        }
    }
    // Se não for nem planejamento alimentar nem ficha de treino
    else {
      return processarTextoSimples();
    }
    
    // Função interna para processar texto simples
    function processarTextoSimples() {
        return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 transition-all duration-300">
          <div className="whitespace-pre-wrap">{conteudo}</div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className={`resultados-container p-6 ${
        isDarkMode 
          ? 'bg-slate-900/50 text-white' 
          : 'bg-white text-gray-900'
      }`}>
        <div className="resultados-header mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <button 
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors self-start"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Início
              </button>
              <div className="flex items-center">
                <div className="bg-orange-500 p-2 rounded-lg mr-3">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Meus Resultados</h1>
              </div>
            </div>
            {!carregando && perfilLiberado && (
              <>
                {activeTab === 'fisica' ? (
              <button
                    onClick={() => {
                      console.log('Clique no botão de geração de PDF Física');
                      try {
                        console.log('Iniciando geração de PDF física direta');
                        gerarPDFFisica();
                      } catch (error) {
                        console.error('Erro ao gerar PDF físico:', error);
                        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                        setGerandoFisica(false);
                      }
                    }}
                    disabled={gerandoFisica}
                className="inline-flex items-center px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
              >
                    {gerandoFisica ? (
                  <>
                    <span className="animate-pulse mr-2">●</span>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                        Baixar PDF Física
                  </>
                )}
              </button>
                ) : (
                  <button
                    onClick={() => {
                      console.log('Clique no botão de geração de PDF Nutricional');
                      try {
                        console.log('Iniciando geração de PDF nutricional direta');
                        gerarPDFNutricional();
                      } catch (error) {
                        console.error('Erro ao gerar PDF nutricional:', error);
                        alert('Ocorreu um erro ao gerar o PDF. Por favor, tente novamente.');
                        setGerandoNutricional(false);
                      }
                    }}
                    disabled={gerandoNutricional}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start sm:self-auto"
                  >
                    {gerandoNutricional ? (
                      <>
                        <span className="animate-pulse mr-2">●</span>
                        Gerando PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Baixar PDF Nutricional
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            Visualize os resultados das suas avaliações e recomendações personalizadas
          </p>
        </div>

        {perfil?.liberado !== 'sim' ? (
          <div className="animate-fadeIn">
            <AguardandoResultado />
          </div>
        ) : (
          <div className="animate-fadeIn">
            <div className="relative mb-6">
              <div className="flex border-b border-orange-500/30">
                <button
                  onClick={() => setActiveTab('fisica')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'fisica'
                      ? 'border-b-2 border-orange-500 text-orange-500 transition-all'
                      : `${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-orange-500`
                  }`}
                >
                  <Activity className="w-4 h-4 inline-block mr-1" />
                  Avaliação Física
                </button>
                <button
                  onClick={() => setActiveTab('nutricional')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'nutricional'
                      ? 'border-b-2 border-orange-500 text-orange-500 transition-all'
                      : `${isDarkMode ? 'text-gray-300' : 'text-gray-700'} hover:text-orange-500`
                  }`}
                >
                  <Heart className="w-4 h-4 inline-block mr-1" />
                  Avaliação Nutricional
                </button>
              </div>
            </div>
            
            {carregando ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : perfil?.liberado === 'sim' ? (
              <>
                {/* Conteúdo da aba Avaliação Física */}
                <div 
                  id="resultado-fisica" 
                  className={`${activeTab === 'fisica' ? 'block' : 'hidden'} p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-slate-800/90 border border-orange-500/20' 
                      : 'bg-white border border-gray-200 shadow-md'
                  }`}
                >
                  <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <Scale className="w-5 h-5 text-orange-500" />
                    Resultado da Avaliação Física
                  </h2>
                  
                  <div>
                    {renderizarResultado(perfil?.resultado_fisica)}
                  </div>
                </div>
                
                {/* Conteúdo da aba Avaliação Nutricional */}
                <div 
                  id="resultado-nutricional" 
                  className={`${activeTab === 'nutricional' ? 'block' : 'hidden'} p-4 rounded-lg ${
                    isDarkMode 
                      ? 'bg-slate-800/90 border border-orange-500/20' 
                      : 'bg-white border border-gray-200 shadow-md'
                  }`}
                >
                  <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    <ClipboardCheck className="w-5 h-5 text-orange-500" />
                    Resultado da Avaliação Nutricional
                  </h2>
                  
                  <div>
                    {renderizarResultado(perfil?.resultado_nutricional)}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
        
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
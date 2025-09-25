import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { Download, FileText, Loader2 } from 'lucide-react';
import { 
  ResultadoGrimaldi, 
  analisarComposicaoGrimaldi,
  MedidasCorporais,
  PerfilUsuario,
  obterValoresReferencia
} from '../../utils/calculosGrimaldi';

// Função para criar donut chart profissional (estilo SHAPED)
const criarDonutChart = (massaMagraPercent: number, massaGordaPercent: number, peso: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d')!;
  
  const centerX = 120;
  const centerY = 120;
  const radiusExterno = 85;
  const radiusInterno = 45; // Criar o "buraco" do donut
  
  // Cores do SHAPED
  const corMassaMagra = '#4FD1C7'; // Verde claro (massa magra)
  const corMassaGorda = '#047857'; // Verde escuro (massa gorda)
  
  // Calcular ângulos (começar do topo: -90 graus)
  const anguloInicial = -Math.PI / 2;
  const anguloMassaMagra = (massaMagraPercent / 100) * 2 * Math.PI;
  const anguloMassaGorda = (massaGordaPercent / 100) * 2 * Math.PI;
  
  // Desenhar massa magra (primeiro segmento)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radiusExterno, anguloInicial, anguloInicial + anguloMassaMagra);
  ctx.arc(centerX, centerY, radiusInterno, anguloInicial + anguloMassaMagra, anguloInicial, true);
  ctx.closePath();
  ctx.fillStyle = corMassaMagra;
  ctx.fill();
  
  // Desenhar massa gorda (segundo segmento)
  ctx.beginPath();
  ctx.arc(centerX, centerY, radiusExterno, anguloInicial + anguloMassaMagra, anguloInicial + anguloMassaMagra + anguloMassaGorda);
  ctx.arc(centerX, centerY, radiusInterno, anguloInicial + anguloMassaMagra + anguloMassaGorda, anguloInicial + anguloMassaMagra, true);
  ctx.closePath();
  ctx.fillStyle = corMassaGorda;
  ctx.fill();
  
  // Adicionar peso no centro do donut
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${peso}kg`, centerX, centerY - 5);
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#6B7280';
  ctx.fillText('Peso', centerX, centerY + 12);
  
  // Adicionar percentuais fora do donut, melhor posicionados
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Posicionar texto da massa magra (lado esquerdo/superior)
  const anguloTextoMagra = anguloInicial + (anguloMassaMagra / 2);
  const xTextoMagra = centerX + (radiusExterno + 25) * Math.cos(anguloTextoMagra);
  const yTextoMagra = centerY + (radiusExterno + 25) * Math.sin(anguloTextoMagra);
  ctx.fillStyle = corMassaMagra;
  ctx.fillText(`${massaMagraPercent.toFixed(1)}%`, xTextoMagra, yTextoMagra);
  
  // Posicionar texto da massa gorda (lado direito/inferior)
  const anguloTextoGorda = anguloInicial + anguloMassaMagra + (anguloMassaGorda / 2);
  const xTextoGorda = centerX + (radiusExterno + 25) * Math.cos(anguloTextoGorda);
  const yTextoGorda = centerY + (radiusExterno + 25) * Math.sin(anguloTextoGorda);
  ctx.fillStyle = corMassaGorda;
  ctx.fillText(`${massaGordaPercent.toFixed(1)}%`, xTextoGorda, yTextoGorda);
  
  return canvas.toDataURL('image/png');
};

// Função para criar barra de progresso avançada (estilo SHAPED)
const criarBarraProgressoAvancada = (valor: number, pontosBaixa: number[], pontosAltos: number[], label: string, classificacao: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 45;
  const ctx = canvas.getContext('2d')!;
  
  const barraX = 15;
  const barraY = 15;
  const barraLargura = 290;
  const barraAltura = 12;
  
  // Cores baseadas na classificação
  const cores = {
    baixo: '#4FD1C7',     // Verde claro
    moderado: '#F59E0B',  // Amarelo
    alto: '#EF4444'       // Vermelho
  };
  
  // Determinar configuração baseada no tipo
  let pontos: number[] = [];
  let labels: string[] = [];
  let coresSegmentos: string[] = [];
  
  if (label.includes('Cintura') && !label.includes('quadril')) {
    // Cintura: valores específicos para homens
    pontos = [94, 102];
    labels = ['Baixo', 'Moderado', 'Alto'];
    coresSegmentos = [cores.baixo, cores.moderado, cores.alto];
  } else if (label.includes('quadril')) {
    // Razão cintura/quadril
    pontos = [0.9];
    labels = ['Adequado', 'Inadequado'];
    coresSegmentos = [cores.baixo, cores.alto];
  } else if (label.includes('estatura')) {
    // Razão cintura/estatura
    pontos = [0.5, 0.55];
    labels = ['Baixo', 'Moderado', 'Alto'];
    coresSegmentos = [cores.baixo, cores.moderado, cores.alto];
  } else {
    // Configuração genérica
    pontos = pontosBaixa.concat(pontosAltos);
    labels = ['Baixo', 'Moderado', 'Alto'];
    coresSegmentos = [cores.baixo, cores.moderado, cores.alto];
  }
  
  // Calcular valor mínimo e máximo para escala
  const valorMin = Math.min(valor * 0.8, pontos[0] * 0.8);
  const valorMax = Math.max(valor * 1.2, pontos[pontos.length - 1] * 1.2);
  
  // Desenhar segmentos coloridos da barra
  const totalSegmentos = labels.length;
  for (let i = 0; i < totalSegmentos; i++) {
    const segmentoX = barraX + (barraLargura / totalSegmentos) * i;
    const segmentoLargura = barraLargura / totalSegmentos;
    
    ctx.fillStyle = coresSegmentos[i];
    ctx.fillRect(segmentoX, barraY, segmentoLargura, barraAltura);
  }
  
  // Desenhar marcadores de divisão com valores numéricos
  pontos.forEach((ponto, index) => {
    const posicaoX = barraX + ((ponto - valorMin) / (valorMax - valorMin)) * barraLargura;
    
    if (posicaoX >= barraX && posicaoX <= barraX + barraLargura) {
      // Linha de divisão
      ctx.strokeStyle = '#1F2937';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(posicaoX, barraY - 2);
      ctx.lineTo(posicaoX, barraY + barraAltura + 2);
      ctx.stroke();
      
      // Valor numérico
      ctx.fillStyle = '#1F2937';
      ctx.font = 'bold 9px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(ponto.toString(), posicaoX, barraY - 5);
    }
  });
  
  // Calcular posição do valor atual
  const valorPosicao = barraX + ((valor - valorMin) / (valorMax - valorMin)) * barraLargura;
  
  // Desenhar indicador triangular do valor atual
  ctx.fillStyle = '#1F2937';
  ctx.beginPath();
  ctx.moveTo(valorPosicao, barraY - 3);
  ctx.lineTo(valorPosicao - 4, barraY - 8);
  ctx.lineTo(valorPosicao + 4, barraY - 8);
  ctx.closePath();
  ctx.fill();
  
  // Valor atual abaixo da barra
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(valor.toFixed(2), valorPosicao, barraY + barraAltura + 15);
  
  // Labels das faixas
  ctx.font = '8px Arial';
  labels.forEach((labelTexto, index) => {
    const labelX = barraX + (barraLargura / totalSegmentos) * index + (barraLargura / totalSegmentos) / 2;
    ctx.fillStyle = '#4B5563';
    ctx.textAlign = 'center';
    ctx.fillText(labelTexto, labelX, barraY + barraAltura + 25);
  });
  
  return canvas.toDataURL('image/png');
};

// Função para criar gráfico de dispersão Massa Magra X Massa Gorda (estilo SHAPED)
const criarGraficoDispersao = (massaMagra: number, massaGorda: number, altura: number): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 250;
  const ctx = canvas.getContext('2d')!;
  
  const margemX = 40;
  const margemY = 30;
  const larguraGrafico = canvas.width - margemX * 2;
  const alturaGrafico = canvas.height - margemY * 2;
  
  // Calcular índices
  const alturaM = altura;
  const indiceMassaMagra = massaMagra / Math.pow(alturaM, 2);
  const indiceMassaGorda = massaGorda / Math.pow(alturaM, 2);
  
  // Definir escala do gráfico
  const maxX = 30; // kg/m² máximo para IMM
  const maxY = 15; // kg/m² máximo para IMG
  
  // Desenhar fundo
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Desenhar quadrantes coloridos
  const quadrantes = [
    {x: 0, y: 0, w: 0.6, h: 0.3, cor: '#DCFCE7', label: 'Massa magra baixa\nMassa gorda baixa'},
    {x: 0.6, y: 0, w: 0.4, h: 0.3, cor: '#FEF3C7', label: 'Massa magra alta\nMassa gorda baixa'},
    {x: 0, y: 0.3, w: 0.6, h: 0.4, cor: '#FEE2E2', label: 'Massa magra baixa\nMassa gorda adequada'},
    {x: 0.6, y: 0.3, w: 0.4, h: 0.4, cor: '#D1FAE5', label: 'Massa magra alta\nMassa gorda adequada'},
    {x: 0, y: 0.7, w: 0.6, h: 0.3, cor: '#FECACA', label: 'Massa magra baixa\nMassa gorda alta'},
    {x: 0.6, y: 0.7, w: 0.4, h: 0.3, cor: '#FED7AA', label: 'Massa magra alta\nMassa gorda alta'}
  ];
  
  quadrantes.forEach(quad => {
    ctx.fillStyle = quad.cor;
    ctx.fillRect(
      margemX + quad.x * larguraGrafico,
      margemY + quad.y * alturaGrafico,
      quad.w * larguraGrafico,
      quad.h * alturaGrafico
    );
  });
  
  // Desenhar eixos
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  
  // Eixo X (IMM)
  ctx.beginPath();
  ctx.moveTo(margemX, margemY + alturaGrafico);
  ctx.lineTo(margemX + larguraGrafico, margemY + alturaGrafico);
  ctx.stroke();
  
  // Eixo Y (IMG)
  ctx.beginPath();
  ctx.moveTo(margemX, margemY);
  ctx.lineTo(margemX, margemY + alturaGrafico);
  ctx.stroke();
  
  // Linhas de grade
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1;
  
  for (let i = 1; i <= 5; i++) {
    const x = margemX + (i / 5) * larguraGrafico;
    const y = margemY + (i / 5) * alturaGrafico;
    
    // Linhas verticais
    ctx.beginPath();
    ctx.moveTo(x, margemY);
    ctx.lineTo(x, margemY + alturaGrafico);
    ctx.stroke();
    
    // Linhas horizontais
    ctx.beginPath();
    ctx.moveTo(margemX, y);
    ctx.lineTo(margemX + larguraGrafico, y);
    ctx.stroke();
  }
  
  // Labels dos eixos
  ctx.fillStyle = '#374151';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  
  // Eixo X
  ctx.fillText('Índice de massa magra (kg/m²)', margemX + larguraGrafico/2, canvas.height - 5);
  
  // Eixo Y (rotacionado)
  ctx.save();
  ctx.translate(15, margemY + alturaGrafico/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText('Índice de massa gorda (kg/m²)', 0, 0);
  ctx.restore();
  
  // Escala do eixo X
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const valor = (i / 5) * maxX;
    const x = margemX + (i / 5) * larguraGrafico;
    ctx.fillText(valor.toFixed(0), x, margemY + alturaGrafico + 15);
  }
  
  // Escala do eixo Y
  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const valor = ((5 - i) / 5) * maxY;
    const y = margemY + (i / 5) * alturaGrafico;
    ctx.fillText(valor.toFixed(0), margemX - 5, y + 4);
  }
  
  // Plotar ponto do usuário
  const pontoX = margemX + (indiceMassaMagra / maxX) * larguraGrafico;
  const pontoY = margemY + alturaGrafico - (indiceMassaGorda / maxY) * alturaGrafico;
  
  // Círculo do ponto
  ctx.fillStyle = '#047857';
  ctx.beginPath();
  ctx.arc(pontoX, pontoY, 6, 0, 2 * Math.PI);
  ctx.fill();
  
  // Borda do ponto
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Label do ponto
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Avaliação atual', pontoX, pontoY - 10);
  ctx.fillText(`${new Date().toLocaleDateString('pt-BR')}`, pontoX, pontoY - 22);
  
  return canvas.toDataURL('image/png');
};

// Função para criar silhueta humana 3D estilizada (estilo SHAPED)
const criarSilhueta3DEstilizada = (medidas: any, sexo: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;
  
  const centerX = 70;
  const escala = 1.2;
  
  // Cores do SHAPED (verde 3D)
  const corPrimaria = '#047857'; // Verde escuro
  const corSecundaria = '#059669'; // Verde médio
  const corClara = '#10B981'; // Verde claro
  
  // Desenhar fundo sutil
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Criar gradiente para efeito 3D
  const gradiente = ctx.createLinearGradient(centerX - 30, 0, centerX + 30, 0);
  gradiente.addColorStop(0, corSecundaria);
  gradiente.addColorStop(0.5, corClara);
  gradiente.addColorStop(1, corPrimaria);
  
  // CABEÇA com efeito 3D
  ctx.fillStyle = gradiente;
  ctx.beginPath();
  ctx.arc(centerX, 50 * escala, 18 * escala, 0, 2 * Math.PI);
  ctx.fill();
  
  // Sombra da cabeça
  ctx.fillStyle = 'rgba(4, 120, 87, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + 2, 52 * escala, 18 * escala, 0, 2 * Math.PI);
  ctx.fill();
  
  // TORSO com forma mais anatômica
  ctx.fillStyle = gradiente;
  ctx.beginPath();
  ctx.moveTo(centerX - 20 * escala, 70 * escala);
  ctx.lineTo(centerX + 20 * escala, 70 * escala);
  ctx.lineTo(centerX + 22 * escala, 85 * escala); // Peito
  ctx.lineTo(centerX + 18 * escala, 105 * escala); // Cintura
  ctx.lineTo(centerX + 20 * escala, 125 * escala); // Quadril
  ctx.lineTo(centerX - 20 * escala, 125 * escala);
  ctx.lineTo(centerX - 18 * escala, 105 * escala);
  ctx.lineTo(centerX - 22 * escala, 85 * escala);
  ctx.closePath();
  ctx.fill();
  
  // BRAÇOS com volume 3D
  // Braço esquerdo
  ctx.beginPath();
  ctx.moveTo(centerX - 20 * escala, 75 * escala);
  ctx.lineTo(centerX - 35 * escala, 80 * escala);
  ctx.lineTo(centerX - 38 * escala, 115 * escala);
  ctx.lineTo(centerX - 32 * escala, 118 * escala);
  ctx.lineTo(centerX - 18 * escala, 90 * escala);
  ctx.closePath();
  ctx.fill();
  
  // Braço direito
  ctx.beginPath();
  ctx.moveTo(centerX + 20 * escala, 75 * escala);
  ctx.lineTo(centerX + 35 * escala, 80 * escala);
  ctx.lineTo(centerX + 38 * escala, 115 * escala);
  ctx.lineTo(centerX + 32 * escala, 118 * escala);
  ctx.lineTo(centerX + 18 * escala, 90 * escala);
  ctx.closePath();
  ctx.fill();
  
  // PERNAS com volume
  // Perna esquerda
  ctx.beginPath();
  ctx.moveTo(centerX - 18 * escala, 125 * escala);
  ctx.lineTo(centerX - 15 * escala, 170 * escala);
  ctx.lineTo(centerX - 12 * escala, 220 * escala);
  ctx.lineTo(centerX - 18 * escala, 222 * escala);
  ctx.lineTo(centerX - 22 * escala, 172 * escala);
  ctx.lineTo(centerX - 25 * escala, 127 * escala);
  ctx.closePath();
  ctx.fill();
  
  // Perna direita
  ctx.beginPath();
  ctx.moveTo(centerX + 18 * escala, 125 * escala);
  ctx.lineTo(centerX + 15 * escala, 170 * escala);
  ctx.lineTo(centerX + 12 * escala, 220 * escala);
  ctx.lineTo(centerX + 18 * escala, 222 * escala);
  ctx.lineTo(centerX + 22 * escala, 172 * escala);
  ctx.lineTo(centerX + 25 * escala, 127 * escala);
  ctx.closePath();
  ctx.fill();
  
  // MARCAÇÕES DE MEDIDAS com estilo profissional
  const medidas3D = [
    { 
      nome: 'Braço', 
      valor: medidas.bracos, 
      x1: centerX - 35 * escala, 
      y1: 90 * escala,
      x2: centerX - 50 * escala,
      y2: 90 * escala,
      textX: centerX - 55 * escala,
      textY: 88 * escala
    },
    { 
      nome: 'Peito', 
      valor: medidas.peito, 
      x1: centerX + 22 * escala, 
      y1: 85 * escala,
      x2: centerX + 40 * escala,
      y2: 85 * escala,
      textX: centerX + 45 * escala,
      textY: 83 * escala
    },
    { 
      nome: 'Cintura', 
      valor: medidas.cintura, 
      x1: centerX + 18 * escala, 
      y1: 105 * escala,
      x2: centerX + 40 * escala,
      y2: 105 * escala,
      textX: centerX + 45 * escala,
      textY: 103 * escala
    },
    { 
      nome: 'Quadril', 
      valor: medidas.quadril, 
      x1: centerX + 20 * escala, 
      y1: 125 * escala,
      x2: centerX + 40 * escala,
      y2: 125 * escala,
      textX: centerX + 45 * escala,
      textY: 123 * escala
    },
    { 
      nome: 'Coxa', 
      valor: medidas.coxas, 
      x1: centerX - 22 * escala, 
      y1: 155 * escala,
      x2: centerX - 50 * escala,
      y2: 155 * escala,
      textX: centerX - 55 * escala,
      textY: 153 * escala
    },
    { 
      nome: 'Panturr.', 
      valor: medidas.panturrilhas, 
      x1: centerX + 22 * escala, 
      y1: 195 * escala,
      x2: centerX + 40 * escala,
      y2: 195 * escala,
      textX: centerX + 45 * escala,
      textY: 193 * escala
    }
  ];
  
  // Desenhar linhas de medida profissionais
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#1F2937';
  ctx.font = 'bold 9px Arial';
  
  medidas3D.forEach(medida => {
    // Linha principal
    ctx.beginPath();
    ctx.moveTo(medida.x1, medida.y1);
    ctx.lineTo(medida.x2, medida.y2);
    ctx.stroke();
    
    // Setas nas extremidades
    const isLeft = medida.x2 < medida.x1;
    const setaSize = 3;
    
    // Seta na extremidade da linha
    ctx.beginPath();
    if (isLeft) {
      ctx.moveTo(medida.x2, medida.y2);
      ctx.lineTo(medida.x2 + setaSize, medida.y2 - setaSize);
      ctx.lineTo(medida.x2 + setaSize, medida.y2 + setaSize);
    } else {
      ctx.moveTo(medida.x2, medida.y2);
      ctx.lineTo(medida.x2 - setaSize, medida.y2 - setaSize);
      ctx.lineTo(medida.x2 - setaSize, medida.y2 + setaSize);
    }
    ctx.closePath();
    ctx.fill();
    
    // Texto da medida
    ctx.textAlign = isLeft ? 'right' : 'left';
    ctx.fillText(`${medida.nome}`, medida.textX, medida.textY);
    ctx.fillText(`${medida.valor.toFixed(1)} cm`, medida.textX, medida.textY + 10);
  });
  
  return canvas.toDataURL('image/png');
};

// Função para validar e corrigir dados inconsistentes
const validarECorrigirMedidas = (medidas: MedidasCorporais): MedidasCorporais => {
  const medidasCorrigidas = { ...medidas };
  
  // Verificar valores extremamente baixos ou altos
  if (medidasCorrigidas.quadril < 50) {
    console.warn('Valor de quadril muito baixo:', medidasCorrigidas.quadril, 'Usando valor padrão');
    // Estimar quadril baseado na cintura (razão típica 0.85-0.95)
    medidasCorrigidas.quadril = medidasCorrigidas.cintura / 0.88;
  }
  
  if (medidasCorrigidas.cintura < 50 || medidasCorrigidas.cintura > 150) {
    console.warn('Valor de cintura suspeito:', medidasCorrigidas.cintura);
  }
  
  if (medidasCorrigidas.peito < 50 || medidasCorrigidas.peito > 150) {
    console.warn('Valor de peito suspeito:', medidasCorrigidas.peito);
  }
  
  return medidasCorrigidas;
};

interface RelatorioGrimaldiProps {
  medidas: MedidasCorporais;
  perfil: PerfilUsuario;
  onGerarRelatorio?: () => void;
}

// Função para verificar e adicionar nova página se necessário
const verificarEAdicionarPagina = (yPos: number, alturaMinima: number, doc: any, margem: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  
  if (yPos + alturaMinima > pageHeight - margem) {
    doc.addPage();
    
    // Adicionar header consistente em nova página
    doc.setFillColor(147, 51, 234); // Roxo Grimaldi
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('ANÁLISE GRIMALDI - CONTINUAÇÃO', margem, 13);
    
    return 35; // Posição Y após header
  }
  
  return yPos;
};

const RelatorioGrimaldi: React.FC<RelatorioGrimaldiProps> = ({ 
  medidas, 
  perfil,
  onGerarRelatorio 
}) => {
  const [gerando, setGerando] = useState(false);

  const gerarRelatorioProfissional = async () => {
    setGerando(true);
    onGerarRelatorio?.();

    try {
      // Validar e corrigir medidas antes da análise
      const medidasValidadas = validarECorrigirMedidas(medidas);
      
      // Realizar análise completa com padrão Grimaldi
      const resultado = analisarComposicaoGrimaldi(medidasValidadas, perfil);
      const valoresRef = obterValoresReferencia(perfil.sexo);

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Definir margens seguras A4 (20mm = ~56 pontos)
      const margem = 20;
      const larguraUtil = pageWidth - (margem * 2); // ~170mm úteis
      const alturaUtil = pageHeight - (margem * 2);

      // ===== PÁGINA 1: HEADER E DADOS PRINCIPAIS =====
      
      // Header roxo Grimaldi (respeitando margens)
      doc.setFillColor(147, 51, 234); // Roxo tema Grimaldi
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      // Logo/Título Grimaldi
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text('GRIMALDI', margem, 20);
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text('ANÁLISE DE COMPOSIÇÃO CORPORAL', margem + 65, 20);
      
      // Data
      doc.setFontSize(10);
      doc.text(new Date().toLocaleDateString('pt-BR'), pageWidth - margem, 20, { align: 'right' });

      // Dados pessoais
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DADOS PESSOAIS', margem, 45);
      
      let yPos = 55;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const dadosPessoais = [
        ['Altura:', `${(perfil.altura * 100).toFixed(0)} cm`],
        ['Peso:', `${perfil.peso.toFixed(1)} kg`],
        ['Idade:', `${perfil.idade} anos`],
        ['Sexo:', perfil.sexo === 'M' ? 'Masculino' : 'Feminino'],
        ['IMC:', `${resultado.composicao.imc.toFixed(1)} kg/m²`],
        ['TMB:', `${resultado.composicao.tmb.toFixed(0)} kcal/dia`]
      ];

      dadosPessoais.forEach(([label, value]) => {
        doc.setFont(undefined, 'bold');
        doc.text(label, margem + 5, yPos);
        doc.setFont(undefined, 'normal');
        doc.text(value, margem + 35, yPos);
        yPos += 8;
      });

      // Grimaldi Score - Destaque especial
      yPos += 10;
      doc.setFillColor(147, 51, 234); // Roxo Grimaldi
      doc.roundedRect(margem, yPos - 5, larguraUtil, 25, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('GRIMALDI SCORE', margem + 5, yPos + 5);
      
      doc.setFontSize(24);
      doc.text(`${resultado.indices.grimaldiScore}/100`, pageWidth - margem - 5, yPos + 10, { align: 'right' });
      
      // Interpretação do Score
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      yPos += 35;
      
      const interpretacaoScore = resultado.indices.grimaldiScore >= 80 ? 'Excelente composição corporal' :
                               resultado.indices.grimaldiScore >= 60 ? 'Boa composição corporal' :
                               resultado.indices.grimaldiScore >= 40 ? 'Composição corporal regular' :
                               'Composição corporal necessita melhoria';
      
      doc.text(`Interpretação: ${interpretacaoScore}`, margem + 5, yPos);

      // Composição Corporal com Gráfico de Pizza Real
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('ANÁLISE GLOBAL DA COMPOSIÇÃO CORPORAL', margem, yPos);
      
      yPos += 15;
      
      // Calcular percentuais
      const massaMagraPercent = (resultado.composicao.massaMagra / perfil.peso * 100);
      const massaGordaPercent = (resultado.composicao.massaGorda / perfil.peso * 100);
      const aguaPercent = resultado.composicao.aguaCorporalPercentual;
      
      // Criar e inserir donut chart profissional
      const donutChart = criarDonutChart(massaMagraPercent, massaGordaPercent, perfil.peso);
      doc.addImage(donutChart, 'PNG', margem, yPos, 70, 70);
      
      // Adicionar dados da composição ao lado do donut chart
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Peso: ${perfil.peso.toFixed(0)} kg`, margem + 80, yPos + 10);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Massa magra
      doc.setFillColor(79, 209, 199); // Verde claro (cor do donut)
      doc.circle(margem + 78, yPos + 20, 3, 'F');
      doc.setTextColor(0, 0, 0);
      doc.text(`Massa magra: ${resultado.composicao.massaMagra.toFixed(1)} kg`, margem + 85, yPos + 22);
      doc.setFontSize(8);
      doc.text('Representa o conjunto de músculos, ossos, órgãos e água.', margem + 85, yPos + 27);
      
      // Massa gorda
      doc.setFillColor(4, 120, 87); // Verde escuro (cor do donut)
      doc.circle(margem + 78, yPos + 35, 3, 'F');
      doc.setFontSize(10);
      doc.text(`Massa gorda: ${resultado.composicao.massaGorda.toFixed(1)} kg`, margem + 85, yPos + 37);
      doc.setFontSize(8);
      doc.text('Representa toda a massa de gordura presente no corpo.', margem + 85, yPos + 42);
      
      // Dados adicionais
      yPos += 75; // Ajustar para o donut maior
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      
      const dadosAdicionais = [
        `Água corporal: ${resultado.composicao.aguaCorporal.toFixed(1)}L (${aguaPercent.toFixed(1)}%)`,
        `Predito a partir da constante hídrica de mamíferos de 72,3% de água em relação à massa magra.`,
        ``,
        `Gasto energético de repouso: ${resultado.composicao.tmb.toFixed(0)} kcal`,
        `Predito a partir da equação de Cunningham (1980) que utiliza massa magra como variável.`
      ];
      
      dadosAdicionais.forEach((texto, index) => {
        if (index === 1 || index === 4) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
        } else {
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        }
        doc.text(texto, margem, yPos + (index * 6));
      });

      // Verificar espaço para o gráfico de dispersão
      yPos = verificarEAdicionarPagina(yPos + 15, 100, doc, margem);
      
      // Gráfico de dispersão Massa Magra X Massa Gorda (funcionalidade exclusiva)
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('RELAÇÃO MASSA MAGRA X MASSA GORDA', margem, yPos);
      
      yPos += 10;
      
      const graficoDispersao = criarGraficoDispersao(
        resultado.composicao.massaMagra, 
        resultado.composicao.massaGorda, 
        perfil.altura
      );
      doc.addImage(graficoDispersao, 'PNG', margem, yPos, 75, 62.5);
      
      // Texto explicativo ao lado do gráfico
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      const textoExplicativo = [
        'O gráfico indica a relação entre a classificação dos índices de massa gorda e',
        'massa magra, permitindo a interpretação do estado nutricional do indivíduo',
        'de forma mais eficaz que o IMC isoladamente, auxiliando no rastreamento de',
        'riscos à saúde.',
        '',
        'Posicionamento ideal: quadrante superior direito (massa magra alta, massa gorda baixa).'
      ];
      
      textoExplicativo.forEach((linha, index) => {
        doc.text(linha, margem + 85, yPos + 15 + (index * 5));
      });
      
      // ===== PÁGINA 2: MEDIDAS E ÍNDICES =====
      doc.addPage();
      
      // Header da página 2
      doc.setFillColor(147, 51, 234); // Roxo Grimaldi
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('MEDIDAS CORPORAIS E INDICADORES', 20, 13);

      yPos = 35;
      
      // Título da seção de medidas
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('PERÍMETROS E SUAS RAZÕES', margem, yPos);
      
      yPos += 15;

      // Inserir silhueta 3D estilizada com medidas
      const silhuetaImagem = criarSilhueta3DEstilizada(resultado.medidas, perfil.sexo);
      doc.addImage(silhuetaImagem, 'PNG', margem, yPos + 10, 60, 85);
      
      // Dados das medidas ao lado da silhueta
      yPos += 15;
      
      // Cintura com barra de progresso
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`Cintura: ${resultado.indices.cintura.valor.toFixed(1)} cm`, margem + 70, yPos);
      
      const valorCintura = resultado.indices.cintura.valor;
      const barraCintura = criarBarraProgressoAvancada(valorCintura, [94], [102], 'Cintura', resultado.indices.cintura.descricao);
      doc.addImage(barraCintura, 'PNG', margem + 70, yPos + 5, 80, 11);
      
      yPos += 25;
      
      // Quadril com barra de progresso
      doc.text(`Quadril: ${resultado.indices.quadril.valor.toFixed(1)} cm`, margem + 70, yPos);
      
      const valorQuadril = resultado.indices.quadril.valor;
      const barraQuadril = criarBarraProgressoAvancada(valorQuadril, [97.2], [108.6], 'Quadril', resultado.indices.quadril.descricao);
      doc.addImage(barraQuadril, 'PNG', margem + 70, yPos + 5, 80, 11);
      
      yPos += 25;
      
      // Razão cintura-estatura
      doc.text(`Razão cintura-estatura: ${resultado.indices.razaoCinturaEstatura.valor.toFixed(2)}`, margem + 70, yPos);
      
      const valorRCE = resultado.indices.razaoCinturaEstatura.valor;
      const barraRCE = criarBarraProgressoAvancada(valorRCE, [0.5], [0.55], 'estatura', resultado.indices.razaoCinturaEstatura.descricao);
      doc.addImage(barraRCE, 'PNG', margem + 70, yPos + 5, 80, 11);
      
      yPos += 25;
      
      // Razão cintura/quadril
      doc.text(`Razão cintura/quadril: ${resultado.indices.razaoCinturaQuadril.valor.toFixed(2)}`, margem + 70, yPos);
      
      const valorRCQ = resultado.indices.razaoCinturaQuadril.valor;
      const barraRCQ = criarBarraProgressoAvancada(valorRCQ, [0.9], [], 'quadril', resultado.indices.razaoCinturaQuadril.descricao);
      doc.addImage(barraRCQ, 'PNG', margem + 70, yPos + 5, 80, 11);
      
      yPos += 25;
      
      // Adicionar texto explicativo sobre perímetros
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Perímetros e suas razões são importantes indicadores de', margem + 70, yPos);
      doc.text('saúde, ajudando a monitorar e prevenir complicações', margem + 70, yPos + 5);
      doc.text('associadas ao excesso de peso.', margem + 70, yPos + 10);
      
      yPos += 25;
      
      // Índice de conicidade com visual
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(`Índice de conicidade: ${resultado.indices.indiceConicidade.valor.toFixed(2)}`, margem, yPos);
      
      // Desenhar formas corporais (mais compactas)
      const formasY = yPos + 10;
      const formasX = margem + 10;
      
      // Bicôncavo (ideal) - tamanho bem reduzido
      doc.setFillColor(16, 185, 129);
      doc.ellipse(formasX, formasY + 6, 3, 4, 'F');
      doc.setFontSize(6);
      doc.text('Bicôncavo', formasX, formasY + 14, { align: 'center' });
      
      // Cilíndrico (moderado) - tamanho bem reduzido
      doc.setFillColor(245, 158, 11);
      doc.rect(formasX + 25, formasY + 2, 6, 8, 'F');
      doc.text('Cilíndrico', formasX + 28, formasY + 14, { align: 'center' });
      
      // Bicônico (alto risco) - tamanho bem reduzido
      doc.setFillColor(239, 68, 68);
      doc.ellipse(formasX + 55, formasY + 6, 4, 3, 'F');
      doc.text('Bicônico', formasX + 55, formasY + 14, { align: 'center' });
      
      // Indicador visual da classificação atual (simples)
      const classificacaoConicidade = resultado.indices.indiceConicidade.descricao;
      let posicaoIndicador = formasX; // Padrão bicôncavo
      if (classificacaoConicidade.includes('Moderado')) posicaoIndicador = formasX + 28;
      if (classificacaoConicidade.includes('Alto') || classificacaoConicidade.includes('Inadequado')) posicaoIndicador = formasX + 55;
      
      // Indicador simples (círculo)
      doc.setFillColor(50, 50, 50);
      doc.circle(posicaoIndicador, formasY + 18, 1, 'F');
      
      // Adicionar classificação atual (ajustada)
      yPos += 35;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Indica a distribuição de gordura corporal, especialmente', margem, yPos);
      doc.text('abdominal, para avaliar o risco de doenças cardiovasculares.', margem, yPos + 4);
      doc.text('Indivíduo bicôncavo possui menor risco, enquanto o bicônico', margem, yPos + 8);
      doc.text('apresenta risco elevado de complicações.', margem, yPos + 12);

      // Adicionar resumo de indicadores na parte inferior da página 2
      yPos += 30;
      
      // Seção de resumo dos indicadores principais
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('RESUMO DOS INDICADORES', margem, yPos);
      
      yPos += 15;
      
      // Grid de indicadores com cores (todos os 6)
      const indicadores = [
        { nome: 'Percentual\nde gordura', valor: resultado.composicao.percentualGordura.toFixed(1) + '%', status: resultado.composicao.percentualGordura > 25 ? 'Alto risco' : 'Adequado' },
        { nome: 'Índice de\nmassa magra', valor: resultado.indices.indiceMassaMagra.valor.toFixed(1), status: resultado.indices.indiceMassaMagra.descricao },
        { nome: 'Razão cintura/\nquadril', valor: resultado.indices.razaoCinturaQuadril.valor.toFixed(2), status: resultado.indices.razaoCinturaQuadril.descricao },
        { nome: 'Índice de\nmassa gorda', valor: resultado.indices.indiceMassaGorda.valor.toFixed(1), status: resultado.indices.indiceMassaGorda.descricao },
        { nome: 'Razão cintura/\nestatura', valor: resultado.indices.razaoCinturaEstatura.valor.toFixed(2), status: resultado.indices.razaoCinturaEstatura.descricao },
        { nome: 'Índice de\nconicidade', valor: resultado.indices.indiceConicidade.valor.toFixed(2), status: resultado.indices.indiceConicidade.descricao }
      ];
      
      // Verificar se há espaço para todos os cards (altura necessária: ~80mm)
      yPos = verificarEAdicionarPagina(yPos, 80, doc, margem);
      
      // Desenhar cards dos indicadores (todos os 6, respeitando margens)
      console.log(`=== CARDS DOS INDICADORES ===`);
      console.log(`yPos inicial dos cards: ${yPos}`);
      console.log(`pageHeight: ${pageHeight}`);
      console.log(`margem: ${margem}`);
      
      indicadores.forEach((indicador, index) => {
        const x = margem + (index % 3) * 52;
        const y = yPos + Math.floor(index / 3) * 38;
        
        console.log(`Card ${index} (${indicador.nome.replace('\n', ' ')}): x=${x}, y=${y}, dentroLimite=${y < pageHeight - 50}`);
        
        // Definir cor do card baseado no status
        let corCard = [220, 252, 231]; // Verde claro
        let corTexto = [34, 197, 94]; // Verde
        
        if (indicador.status.includes('Moderado') || indicador.status.includes('Atenção')) {
          corCard = [254, 243, 199]; // Amarelo claro
          corTexto = [245, 158, 11]; // Amarelo
        } else if (indicador.status.includes('Alto') || indicador.status.includes('Inadequado')) {
          corCard = [254, 226, 226]; // Vermelho claro
          corTexto = [239, 68, 68]; // Vermelho
        }
        
        // Desenhar fundo do card
        doc.setFillColor(corCard[0], corCard[1], corCard[2]);
        doc.roundedRect(x, y, 48, 33, 2, 2, 'F');
        
        // Adicionar nome do indicador
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(60, 60, 60);
        const nomeLinhas = indicador.nome.split('\n');
        nomeLinhas.forEach((linha, i) => {
          doc.text(linha, x + 24, y + 7 + (i * 5), { align: 'center' });
        });
        
        // Adicionar valor
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(indicador.valor, x + 24, y + 18, { align: 'center' });
        
        // Adicionar status
        doc.setFontSize(6);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(corTexto[0], corTexto[1], corTexto[2]);
        doc.text(indicador.status, x + 24, y + 28, { align: 'center' });
      });
      
      yPos += 80;
      console.log(`yPos após cards: ${yPos}`);
      
      // Grimaldi Score destacado na parte inferior
      doc.setFillColor(147, 51, 234);
      doc.roundedRect(margem, yPos, larguraUtil, 20, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Grimaldi Score', margem + 5, yPos + 12);
      
      doc.setFontSize(18);
      doc.text(`${resultado.indices.grimaldiScore}/100`, pageWidth - margem - 5, yPos + 13, { align: 'right' });
      
      yPos += 25;
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('O score é gerado com base nos indicadores de composição', margem, yPos);
      doc.text('corporal. Quanto maior o score, melhor a condição física.', margem, yPos + 5);
      doc.text('Utilize-o como complemento à avaliação clínica.', margem, yPos + 10);
      
      // ===== PÁGINA 3: HISTÓRICO E RECOMENDAÇÕES =====
      doc.addPage();
      
      // Header da página 3
      doc.setFillColor(147, 51, 234); // Roxo Grimaldi
      doc.rect(0, 0, pageWidth, 20, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('HISTÓRICO E RECOMENDAÇÕES', margem, 13);

      yPos = 35;
      
      // Seção de histórico com gráficos simples
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('HISTÓRICO DE AVALIAÇÕES', margem, yPos);
      
      yPos += 15;
      
      // Simular mini-gráficos de histórico (usando apenas dados atuais como exemplo)
      const historicoItems = [
        { label: 'Peso:', valor: `${perfil.peso.toFixed(0)} kg`, cor: [16, 185, 129] },
        { label: 'Percentual de gordura:', valor: `${resultado.composicao.percentualGordura.toFixed(1)} %`, cor: [16, 185, 129] },
        { label: 'Massa magra:', valor: `${resultado.composicao.massaMagra.toFixed(1)} kg`, cor: [16, 185, 129] },
        { label: 'Massa gorda:', valor: `${resultado.composicao.massaGorda.toFixed(1)} kg`, cor: [16, 185, 129] }
      ];
      
      historicoItems.forEach((item, index) => {
        const x = margem + (index % 2) * 85;
        const y = yPos + Math.floor(index / 2) * 40;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(item.label, x, y);
        doc.text(item.valor, x, y + 5);
        
        // Desenhar ponto do gráfico
        doc.setFillColor(item.cor[0], item.cor[1], item.cor[2]);
        doc.circle(x + 60, y + 15, 3, 'F');
        
        // Linha de tendência simples
        doc.setDrawColor(item.cor[0], item.cor[1], item.cor[2]);
        doc.line(x + 20, y + 20, x + 70, y + 20);
        
        // Label do mês
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('jul', x + 60, y + 25, { align: 'center' });
      });
      
      yPos += 85;
      
      // Tabela de indicadores de referência
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('INDICADORES DE REFERÊNCIA', margem, yPos);
      
      yPos += 15;
      
      // Cabeçalho da tabela
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Indicadores', margem + 5, yPos);
      doc.text('Referência', margem + 100, yPos);
      doc.text('Avaliação Atual', margem + 140, yPos);
      
      doc.line(margem, yPos + 2, pageWidth - margem, yPos + 2);
      
      yPos += 10;
      
      const tabelaReferencia = [
        ['IMC', '18,5-24,9 kg/m²', resultado.composicao.imc.toFixed(1) + ' kg/m²'],
        ['Índice de massa gorda', perfil.sexo === 'M' ? '< 4,4 kg/m²' : '< 6,8 kg/m²', resultado.indices.indiceMassaGorda.valor.toFixed(1) + ' kg/m²'],
        ['Índice de massa magra', '> 17,8 kg/m²', resultado.indices.indiceMassaMagra.valor.toFixed(1) + ' kg/m²'],
        ['Razão cintura/estatura', '< 0,5', resultado.indices.razaoCinturaEstatura.valor.toFixed(2)],
        ['Razão cintura/quadril', perfil.sexo === 'M' ? '< 0,9' : '< 0,8', resultado.indices.razaoCinturaQuadril.valor.toFixed(2)],
        ['Índice de conicidade', '< 1,25', resultado.indices.indiceConicidade.valor.toFixed(2)]
      ];
      
      doc.setFont(undefined, 'normal');
      
      tabelaReferencia.forEach(([indicador, referencia, atual]) => {
        doc.text(indicador, margem + 5, yPos);
        doc.text(referencia, margem + 100, yPos);
        doc.text(atual, margem + 140, yPos);
        yPos += 7;
      });
      
      yPos += 10;
      
      // Interpretação geral
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('INTERPRETAÇÃO PERSONALIZADA', margem, yPos);
      
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Texto baseado no Grimaldi Score
      let interpretacaoGeral = '';
      if (resultado.indices.grimaldiScore >= 80) {
        interpretacaoGeral = 'Parabéns! Sua composição corporal está em excelente estado. Todos os indicadores estão dentro das faixas ideais, demonstrando baixo risco cardiometabólico e boa saúde geral.';
      } else if (resultado.indices.grimaldiScore >= 60) {
        interpretacaoGeral = 'Sua composição corporal está em bom estado, com a maioria dos indicadores dentro das faixas adequadas. Algumas melhorias pontuais podem otimizar ainda mais seus resultados.';
      } else if (resultado.indices.grimaldiScore >= 40) {
        interpretacaoGeral = 'Sua composição corporal apresenta aspectos que necessitam atenção. Recomenda-se acompanhamento profissional para melhoria dos indicadores de risco.';
      } else {
        interpretacaoGeral = 'Sua composição corporal indica necessidade de intervenção. É altamente recomendado acompanhamento médico e nutricional para redução dos fatores de risco.';
      }
      
      const linhas = doc.splitTextToSize(interpretacaoGeral, larguraUtil);
      linhas.forEach((linha: string) => {
        doc.text(linha, margem, yPos);
        yPos += 6;
      });

      // Pontos de atenção
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('PONTOS DE ATENÇÃO', margem, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Identificar indicadores em risco
      const pontosAtencao: string[] = [];
      
      if (resultado.indices.cintura.faixa !== 'BAIXO_RISCO') {
        pontosAtencao.push(`• Circunferência da cintura (${resultado.indices.cintura.valor.toFixed(1)} cm): ${resultado.indices.cintura.descricao} risco`);
      }
      
      if (resultado.indices.indiceMassaGorda.faixa !== 'ADEQUADO') {
        pontosAtencao.push(`• Índice de massa gorda elevado: ${resultado.indices.indiceMassaGorda.descricao} risco`);
      }
      
      if (resultado.indices.razaoCinturaQuadril.faixa === 'INADEQUADO') {
        pontosAtencao.push(`• Razão cintura/quadril inadequada: ${resultado.indices.razaoCinturaQuadril.valor.toFixed(3)}`);
      }
      
      if (pontosAtencao.length === 0) {
        doc.text('Não foram identificados pontos críticos de atenção. Continue mantendo seus hábitos saudáveis.', margem, yPos);
      } else {
        pontosAtencao.forEach(ponto => {
          const linhaPonto = doc.splitTextToSize(ponto, larguraUtil);
          linhaPonto.forEach((linha: string) => {
            doc.text(linha, margem, yPos);
            yPos += 6;
          });
        });
      }

      // Recomendações
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('RECOMENDAÇÕES', margem, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      const recomendacoes = [
        '• Mantenha uma alimentação equilibrada com acompanhamento nutricional',
        '• Pratique exercícios físicos regulares (cardio + resistência)',
        '• Monitore periodicamente sua composição corporal',
        '• Consulte profissionais de saúde para orientações personalizadas',
        '• Mantenha hidratação adequada (35ml/kg de peso corporal)',
        '• Priorize o sono de qualidade (7-9 horas por noite)',
        '• Realize exames médicos periódicos para monitoramento',
        '• Evite dietas restritivas sem orientação profissional'
      ];
      
      console.log(`=== RECOMENDAÇÕES ===`);
      console.log(`yPos inicial das recomendações: ${yPos}`);
      console.log(`pageHeight: ${pageHeight}`);
      
      recomendacoes.forEach((rec, index) => {
        // Verificar se há espaço para a recomendação (altura estimada: 12mm)
        yPos = verificarEAdicionarPagina(yPos, 12, doc, margem);
        
        console.log(`Recomendação ${index + 1}: yPos=${yPos}, dentroLimite=${yPos < pageHeight - 20}`);
        const linhaRec = doc.splitTextToSize(rec, larguraUtil);
        linhaRec.forEach((linha: string) => {
          doc.text(linha, margem, yPos);
          yPos += 6;
        });
      });

      // Verificar espaço para metodologia (altura estimada: 50mm)
      yPos = verificarEAdicionarPagina(yPos + 15, 50, doc, margem);
      
      // Metodologia
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text('METODOLOGIA', margem, yPos);
      
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      
      const metodologia = [
        'Este relatório foi gerado através de análise automatizada de imagens utilizando:',
        '• Detecção de pontos anatômicos via MediaPipe (Google)',
        '• Equações de Jackson & Pollock para percentual de gordura',
        '• Equação de Cunningham para taxa metabólica basal',
        '• Classificações de risco baseadas em literatura científica',
        '• Grimaldi Score: sistema proprietário de pontuação (0-100 pontos)'
      ];
      
      metodologia.forEach(met => {
        const linhaMet = doc.splitTextToSize(met, larguraUtil);
        linhaMet.forEach((linha: string) => {
          doc.text(linha, margem, yPos);
          yPos += 5;
        });
      });

      // Verificar se há espaço para disclaimer (altura necessária: 25mm)
      yPos = verificarEAdicionarPagina(yPos + 10, 25, doc, margem);
      
      // Disclaimer sempre no final da última página
      const espacoDisponivel = pageHeight - yPos - margem;
      if (espacoDisponivel < 25) {
        yPos = pageHeight - 30; // Posicionar no final da página
      } else {
        yPos += 10; // Dar espaço após metodologia
      }
      
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text('IMPORTANTE: Este relatório tem caráter informativo e não substitui avaliação médica profissional.', margem, yPos);
      doc.text('Os dados apresentados devem ser interpretados por profissional qualificado da área da saúde.', margem, yPos + 5);
      doc.text(`Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} - Sistema Grimaldi v2.0`, margem, yPos + 10);

      // Salvar PDF
      doc.save(`grimaldi-analysis-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Erro ao gerar relatório Grimaldi:', error);
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200">
              Relatório Grimaldi Profissional
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-300">
              Análise completa de composição corporal em 3 páginas
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Relatório Visual Profissional:
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>• 📊 Gráfico de pizza colorido da composição corporal</li>
          <li>• 👤 Silhueta humana com medidas apontadas</li>
          <li>• 📈 Barras de progresso coloridas para indicadores</li>
          <li>• 🏆 Grimaldi Score destacado visualmente</li>
          <li>• 📋 Cards coloridos dos indicadores principais</li>
          <li>• 📉 Mini-gráficos de histórico</li>
          <li>• 🎨 Design profissional similar ao concorrente</li>
          <li>• 📝 Interpretação científica personalizada</li>
        </ul>
      </div>

      <button
        onClick={gerarRelatorioProfissional}
        disabled={gerando}
        className="w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200"
      >
        {gerando ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Gerando Relatório...</span>
          </>
        ) : (
          <>
            <Download className="h-5 w-5" />
            <span>Gerar Relatório Grimaldi</span>
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Relatório baseado em análise automatizada por IA • Sistema Grimaldi v2.0
      </p>
    </div>
  );
};

export default RelatorioGrimaldi;
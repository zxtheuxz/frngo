import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface GraficoDispersaoProps {
  indiceMassaMagra: number; // kg/m²
  indiceMassaGorda: number; // kg/m²
  sexo: 'M' | 'F';
  className?: string;
}

interface Quadrante {
  id: string;
  label: string;
  cor: string;
  corTexto: string;
  interpretacao: string;
}

const GraficoDispersao: React.FC<GraficoDispersaoProps> = ({
  indiceMassaMagra,
  indiceMassaGorda,
  sexo,
  className = ''
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Definir limites baseados no Shaped (valores científicos)
  const limites = {
    massaMagra: {
      homem: { ideal: 17.8, maximo: 22.3 },
      mulher: { ideal: 14.1, maximo: 19.5 }
    },
    massaGorda: {
      ambos: { adequado: 3.5, alto: 5.9 }
    }
  };

  const limiteMM = sexo === 'M' ? limites.massaMagra.homem : limites.massaMagra.mulher;
  const limiteMG = limites.massaGorda.ambos;

  // Configurações do gráfico
  const largura = 400;
  const altura = 300;
  const margemX = 50;
  const margemY = 40;
  const areaGrafico = {
    largura: largura - 2 * margemX,
    altura: altura - 2 * margemY
  };

  // Escalas (baseadas nos valores do Shaped)
  const escalaX = {
    min: 10,
    max: 25
  };
  const escalaY = {
    min: 0,
    max: 12
  };

  // Converter valores para coordenadas do SVG
  const pontoX = margemX + ((indiceMassaMagra - escalaX.min) / (escalaX.max - escalaX.min)) * areaGrafico.largura;
  const pontoY = margemY + areaGrafico.altura - ((indiceMassaGorda - escalaY.min) / (escalaY.max - escalaY.min)) * areaGrafico.altura;

  // Linhas divisórias dos quadrantes
  const linhaDivisoriaX = margemX + ((limiteMM.ideal - escalaX.min) / (escalaX.max - escalaX.min)) * areaGrafico.largura;
  const linhaDivisoriaY = margemY + areaGrafico.altura - ((limiteMG.alto - escalaY.min) / (escalaY.max - escalaY.min)) * areaGrafico.altura;

  // Definir quadrantes com interpretações
  const quadrantes: Quadrante[] = [
    {
      id: 'ideal',
      label: 'Massa magra alta\nMassa gorda baixa',
      cor: '#10B981', // Verde
      corTexto: '#047857',
      interpretacao: 'Composição corporal ideal'
    },
    {
      id: 'adequado_mm_alta',
      label: 'Massa magra alta\nMassa gorda adequada',
      cor: '#84CC16', // Verde claro
      corTexto: '#365314',
      interpretacao: 'Boa massa muscular'
    },
    {
      id: 'adequado_mm_baixa',
      label: 'Massa magra adequada\nMassa gorda baixa',
      cor: '#F59E0B', // Amarelo
      corTexto: '#92400E',
      interpretacao: 'Pode melhorar massa muscular'
    },
    {
      id: 'risco',
      label: 'Massa magra baixa\nMassa gorda alta',
      cor: '#EF4444', // Vermelho
      corTexto: '#991B1B',
      interpretacao: 'Requer atenção nutricional'
    }
  ];

  // Determinar quadrante atual
  const determinarQuadrante = (): Quadrante => {
    const mmAlta = indiceMassaMagra >= limiteMM.ideal;
    const mgBaixa = indiceMassaGorda <= limiteMG.alto;

    if (mmAlta && mgBaixa) return quadrantes[0]; // Ideal
    if (mmAlta && !mgBaixa) return quadrantes[1]; // MM alta, MG adequada
    if (!mmAlta && mgBaixa) return quadrantes[2]; // MM adequada, MG baixa  
    return quadrantes[3]; // Risco
  };

  const quadranteAtual = determinarQuadrante();

  // Gerar ticks dos eixos
  const ticksX = [10, 14.1, 17.8, 20, 25];
  const ticksY = [0, 3.5, 5.9, 8, 12];

  return (
    <div className={`${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Relação Massa magra X Massa gorda
        </h3>
        
        {/* SVG do Gráfico */}
        <div className="w-full mb-4">
          <div className="relative w-full" style={{ paddingBottom: '75%' }}> {/* Aspect ratio 4:3 */}
            <svg 
              viewBox={`0 0 ${largura} ${altura}`}
              preserveAspectRatio="xMidYMid meet"
              className="absolute inset-0 w-full h-full border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900"
            >
            
            {/* Área dos quadrantes */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={isDarkMode ? '#374151' : '#E5E7EB'} strokeWidth="0.5"/>
              </pattern>
            </defs>
            
            {/* Grid de fundo */}
            <rect 
              x={margemX} 
              y={margemY} 
              width={areaGrafico.largura} 
              height={areaGrafico.altura} 
              fill="url(#grid)"
            />

            {/* Quadrante Ideal (canto superior esquerdo) */}
            <rect
              x={margemX}
              y={margemY}
              width={linhaDivisoriaX - margemX}
              height={linhaDivisoriaY - margemY}
              fill="#10B981"
              fillOpacity="0.1"
            />

            {/* Quadrante MM alta, MG adequada (canto superior direito) */}
            <rect
              x={linhaDivisoriaX}
              y={margemY}
              width={margemX + areaGrafico.largura - linhaDivisoriaX}
              height={linhaDivisoriaY - margemY}
              fill="#84CC16"
              fillOpacity="0.1"
            />

            {/* Quadrante MM adequada, MG baixa (canto inferior esquerdo) */}
            <rect
              x={margemX}
              y={linhaDivisoriaY}
              width={linhaDivisoriaX - margemX}
              height={margemY + areaGrafico.altura - linhaDivisoriaY}
              fill="#F59E0B"
              fillOpacity="0.1"
            />

            {/* Quadrante de Risco (canto inferior direito) */}
            <rect
              x={linhaDivisoriaX}
              y={linhaDivisoriaY}
              width={margemX + areaGrafico.largura - linhaDivisoriaX}
              height={margemY + areaGrafico.altura - linhaDivisoriaY}
              fill="#EF4444"
              fillOpacity="0.1"
            />

            {/* Linhas divisórias dos quadrantes */}
            <line
              x1={linhaDivisoriaX}
              y1={margemY}
              x2={linhaDivisoriaX}
              y2={margemY + areaGrafico.altura}
              stroke={isDarkMode ? '#6B7280' : '#9CA3AF'}
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <line
              x1={margemX}
              y1={linhaDivisoriaY}
              x2={margemX + areaGrafico.largura}
              y2={linhaDivisoriaY}
              stroke={isDarkMode ? '#6B7280' : '#9CA3AF'}
              strokeWidth="2"
              strokeDasharray="5,5"
            />

            {/* Eixos */}
            <line
              x1={margemX}
              y1={margemY + areaGrafico.altura}
              x2={margemX + areaGrafico.largura}
              y2={margemY + areaGrafico.altura}
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              strokeWidth="2"
            />
            <line
              x1={margemX}
              y1={margemY}
              x2={margemX}
              y2={margemY + areaGrafico.altura}
              stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
              strokeWidth="2"
            />

            {/* Ticks do eixo X */}
            {ticksX.map(tick => {
              const x = margemX + ((tick - escalaX.min) / (escalaX.max - escalaX.min)) * areaGrafico.largura;
              return (
                <g key={`tick-x-${tick}`}>
                  <line
                    x1={x}
                    y1={margemY + areaGrafico.altura}
                    x2={x}
                    y2={margemY + areaGrafico.altura + 5}
                    stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={margemY + areaGrafico.altura + 18}
                    textAnchor="middle"
                    className="text-[10px] md:text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Ticks do eixo Y */}
            {ticksY.map(tick => {
              const y = margemY + areaGrafico.altura - ((tick - escalaY.min) / (escalaY.max - escalaY.min)) * areaGrafico.altura;
              return (
                <g key={`tick-y-${tick}`}>
                  <line
                    x1={margemX - 5}
                    y1={y}
                    x2={margemX}
                    y2={y}
                    stroke={isDarkMode ? '#9CA3AF' : '#6B7280'}
                    strokeWidth="1"
                  />
                  <text
                    x={margemX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-[10px] md:text-xs fill-gray-600 dark:fill-gray-400"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Ponto atual */}
            <circle
              cx={Math.max(margemX, Math.min(pontoX, margemX + areaGrafico.largura))}
              cy={Math.max(margemY, Math.min(pontoY, margemY + areaGrafico.altura))}
              r="6"
              fill={quadranteAtual.cor}
              stroke="white"
              strokeWidth="2"
            />

            {/* Labels dos eixos */}
            <text
              x={margemX + areaGrafico.largura / 2}
              y={altura - 10}
              textAnchor="middle"
              className="text-[11px] md:text-sm font-medium fill-gray-700 dark:fill-gray-300"
            >
              Índice de massa magra (kg/m²)
            </text>
            <text
              x={20}
              y={margemY + areaGrafico.altura / 2}
              textAnchor="middle"
              className="text-[11px] md:text-sm font-medium fill-gray-700 dark:fill-gray-300"
              transform={`rotate(-90, 20, ${margemY + areaGrafico.altura / 2})`}
            >
              Índice de massa gorda (kg/m²)
            </text>
            </svg>
          </div>
        </div>

        {/* Interpretação do quadrante atual */}
        <div className={`p-4 rounded-lg border-l-4`} style={{ 
          backgroundColor: isDarkMode ? `${quadranteAtual.cor}20` : `${quadranteAtual.cor}10`,
          borderLeftColor: quadranteAtual.cor 
        }}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Sua Posição: {quadranteAtual.interpretacao}
            </h4>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              <div>IMM: {indiceMassaMagra.toFixed(1)} kg/m²</div>
              <div>IMG: {indiceMassaGorda.toFixed(1)} kg/m²</div>
            </div>
          </div>
          
          <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {quadranteAtual.label.split('\n').map((linha, index) => (
              <div key={index}>{linha}</div>
            ))}
          </div>
        </div>

        {/* Legenda dos quadrantes */}
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-medium mb-2">O gráfico indica a relação entre a classificação dos índices de massa gorda e massa magra, permitindo a interpretação do estado nutricional do indivíduo de forma mais eficaz que o IMC isoladamente, auxiliando no rastreamento de riscos à saúde.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
            <div className="text-center md:text-left">
              <strong className="block mb-1">Índice de massa magra (IMM):</strong>
              <p className="text-[11px] md:text-xs">O índice avalia a quantidade de massa magra em relação à altura. Valores adequados estão associados a menores riscos de doenças crônicas, como diabetes e hipertensão, além de contribuir para melhor desempenho físico.</p>
            </div>
            <div className="text-center md:text-left mt-2 md:mt-0">
              <strong className="block mb-1">Índice de massa gorda (IMG):</strong>
              <p className="text-[11px] md:text-xs">Avalia a quantidade de massa gorda em relação à altura. Quanto maior for o valor, mais elevado é o risco de desenvolvimento de obesidade, doenças cardiovasculares e diabetes.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficoDispersao;
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface FaixaRisco {
  label: string;
  cor: string;
  inicio: number;
  fim: number;
}

interface EscalaRiscoLimpaProps {
  titulo: string;
  valorAtual: number;
  unidade?: string;
  faixas: FaixaRisco[];
  resultadoTexto: string;
  altura?: 'normal' | 'pequena';
  className?: string;
}

const EscalaRiscoLimpa: React.FC<EscalaRiscoLimpaProps> = ({
  titulo,
  valorAtual,
  unidade = '',
  faixas,
  resultadoTexto,
  altura = 'normal',
  className = ''
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Calcular dimensões
  const alturaEscala = altura === 'pequena' ? 24 : 32;
  const larguraTotal = 100; // Porcentagem
  
  // Calcular valores mínimos e máximos para normalização
  const valorMin = Math.min(...faixas.map(f => f.inicio));
  const valorMax = Math.max(...faixas.map(f => f.fim));
  const rangeMaximo = valorMax - valorMin;

  // Calcular posição do indicador atual (em porcentagem)
  const posicaoAtual = Math.max(0, Math.min(100, 
    ((valorAtual - valorMin) / rangeMaximo) * 100
  ));

  return (
    <div className={`${className}`}>
      {/* Título e valor atual */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          {titulo}
        </h4>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {typeof valorAtual === 'number' ? valorAtual.toFixed(valorAtual < 10 ? 1 : 0) : valorAtual}
            {unidade && <span className="text-sm font-medium ml-1">{unidade}</span>}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {resultadoTexto}
          </div>
        </div>
      </div>

      {/* Escala visual limpa */}
      <div className="relative">
        {/* Container da escala */}
        <div 
          className="w-full rounded-full overflow-hidden border border-gray-200 dark:border-gray-600"
          style={{ height: `${alturaEscala}px` }}
        >
          {/* Segmentos coloridos */}
          {faixas.map((faixa, index) => {
            const larguraSegmento = ((faixa.fim - faixa.inicio) / rangeMaximo) * 100;
            
            return (
              <div
                key={index}
                className="h-full float-left"
                style={{
                  width: `${larguraSegmento}%`,
                  backgroundColor: faixa.cor,
                  opacity: 0.8
                }}
              />
            );
          })}
        </div>

        {/* Indicador da posição atual */}
        <div
          className="absolute top-0 transform -translate-x-1/2"
          style={{ 
            left: `${posicaoAtual}%`,
            height: `${alturaEscala}px`
          }}
        >
          {/* Linha do indicador */}
          <div 
            className="w-0.5 h-full bg-gray-900 dark:bg-white"
            style={{ boxShadow: '0 0 3px rgba(0,0,0,0.5)' }}
          />
          
          {/* Triângulo indicador */}
          <div
            className="absolute -top-2 left-1/2 transform -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: `6px solid ${isDarkMode ? '#ffffff' : '#000000'}`,
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
            }}
          />
        </div>
      </div>

      {/* Valores de referência nas extremidades */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{valorMin}</span>
        <span>{valorMax}</span>
      </div>
    </div>
  );
};

export default EscalaRiscoLimpa;
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface LegendaCoresProps {
  className?: string;
}

const LegendaCores: React.FC<LegendaCoresProps> = ({ className = '' }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const itensLegenda = [
    {
      cor: '#22c55e', // Verde
      label: 'Baixo risco / Adequado',
      descricao: 'Dentro das faixas ideais'
    },
    {
      cor: '#eab308', // Amarelo
      label: 'Moderado / Atenção',
      descricao: 'Requer acompanhamento'
    },
    {
      cor: '#ef4444', // Vermelho
      label: 'Alto risco / Inadequado',
      descricao: 'Fora das faixas recomendadas'
    }
  ];

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
        Legenda dos Indicadores
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {itensLegenda.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            {/* Círculo colorido */}
            <div
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: item.cor }}
            />
            
            {/* Texto */}
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900 dark:text-white">
                {item.label}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {item.descricao}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Nota explicativa */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <strong>Como interpretar:</strong> A linha preta indica sua posição atual em cada escala. 
          Valores na faixa verde são considerados ideais, amarelo requer atenção, e vermelho indica necessidade de acompanhamento profissional.
        </p>
      </div>
    </div>
  );
};

export default LegendaCores;
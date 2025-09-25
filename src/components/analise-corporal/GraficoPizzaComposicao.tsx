import React from 'react';

interface ComposicaoData {
  massaGorda: number;
  massaMagra: number;
  percentualGordura: number;
  aguaCorporal: number;
  aguaCorporalPercentual: number;
  tmb: number;
}

interface GraficoPizzaComposicaoProps {
  composicao: ComposicaoData;
  peso: number;
}

const GraficoPizzaComposicao: React.FC<GraficoPizzaComposicaoProps> = ({ composicao, peso }) => {
  // Validações para evitar NaN
  const pesoSeguro = peso || 0;
  const massaMagra = composicao.massaMagra || 0;
  const percentualGordura = composicao.percentualGordura || 0;
  
  // Cálculo seguro dos percentuais
  const percentualMassaMagra = pesoSeguro > 0 ? ((massaMagra / pesoSeguro) * 100) : 0;
  const percentualMassaGorda = percentualGordura;

  // Validação adicional para garantir que os valores estão corretos
  const percentualMassaMagraFinal = isNaN(percentualMassaMagra) ? 0 : percentualMassaMagra;
  const percentualMassaGordaFinal = isNaN(percentualMassaGorda) ? 0 : percentualMassaGorda;

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Análise global da composição corporal
      </h2>
      
      {/* Gráfico de Pizza */}
      <div className="relative w-72 h-72 mx-auto mb-8">
        {/* SVG do gráfico de pizza */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Anel externo - Massa Magra (verde claro) */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#4ade80"
            strokeWidth="12"
            strokeDasharray={`${(percentualMassaMagraFinal / 100) * 339.3} 339.3`}
            strokeDashoffset="0"
            className="transition-all duration-1000"
          />
          
          {/* Anel externo - Massa Gorda (verde escuro) */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#16a34a"
            strokeWidth="12"
            strokeDasharray={`${(percentualMassaGordaFinal / 100) * 339.3} 339.3`}
            strokeDashoffset={`-${(percentualMassaMagraFinal / 100) * 339.3}`}
            className="transition-all duration-1000"
          />
          
          {/* Círculo interno branco */}
          <circle
            cx="60"
            cy="60"
            r="36"
            fill="currentColor"
            className="text-white dark:text-gray-900"
          />
        </svg>
        
        {/* Percentuais no centro */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {percentualMassaGordaFinal.toFixed(1)}%
            </div>
            <div className="text-2xl font-bold text-green-400">
              {percentualMassaMagraFinal.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Informações principais */}
      <div className="space-y-4 text-left max-w-md mx-auto">
        <div className="text-center mb-6">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            Peso: {pesoSeguro} kg
          </span>
        </div>
        
        {/* Massa Gorda */}
        <div className="flex items-start">
          <div className="w-4 h-4 bg-green-600 rounded-full mr-3 mt-1 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              Massa gorda: {(composicao.massaGorda || 0).toFixed(1)} kg
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Representa toda a massa de gordura presente no corpo.
            </p>
          </div>
        </div>
        
        {/* Massa Magra */}
        <div className="flex items-start">
          <div className="w-4 h-4 bg-green-400 rounded-full mr-3 mt-1 flex-shrink-0"></div>
          <div className="flex-1">
            <div className="font-semibold text-gray-900 dark:text-white">
              Massa magra: {massaMagra.toFixed(1)} kg
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Representa o conjunto de músculos, ossos, órgãos e água.
            </p>
            
            {/* Água Corporal */}
            <div className="mt-3 ml-4 space-y-1">
              <div className="text-sm">
                <span className="font-semibold">Água corporal:</span> {(composicao.aguaCorporal || 0).toFixed(1)}L ({(composicao.aguaCorporalPercentual || 0).toFixed(1)}%)
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Predito a partir da constante hídrica de mamíferos de 72,3% de água em relação à massa magra.
              </p>
            </div>
            
            {/* TMB */}
            <div className="mt-3 ml-4 space-y-1">
              <div className="text-sm">
                <span className="font-semibold">Gasto energético de repouso:</span> {(composicao.tmb || 0).toFixed(1)} kcal
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Predito a partir da equação de Cunningham (1980) que utiliza massa magra como variável.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraficoPizzaComposicao;
import React from 'react';
import { ResultadoAnalise } from '../../utils/calculosComposicaoCorporal';
import { useTheme } from '../../contexts/ThemeContext';

interface TabelaReferenciasProps {
  dados: ResultadoAnalise;
  className?: string;
}

interface ReferenciaItem {
  indicador: string;
  referencia: string;
  atual: string;
  status: 'adequado' | 'atencao' | 'inadequado';
  unidade: string;
}

const TabelaReferencias: React.FC<TabelaReferenciasProps> = ({ dados, className = '' }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Definir valores de referência baseados na literatura científica (igual ao Shaped)
  const obterReferencias = (): ReferenciaItem[] => {
    const sexo = dados.perfil.sexo;
    
    return [
      {
        indicador: 'Índice de massa gorda',
        referencia: '< 4,4 kg/m²',
        atual: `${dados.indices.indiceMassaGorda.valor.toFixed(1)} kg/m²`,
        // Usar a mesma classificação do sistema principal
        status: dados.indices.indiceMassaGorda.faixa === 'BAIXO_RISCO' ? 'adequado' :
                dados.indices.indiceMassaGorda.faixa === 'ADEQUADO' ? 'adequado' :
                'inadequado', // ALTO_RISCO
        unidade: 'kg/m²'
      },
      {
        indicador: 'Índice de massa magra',
        referencia: sexo === 'M' ? '> 17,8 kg/m²' : '> 14,8 kg/m²',
        atual: `${dados.indices.indiceMassaMagra.valor.toFixed(1)} kg/m²`,
        // Usar a mesma classificação do sistema principal
        status: dados.indices.indiceMassaMagra.faixa === 'ADEQUADO' ? 'adequado' : 
                dados.indices.indiceMassaMagra.faixa === 'BAIXO_RISCO' ? 'inadequado' : 'adequado',
        unidade: 'kg/m²'
      },
      {
        indicador: 'Razão cintura/estatura',
        referencia: '< 0,5',
        atual: dados.indices.razaoCinturaEstatura.valor.toFixed(2),
        // Usar a mesma classificação do sistema principal
        status: dados.indices.razaoCinturaEstatura.faixa === 'BAIXO_RISCO' ? 'adequado' :
                dados.indices.razaoCinturaEstatura.faixa === 'MODERADO' ? 'atencao' :
                'inadequado', // ALTO_RISCO
        unidade: ''
      },
      {
        indicador: 'Razão cintura/quadril',
        referencia: sexo === 'M' ? '< 0,9' : '< 0,85',
        atual: dados.indices.razaoCinturaQuadril.valor.toFixed(2),
        // Usar a mesma classificação do sistema principal
        status: dados.indices.razaoCinturaQuadril.faixa === 'ADEQUADO' ? 'adequado' : 'inadequado',
        unidade: ''
      },
      {
        indicador: 'Índice de conicidade',
        referencia: '< 1,25',
        atual: dados.indices.indiceConicidade.valor.toFixed(2),
        // Usar a mesma classificação do sistema principal
        status: dados.indices.indiceConicidade.faixa === 'ADEQUADO' ? 'adequado' : 'inadequado',
        unidade: ''
      }
    ];
  };

  const referencias = obterReferencias();

  // Cores baseadas no status
  const obterCores = (status: string) => {
    switch (status) {
      case 'adequado':
        return {
          cor: '#10B981',
          fundo: isDarkMode ? '#064E3B10' : '#D1FAE5',
          texto: isDarkMode ? '#10B981' : '#047857'
        };
      case 'atencao':
        return {
          cor: '#F59E0B',
          fundo: isDarkMode ? '#451A0310' : '#FEF3C7',
          texto: isDarkMode ? '#F59E0B' : '#92400E'
        };
      case 'inadequado':
        return {
          cor: '#EF4444',
          fundo: isDarkMode ? '#450A0A10' : '#FEE2E2',
          texto: isDarkMode ? '#EF4444' : '#991B1B'
        };
      default:
        return {
          cor: '#6B7280',
          fundo: isDarkMode ? '#1F2937' : '#F3F4F6',
          texto: isDarkMode ? '#9CA3AF' : '#4B5563'
        };
    }
  };

  return (
    <div className={`${className}`}>
      {/* Título */}
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Valores de Referência Científica
      </h2>

      {/* Tabela */}
      <div className="overflow-x-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Cabeçalho */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                Indicadores
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                Referência
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                Atual
              </div>
            </div>
          </div>

          {/* Linhas da tabela */}
          {referencias.map((item, index) => {
            const cores = obterCores(item.status);
            
            return (
              <div 
                key={index}
                className={`px-6 py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
              >
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Nome do indicador */}
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.indicador}
                  </div>
                  
                  {/* Valor de referência */}
                  <div className="text-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                      {item.referencia}
                    </span>
                  </div>
                  
                  {/* Valor atual com status colorido */}
                  <div className="text-center">
                    <span 
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        backgroundColor: cores.fundo,
                        color: cores.texto
                      }}
                    >
                      {item.atual}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            Dentro da referência
          </span>
        </div>
        <div className="flex items-center justify-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Atenção moderada
          </span>
        </div>
        <div className="flex items-center justify-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm font-medium text-red-800 dark:text-red-200">
            Fora da referência
          </span>
        </div>
      </div>

      {/* Nota científica */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Referências científicas:</strong> Os valores de referência são baseados em estudos populacionais e diretrizes de organizações de saúde internacionais. Diferenças por sexo e idade são consideradas quando aplicável.
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
          <strong>Interpretação:</strong> Valores fora das faixas de referência não constituem diagnóstico, mas indicam necessidade de avaliação clínica complementar.
        </p>
      </div>
    </div>
  );
};

export default TabelaReferencias;
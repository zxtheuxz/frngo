import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface CardIndicadorProps {
  titulo: string;
  valor: number;
  unidade?: string;
  status: 'adequado' | 'baixo_risco' | 'atencao' | 'moderado' | 'alto_risco' | 'inadequado' | 'alto' | 'baixo';
  descricao: string;
  className?: string;
}

interface Configuracao {
  cor: string;
  corFundo: string;
  corBorda: string;
  corTexto: string;
}

const CardIndicador: React.FC<CardIndicadorProps> = ({
  titulo,
  valor,
  unidade = '',
  status,
  descricao,
  className = ''
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Configurações de cores baseadas no status (seguindo padrão do Shaped)
  const obterConfiguracao = (status: string): Configuracao => {
    const configs: Record<string, Configuracao> = {
      adequado: {
        cor: '#10B981', // Verde
        corFundo: isDarkMode ? '#064E3B20' : '#D1FAE5',
        corBorda: '#10B981',
        corTexto: isDarkMode ? '#10B981' : '#047857'
      },
      baixo_risco: {
        cor: '#10B981', // Verde
        corFundo: isDarkMode ? '#064E3B20' : '#D1FAE5', 
        corBorda: '#10B981',
        corTexto: isDarkMode ? '#10B981' : '#047857'
      },
      atencao: {
        cor: '#84CC16', // Verde limão
        corFundo: isDarkMode ? '#1A2E0520' : '#ECFCCB',
        corBorda: '#84CC16',
        corTexto: isDarkMode ? '#84CC16' : '#365314'
      },
      moderado: {
        cor: '#F59E0B', // Amarelo
        corFundo: isDarkMode ? '#451A0320' : '#FEF3C7',
        corBorda: '#F59E0B',
        corTexto: isDarkMode ? '#F59E0B' : '#92400E'
      },
      alto_risco: {
        cor: '#EF4444', // Vermelho
        corFundo: isDarkMode ? '#450A0A20' : '#FEE2E2',
        corBorda: '#EF4444',
        corTexto: isDarkMode ? '#EF4444' : '#991B1B'
      },
      inadequado: {
        cor: '#EF4444', // Vermelho
        corFundo: isDarkMode ? '#450A0A20' : '#FEE2E2',
        corBorda: '#EF4444',
        corTexto: isDarkMode ? '#EF4444' : '#991B1B'
      },
      alto: {
        cor: '#6B7280', // Cinza
        corFundo: isDarkMode ? '#1F2937' : '#F3F4F6',
        corBorda: '#6B7280',
        corTexto: isDarkMode ? '#9CA3AF' : '#4B5563'
      },
      baixo: {
        cor: '#EF4444', // Vermelho
        corFundo: isDarkMode ? '#450A0A20' : '#FEE2E2',
        corBorda: '#EF4444',
        corTexto: isDarkMode ? '#EF4444' : '#991B1B'
      }
    };

    return configs[status] || configs.adequado;
  };

  const config = obterConfiguracao(status);

  return (
    <div 
      className={`
        rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md
        ${className}
      `}
      style={{
        backgroundColor: config.corFundo,
        borderColor: config.corBorda
      }}
    >
      {/* Título do indicador */}
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 leading-tight">
        {titulo}
      </h3>
      
      {/* Valor principal */}
      <div className="flex items-baseline mb-3">
        <span 
          className="text-2xl font-bold"
          style={{ color: config.corTexto }}
        >
          {typeof valor === 'number' ? valor.toFixed(valor < 10 ? 1 : 0) : valor}
        </span>
        {unidade && (
          <span 
            className="text-sm font-medium ml-1"
            style={{ color: config.corTexto }}
          >
            {unidade}
          </span>
        )}
      </div>
      
      {/* Status/Descrição */}
      <div 
        className="text-sm font-semibold px-3 py-1 rounded-full text-center"
        style={{ 
          backgroundColor: config.cor + '20',
          color: config.corTexto 
        }}
      >
        {descricao}
      </div>
    </div>
  );
};

export default CardIndicador;
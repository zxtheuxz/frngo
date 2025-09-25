
import React from 'react';
import { Activity, FileText, Heart, Lock } from 'lucide-react';

interface ProgramacaoCardProps {
  title: string;
  icon: React.ReactNode;
  isLiberado: boolean;
  ultimaAvaliacao: string | null;
  onView: () => void;
  themeStyle: any;
  buttonClass: string;
  buttonSecondaryClass: string;
  hasContent: boolean;
}

export const ProgramacaoCard: React.FC<ProgramacaoCardProps> = ({
  title,
  icon,
  isLiberado,
  ultimaAvaliacao,
  onView,
  themeStyle,
  buttonClass,
  buttonSecondaryClass,
  hasContent,
}) => {
  const isDarkMode = themeStyle.background === 'bg-gray-900';

  return (
    <div className={`${themeStyle.card} rounded-lg p-6 ${!isLiberado ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg ${title === 'Programação Física' ? 'bg-purple-600' : 'bg-orange-600'} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${themeStyle.text}`}>
              {title}
            </h3>
            <p className={`text-sm ${themeStyle.textSecondary}`}>
              {isLiberado ? `Seu ${title === 'Programação Física' ? 'treino' : 'plano'} personalizado` : 'Aguardando liberação'}
            </p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${isLiberado ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
      </div>
      
      <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
        <div className="flex items-center justify-between text-sm">
          <span className={themeStyle.textSecondary}>Última atualização</span>
          <span className={themeStyle.text}>{ultimaAvaliacao || 'Não realizada'}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <button
          onClick={onView}
          disabled={!isLiberado}
          className={`w-full py-3 px-4 rounded-lg transition-colors text-sm font-medium ${
            isLiberado 
              ? buttonClass
              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLiberado ? (
            <>
              <FileText className="w-4 h-4 inline mr-2" />
              Ver Programação
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 inline mr-2" />
              Em Preparação
            </>
          )}
        </button>
        
      </div>
    </div>
  );
};

import React from 'react';
import { 
  Loader2, 
  Brain, 
  Camera, 
  Activity, 
  Eye, 
  Zap,
  BarChart3,
  CheckCircle
} from 'lucide-react';

type LoadingStep = 
  | 'profile'
  | 'photos' 
  | 'preparing'
  | 'processing_lateral'
  | 'processing_frontal'
  | 'extracting_measures'
  | 'calculating'
  | 'finalizing'
  | 'loading_results';

interface LoadingAnaliseProps {
  step: LoadingStep;
  isDarkMode?: boolean;
  message?: string;
}

const loadingSteps = {
  profile: {
    icon: Brain,
    title: 'Carregando perfil do usuário',
    description: 'Buscando seus dados corporais e informações pessoais...',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30'
  },
  photos: {
    icon: Camera,
    title: 'Verificando fotos disponíveis',
    description: 'Localizando suas fotos para análise corporal...',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30'
  },
  preparing: {
    icon: Zap,
    title: 'Preparando análise com IA',
    description: 'Inicializando sistema de análise corporal inteligente...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  },
  processing_lateral: {
    icon: Eye,
    title: 'Processando foto lateral',
    description: 'Extraindo medidas da cintura, coxa e panturrilha...',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30'
  },
  processing_frontal: {
    icon: Eye,
    title: 'Processando foto frontal',
    description: 'Extraindo medidas dos braços, antebraços e quadril...',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30'
  },
  extracting_measures: {
    icon: Activity,
    title: 'Extraindo medidas corporais',
    description: 'Convertendo dados da IA em medidas antropométricas...',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30'
  },
  calculating: {
    icon: BarChart3,
    title: 'Calculando composição corporal',
    description: 'Aplicando fórmulas científicas para análise completa...',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
  },
  finalizing: {
    icon: CheckCircle,
    title: 'Finalizando análise',
    description: 'Salvando resultados e preparando relatório...',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30'
  },
  loading_results: {
    icon: BarChart3,
    title: 'Carregando resultados',
    description: 'Preparando visualização dos dados de análise...',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30'
  }
};

const LoadingAnalise: React.FC<LoadingAnaliseProps> = ({ 
  step, 
  isDarkMode = false, 
  message 
}) => {
  const stepConfig = loadingSteps[step];
  const IconComponent = stepConfig.icon;

  return (
    <div className={`flex items-center justify-center py-12 ${
      isDarkMode ? 'bg-black' : 'bg-gray-50'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-2xl shadow-lg border ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Ícone e Spinner */}
        <div className="flex items-center justify-center mb-6">
          <div className={`relative p-4 rounded-full ${stepConfig.bgColor}`}>
            <IconComponent className={`h-8 w-8 ${stepConfig.color}`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className={`h-12 w-12 animate-spin ${stepConfig.color} opacity-70`} />
            </div>
          </div>
        </div>

        {/* Título */}
        <h3 className={`text-xl font-bold text-center mb-3 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {stepConfig.title}
        </h3>

        {/* Descrição */}
        <p className={`text-center mb-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {message || stepConfig.description}
        </p>

        {/* Barra de Progresso Animada */}
        <div className={`w-full rounded-full h-2 ${
          isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
        }`}>
          <div 
            className={`h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse transition-all duration-1000`}
            style={{ 
              width: '60%',
              animation: 'loading-progress 2s ease-in-out infinite alternate'
            }}
          />
        </div>

        {/* Dica de Carregamento */}
        <div className={`mt-6 p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-blue-900/20 border-blue-500/30' 
            : 'bg-blue-50 border-blue-200'
        } border`}>
          <p className={`text-sm ${
            isDarkMode ? 'text-blue-300' : 'text-blue-700'
          }`}>
            💡 <strong>Aguarde:</strong> Este processo utiliza inteligência artificial avançada 
            para extrair medidas precisas das suas fotos e calcular sua composição corporal.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading-progress {
          0% { width: 30%; }
          50% { width: 70%; }
          100% { width: 85%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingAnalise;
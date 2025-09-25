import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Scale, AlertCircle, CheckCircle, Loader2, ClipboardCheck, ArrowLeft, Heart, User, Sun, Moon } from 'lucide-react';
import { Layout } from '../../components/Layout';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClass } from '../../styles/theme';
import { ConsentModal } from '../../components/ConsentModal';
import { TermsService } from '../../lib/termsService';
import { useAuth } from '../../contexts/AuthContext';
import { SessionManager } from '../../utils/sessionManager';

// Design energético e motivacional com cores vibrantes
const themeStyles = {
  light: {
    background: "bg-gradient-to-br from-blue-100 via-purple-50 to-orange-100",
    text: "text-gray-800",
    textSecondary: "text-gray-600",
    card: "bg-white/90 backdrop-blur-md shadow-lg border border-purple-200/50",
    button: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg",
    buttonSecondary: "bg-gradient-to-r from-blue-100 to-purple-100 hover:from-blue-200 hover:to-purple-200 text-blue-700",
    input: "bg-white/70 border border-purple-300 focus:border-purple-500",
    scrollbar: {
      track: "bg-purple-100",
      thumb: "bg-gradient-to-b from-blue-400 to-purple-500 hover:from-blue-500 hover:to-purple-600"
    }
  },
  dark: {
    background: "bg-gradient-to-br from-slate-900 via-purple-900/30 to-orange-900/30",
    text: "text-white",
    textSecondary: "text-gray-300",
    card: "bg-slate-800/80 backdrop-blur-md border border-purple-500/30 shadow-xl",
    button: "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg",
    buttonSecondary: "bg-gradient-to-r from-slate-700/80 to-purple-800/50 hover:from-slate-600/80 hover:to-purple-700/50 text-purple-200",
    input: "bg-slate-800/70 border border-purple-600 focus:border-purple-400",
    scrollbar: {
      track: "bg-slate-800",
      thumb: "bg-gradient-to-b from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
    }
  }
};

interface FormData {
  // Dados Pessoais
  data_nascimento: string;
  estado_civil: string;
  tem_filhos: boolean;
  quantidade_filhos: number;
  objetivo: string;
  peso: string;
  altura: string;
  peso_habitual: string;
  perda_peso_recente: string;
  ganho_peso_recente: string;
  percepcao_corporal: string;

  // Saúde
  idade_primeira_menstruacao: string;
  ciclo_menstrual_regular: boolean;
  duracao_ciclo_menstrual: string;
  monitora_ciclo: boolean;
  sintomas_tpm: string[];
  sintoma_tpm_principal: string;
  tpm_afeta_alimentacao: string;
  doencas_ginecologicas: string[];
  faz_acompanhamento_periodico: boolean;
  suspeita_doenca: string;
  doencas_repetitivas: string;
  historico_familiar_ginecologico: string[];

  // Estilo de Vida e História Gestacional
  ja_engravidou: boolean;
  quantidade_gestacoes: number;
  tipos_parto: string[];
  teve_perda_gestacional: boolean;
  tentando_engravidar: boolean;
  usa_contraceptivo: boolean;
  metodo_contraceptivo: string;
  tempo_uso_contraceptivo: string;
  libido: string;
  nivel_estresse: number;
  fumante: boolean;
  consumo_alcool: string;
  horas_sono: number;
  qualidade_sono: string;
  pratica_exercicios: boolean;
  frequencia_exercicios: string;
  tipo_exercicios: string;
  detalhes_exercicios: string;

  // Hábitos Alimentares e Intestinais
  intestino_regular: boolean;
  frequencia_evacuacao: string;
  consistencia_fezes: string;
  tem_constipacao: boolean;
  tem_diarreia: boolean;
  dificuldade_evacuar: boolean;
  sangramento_evacuar: boolean;
  observacoes_intestinais: string;
  intolerancia_alimentar: string[];
  alimentos_essenciais: string[];
  preferencia_sabor: string;
  aversao_alimentar: string[];
  horario_mais_fome: string;
  numero_refeicoes: string;
  local_refeicoes: string;
  consumo_agua_litros: string;
  velocidade_comer: string;
  mastigacao: string;
  belisca_entre_refeicoes: boolean;
  rotina_diaria: string;
  rotina_alimentar: string;
  diario_alimentar: string;
  alergias_alimentares: string;
  preferencias_alimentares: string;

  // Adicionar campos que faltam
  tem_doencas_ginecologicas: boolean;
  tem_suspeita_doenca: boolean;
  tem_historico_familiar: boolean;
  tem_intolerancia: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export function AvaliacaoNutricionalFeminina() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('mode') === 'view';
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Hook de autenticação aprimorado
  const { user, loading: authLoading, userProfile } = useAuth();

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [perfilData, setPerfilData] = useState<any>(null);
  const [avaliacaoExistente, setAvaliacaoExistente] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4; // Dividir em 4 etapas como no formulário masculino
  const [confirmedStep4, setConfirmedStep4] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  
  // Estados para o modal de consentimento
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  // Estados para salvamento automático
  const [progressSaved, setProgressSaved] = useState(false);
  const [hasProgressToRestore, setHasProgressToRestore] = useState(false);

  // Função para gerar mensagens de erro mais específicas
  const getErrorMessage = (error: string, context: string = ''): string => {
    const errorMap: Record<string, string> = {
      'Usuário não autenticado': 'Sua sessão expirou. Por favor, faça login novamente para continuar.',
      'Erro de autenticação': 'Problemas de conectividade detectados. Tentando reconectar...',
      'Falha na operação após tentativas de retry': 'Não foi possível conectar ao servidor após várias tentativas. Verifique sua conexão com a internet.',
      'Network Error': 'Erro de rede. Verifique sua conexão com a internet e tente novamente.',
      'timeout': 'A operação demorou mais que o esperado. Tente novamente.',
      'JWT': 'Problema de autenticação. Redirecionando para nova sessão...'
    };

    // Procurar por palavras-chave no erro
    for (const [keyword, message] of Object.entries(errorMap)) {
      if (error.toLowerCase().includes(keyword.toLowerCase())) {
        return context ? `${message} (${context})` : message;
      }
    }

    // Mensagem padrão mais amigável
    if (context) {
      return `Ocorreu um erro durante ${context}. Tente novamente ou atualize a página.`;
    }

    return error || 'Ocorreu um erro inesperado. Tente novamente.';
  };
  const [consentRejected, setConsentRejected] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);
  
  const themeStyle = isDarkMode ? themeStyles.dark : themeStyles.light;
  
  // Usando o getThemeClass para obter as classes do tema
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `${getThemeClass(isDarkMode, 'cardBg')} border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: `${getThemeClass(isDarkMode, 'input')} ${
      isDarkMode 
        ? 'bg-gray-800 text-white border-gray-600 focus:border-orange-500' 
        : 'bg-white text-gray-900 border-gray-300 focus:border-orange-500'
    } block w-full rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20`,
    select: getThemeClass(isDarkMode, 'select'),
    label: `${isDarkMode ? 'text-gray-200' : 'text-gray-700'} font-medium`,
    helperText: `${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`,
    radio: `${isDarkMode ? 'text-orange-500 border-gray-600' : 'text-orange-500 border-gray-300'} h-4 w-4 focus:ring-orange-500/20`,
    radioLabel: `${isDarkMode ? 'text-gray-200' : 'text-gray-700'} ml-2 text-sm font-medium`,
    errorText: isDarkMode ? 'text-red-400' : 'text-red-600',
    formSection: `${getThemeClass(isDarkMode, 'cardBg')} p-8 rounded-xl border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    requiredMark: 'text-red-500 ml-1',
    stepIndicator: {
      active: getThemeClass(isDarkMode, 'button'),
      completed: "bg-green-600 text-white shadow-md",
      inactive: isDarkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"
    }
  };

  // Função para gerar classes CSS dos inputs com validação
  const getInputClasses = (fieldName: string) => {
    const hasError = formErrors[fieldName];
    const baseClasses = `${getThemeClass(isDarkMode, 'input')} block w-full rounded-lg px-4 py-2.5 text-sm transition-colors duration-200 placeholder:text-gray-500 focus:outline-none`;
    
    if (hasError) {
      return `${baseClasses} ${
        isDarkMode 
          ? 'bg-gray-800 text-white border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20' 
          : 'bg-white text-gray-900 border-red-500 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
      } input-error`;
    } else {
      return `${baseClasses} ${
        isDarkMode 
          ? 'bg-gray-800 text-white border-gray-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20' 
          : 'bg-white text-gray-900 border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20'
      }`;
    }
  };

  const [formData, setFormData] = useState<FormData>({
    // Dados Pessoais
    data_nascimento: '',
    estado_civil: '',
    tem_filhos: false,
    quantidade_filhos: 0,
    objetivo: '',
    peso: '',
    altura: '',
    peso_habitual: '',
    perda_peso_recente: '',
    ganho_peso_recente: '',
    percepcao_corporal: '',

    // Saúde
    idade_primeira_menstruacao: '',
    ciclo_menstrual_regular: false,
    duracao_ciclo_menstrual: '',
    monitora_ciclo: false,
    sintomas_tpm: [],
    sintoma_tpm_principal: '',
    tpm_afeta_alimentacao: '',
    doencas_ginecologicas: [],
    faz_acompanhamento_periodico: false,
    suspeita_doenca: '',
    doencas_repetitivas: '',
    historico_familiar_ginecologico: [],

    // Estilo de Vida e História Gestacional
    ja_engravidou: false,
    quantidade_gestacoes: 0,
    tipos_parto: [],
    teve_perda_gestacional: false,
    tentando_engravidar: false,
    usa_contraceptivo: false,
    metodo_contraceptivo: '',
    tempo_uso_contraceptivo: '',
    libido: '',
    nivel_estresse: 0,
    fumante: false,
    consumo_alcool: '',
    horas_sono: 0,
    qualidade_sono: '',
    pratica_exercicios: false,
    frequencia_exercicios: '',
    tipo_exercicios: '',
    detalhes_exercicios: '',

    // Hábitos Alimentares e Intestinais
    intestino_regular: false,
    frequencia_evacuacao: '',
    consistencia_fezes: '',
    tem_constipacao: false,
    tem_diarreia: false,
    dificuldade_evacuar: false,
    sangramento_evacuar: false,
    observacoes_intestinais: '',
    intolerancia_alimentar: [],
    alimentos_essenciais: [],
    preferencia_sabor: '',
    aversao_alimentar: [],
    horario_mais_fome: '',
    numero_refeicoes: '',
    local_refeicoes: '',
    consumo_agua_litros: '',
    velocidade_comer: '',
    mastigacao: '',
    belisca_entre_refeicoes: false,
    rotina_diaria: '',
    rotina_alimentar: '',
    diario_alimentar: '',
    alergias_alimentares: '',
    preferencias_alimentares: '',

    // Adicionar campos que faltam
    tem_doencas_ginecologicas: false,
    tem_suspeita_doenca: false,
    tem_historico_familiar: false,
    tem_intolerancia: false,
  });

  // Aplica estilos de fundo e animações
  // UseEffect para verificar consentimento
  useEffect(() => {
    const checkConsent = async () => {
      try {
        // Usar verificação simples como outros componentes do sistema
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.error('[Feminina] Erro ao verificar usuário:', error);
          setErro('Erro de autenticação. Por favor, recarregue a página.');
          return;
        }

        if (!currentUser) {
          console.error('[Feminina] Usuário não autenticado');
          setErro('Usuário não autenticado. Por favor, faça login novamente.');
          return;
        }

        const consent = await TermsService.hasUserConsented(currentUser.id, 'AVALIACAO_FISICA_NUTRICIONAL');
        
        if (consent === null) {
          // Usuário nunca deu consentimento, mostrar modal
          setShowConsentModal(true);
        } else if (consent === false) {
          // Usuário rejeitou o termo
          setConsentRejected(true);
        } else {
          // Usuário aceitou o termo
          setConsentChecked(true);
        }
      } catch (error) {
        console.error('Erro ao verificar consentimento:', error);
        setErro(getErrorMessage('Erro ao carregar página', 'verificação de consentimento'));
      } finally {
        setCheckingConsent(false);
      }
    };

    checkConsent();
  }, [navigate]);

  useEffect(() => {
    // Adicionar CSS personalizado para animação dos elementos nutricionais
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateX(-100px); opacity: 0; }
        10% { opacity: ${isDarkMode ? '0.03' : '0.05'}; }
        90% { opacity: ${isDarkMode ? '0.03' : '0.05'}; }
        100% { transform: translateX(calc(100vw + 100px)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Aplicar background consistente com o tema
    if (isDarkMode) {
      document.documentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.documentElement.style.backgroundColor = '#0f172a';
      document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.documentElement.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
      document.documentElement.style.backgroundColor = '#f8fafc';
      document.body.style.background = 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)';
      document.body.style.backgroundColor = '#f8fafc';
    }
    
    // Cleanup: remover o style quando o componente for desmontado
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, [isDarkMode]);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.values(formData).some(value => value) && !sucesso) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formData, sucesso]);

  const carregarDados = async () => {
    try {
      // Usar verificação simples como outros componentes do sistema
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error || !currentUser) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se há progresso salvo
      const savedProgress = SessionManager.getFormProgress('nutricional_feminino', currentUser.id);
      if (savedProgress && !isViewMode) {
        setHasProgressToRestore(true);
        setFormData(savedProgress.data);
        setCurrentStep(savedProgress.step);
        console.log('[Feminina] Progresso restaurado:', savedProgress);
      }

      // Carrega o perfil
      const { data: perfil, error: perfilError } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (perfilError) throw perfilError;
      setPerfilData(perfil);

      // Carrega avaliação existente
      const { data: avaliacao, error: avaliacaoError } = await supabase
        .from('avaliacao_nutricional_feminino')
        .select('*')
        .eq('user_id', currentUser.id)
        .single();

      if (avaliacaoError && avaliacaoError.code !== 'PGRST116') {
        throw avaliacaoError;
      }

      if (avaliacao) {
        setAvaliacaoExistente(avaliacao);
        if (isViewMode) {
          // Em modo de visualização, carrega os dados existentes
          setFormData({
            ...formData,
            ...avaliacao,
            // Converter data de volta para formato brasileiro para exibição
            data_nascimento: converterDataParaBrasileiro(avaliacao.data_nascimento),
            // Garante que os campos de controle da interface estejam corretos
            doencas_ginecologicas: avaliacao.doencas_ginecologicas?.split(',') || [],
            historico_familiar_ginecologico: avaliacao.historico_familiar_ginecologico?.split(',') || [],
            suspeita_doenca: avaliacao.suspeita_doenca || '',
            faz_acompanhamento_periodico: !!avaliacao.faz_acompanhamento_periodico,
            doencas_repetitivas: avaliacao.doencas_repetitivas || '',
            tem_constipacao: !!avaliacao.tem_constipacao,
            tem_diarreia: !!avaliacao.tem_diarreia,
            dificuldade_evacuar: !!avaliacao.dificuldade_evacuar,
            sangramento_evacuar: !!avaliacao.sangramento_evacuar,
            intolerancia_alimentar: avaliacao.intolerancia_alimentar?.split(',') || [],
            alimentos_essenciais: avaliacao.alimentos_essenciais?.split(',') || [],
            preferencia_sabor: avaliacao.preferencia_sabor || '',
            aversao_alimentar: avaliacao.aversao_alimentar?.split(',') || [],
            horario_mais_fome: avaliacao.horario_mais_fome || '',
            numero_refeicoes: avaliacao.numero_refeicoes || '',
            local_refeicoes: avaliacao.local_refeicoes || '',
            consumo_agua_litros: avaliacao.consumo_agua_litros || '',
            velocidade_comer: avaliacao.velocidade_comer || '',
            mastigacao: avaliacao.mastigacao || '',
            belisca_entre_refeicoes: !!avaliacao.belisca_entre_refeicoes,
            rotina_diaria: avaliacao.rotina_diaria || '',
            rotina_alimentar: avaliacao.rotina_alimentar || '',
            diario_alimentar: avaliacao.diario_alimentar || '',
            alergias_alimentares: avaliacao.alergias_alimentares || '',
            preferencias_alimentares: avaliacao.preferencias_alimentares || ''
          });
        } else {
          // Se não estiver em modo de visualização e já existe avaliação, redireciona
          navigate('/dashboard');
        }
      } else if (isViewMode) {
        // Se está em modo de visualização mas não existe avaliação, redireciona
        navigate('/dashboard');
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar dados';
      setErro(getErrorMessage(errorMessage, 'carregamento dos dados do perfil'));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? '' : parseFloat(value)
      }));
    } else if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else if (type === 'radio') {
      const boolValue = value === 'true';
      
      setFormData(prev => {
        const newState = {
          ...prev,
          [name]: boolValue
        };
        
        // Resetar campos dependentes quando o valor for false
        if (name === 'tem_filhos' && !boolValue) {
          newState.quantidade_filhos = 0;
        }
        if (name === 'tem_doencas_ginecologicas' && !boolValue) {
          newState.doencas_ginecologicas = [];
        }
        if (name === 'tem_suspeita_doenca' && !boolValue) {
          newState.suspeita_doenca = '';
        }
        if (name === 'tem_historico_familiar' && !boolValue) {
          newState.historico_familiar_ginecologico = [];
        }
        if (name === 'usa_contraceptivo' && !boolValue) {
          newState.metodo_contraceptivo = '';
          newState.tempo_uso_contraceptivo = '';
        }
        if (name === 'ja_engravidou' && !boolValue) {
          newState.quantidade_gestacoes = 0;
          newState.tipos_parto = [];
        }
        if (name === 'pratica_exercicios' && !boolValue) {
          newState.detalhes_exercicios = '';
        }
        if (name === 'tem_intolerancia' && !boolValue) {
          newState.intolerancia_alimentar = [];
        }

        return newState;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Permitir quebras de linha e preservar espaços ou separação por vírgulas
    const isTextarea = e.target.tagName.toLowerCase() === 'textarea';
    
    setFormData(prev => ({
      ...prev,
      [name]: isTextarea 
        ? value.split('\n').filter(item => item !== '')
        : value.split(',').map(item => item.trim()).filter(item => item !== '')
    }));
  };

  // Função para converter data DD/MM/YYYY para YYYY-MM-DD (formato ISO)
  const converterDataParaISO = (dataBrasileira: string): string => {
    if (!dataBrasileira || dataBrasileira.length !== 10) {
      throw new Error('Data inválida. Use o formato DD/MM/YYYY');
    }
    
    const [dia, mes, ano] = dataBrasileira.split('/');
    
    if (!dia || !mes || !ano || ano.length !== 4) {
      throw new Error('Data inválida. Use o formato DD/MM/YYYY');
    }
    
    const dataISO = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    
    // Validar se a data é válida
    const dataValidacao = new Date(dataISO);
    if (isNaN(dataValidacao.getTime())) {
      throw new Error('Data inválida');
    }
    
    return dataISO;
  };

  // Função para converter data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/YYYY)
  const converterDataParaBrasileiro = (dataISO: string): string => {
    if (!dataISO) return '';
    
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  // Função especializada para o campo de altura
  const handleAlturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.trim();
    
    // Se estiver vazio, permitir
    if (value === '') {
      setFormData(prev => ({ ...prev, altura: '' }));
      return;
    }
    
    // Converter vírgula para ponto
    value = value.replace(',', '.');
    
    // Remover caracteres inválidos (manter apenas números e um ponto)
    value = value.replace(/[^0-9.]/g, '');
    
    // Garantir apenas um ponto decimal
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Permitir usuário continuar digitando valores pequenos (evitar processamento prematuro)
    if (value.length <= 2 && !value.includes('.')) {
      setFormData(prev => ({ ...prev, altura: value }));
      return;
    }
    
    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return; // Não atualizar se não for um número válido
    }
    
    let finalValue = '';
    
    // LÓGICA SIMPLIFICADA:
    
    // 1. Se tem ponto, tratar como metros já no formato correto
    if (value.includes('.')) {
      if (numValue >= 1.0 && numValue <= 2.5) {
        finalValue = numValue.toFixed(2);
      } else {
        // Manter valor atual para o usuário ver o erro
        setFormData(prev => ({ ...prev, altura: value }));
        return;
      }
    }
    // 2. Se não tem ponto e é >= 100, tratar como centímetros
    else if (numValue >= 100 && numValue <= 250) {
      finalValue = (numValue / 100).toFixed(2);
    }
    // 3. Para outros casos, deixar o usuário continuar digitando
    else {
      setFormData(prev => ({ ...prev, altura: value }));
      return;
    }
    
    setFormData(prev => ({ ...prev, altura: finalValue }));
  };

  // Função para calcular idade
  const calcularIdade = (dataNascimento: string): number => {
    const dataISO = converterDataParaISO(dataNascimento);
    const hoje = new Date();
    const nascimento = new Date(dataISO);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const m = hoje.getMonth() - nascimento.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  // Função para validar cada etapa
  const validateStep = (step: number): boolean => {
    const errors = validateForm(step);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para validar o formulário
  const validateForm = (step: number): FormErrors => {
    const errors: FormErrors = {};

    switch (step) {
      case 1:
        // Validação dos dados pessoais
        if (!formData.data_nascimento) {
          errors.data_nascimento = "Data de nascimento é obrigatória";
        } else {
          try {
            // Validar se a data está no formato correto e pode ser convertida
            converterDataParaISO(formData.data_nascimento);
            
            // Validar se a pessoa tem pelo menos 16 anos e no máximo 100 anos
            const idade = calcularIdade(formData.data_nascimento);
            if (idade < 16) {
              errors.data_nascimento = "Idade mínima é 16 anos";
            } else if (idade > 100) {
              errors.data_nascimento = "Idade máxima é 100 anos";
            }
          } catch (error) {
            errors.data_nascimento = "Data inválida. Use o formato DD/MM/YYYY";
          }
        }
        if (!formData.estado_civil) {
          errors.estado_civil = "Estado civil é obrigatório";
        }
        if (!formData.objetivo) {
          errors.objetivo = "Objetivo é obrigatório";
        }
        if (!formData.peso) {
          errors.peso = "Peso é obrigatório";
        }
        if (!formData.altura) {
          errors.altura = "Altura é obrigatória";
        } else {
          const alturaNum = parseFloat(formData.altura.toString());
          if (isNaN(alturaNum) || alturaNum < 1.0 || alturaNum > 2.5) {
            errors.altura = "Altura deve estar entre 1.00 e 2.50 metros (ex: 1.65)";
          } else if (!/^\d{1}\.\d{2}$/.test(formData.altura.toString())) {
            errors.altura = "Altura deve estar no formato X.XX (ex: 1.65)";
          }
        }
        if (!formData.peso_habitual) {
          errors.peso_habitual = "Peso habitual é obrigatório";
        }
        if (formData.tem_filhos && !formData.quantidade_filhos) {
          errors.quantidade_filhos = "Quantidade de filhos é obrigatória";
        }
        if (!formData.percepcao_corporal) {
          errors.percepcao_corporal = "Este campo é obrigatório";
        }
        break;

      case 2:
        // Validação dos dados de saúde
        if (!formData.idade_primeira_menstruacao) {
          errors.idade_primeira_menstruacao = "Idade da primeira menstruação é obrigatória";
        }
        if (!formData.duracao_ciclo_menstrual) {
          errors.duracao_ciclo_menstrual = "Duração do ciclo menstrual é obrigatória";
        }
        if (!formData.sintoma_tpm_principal) {
          errors.sintoma_tpm_principal = "Sintoma principal de TPM é obrigatório";
        }
        if (!formData.tpm_afeta_alimentacao) {
          errors.tpm_afeta_alimentacao = "Este campo é obrigatório";
        }
        // Validação condicional corrigida - só obrigatório se tem_doencas_ginecologicas é true
        if (formData.tem_doencas_ginecologicas && formData.doencas_ginecologicas.length === 0) {
          errors.doencas_ginecologicas = "Por favor, especifique as doenças ginecológicas";
        }
        // Validação condicional para suspeita de doença
        if (formData.tem_suspeita_doenca && !formData.suspeita_doenca.trim()) {
          errors.suspeita_doenca = "Por favor, especifique a suspeita de doença";
        }
        // Validação condicional para histórico familiar
        if (formData.tem_historico_familiar && formData.historico_familiar_ginecologico.length === 0) {
          errors.historico_familiar_ginecologico = "Por favor, especifique o histórico familiar";
        }
        break;

      case 3:
        // Validação do estilo de vida
        if (formData.ja_engravidou && !formData.quantidade_gestacoes) {
          errors.quantidade_gestacoes = "Número de gestações é obrigatório";
        }
        if (!formData.horas_sono) {
          errors.horas_sono = "Horas de sono é obrigatório";
        }
        if (!formData.qualidade_sono) {
          errors.qualidade_sono = "Qualidade do sono é obrigatória";
        }
        if (formData.pratica_exercicios && !formData.detalhes_exercicios) {
          errors.detalhes_exercicios = "Detalhes dos exercícios são obrigatórios";
        }
        break;

      case 4:
        // Validação dos hábitos alimentares
        if (!formData.numero_refeicoes) {
          errors.numero_refeicoes = "Número de refeições é obrigatório";
        }
        if (!formData.consumo_agua_litros) {
          errors.consumo_agua_litros = "Consumo de água é obrigatório";
        }
        if (!formData.velocidade_comer) {
          errors.velocidade_comer = "Velocidade ao comer é obrigatória";
        }
        if (!formData.mastigacao) {
          errors.mastigacao = "Mastigação é obrigatória";
        }
        // Validação condicional para intolerância alimentar
        if (formData.tem_intolerancia && formData.intolerancia_alimentar.length === 0) {
          errors.intolerancia_alimentar = "Por favor, especifique as intolerâncias alimentares";
        }
        break;
    }

    return errors;
  };

  // Função para avançar etapa
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setShowValidationAlert(false); // Esconder alerta se validação passou
      if (currentStep < totalSteps) {
        const newStep = currentStep + 1;
        setCurrentStep(newStep);

        // Salvar progresso ao avançar
        if (user) {
          SessionManager.saveFormProgress('nutricional_feminino', newStep, formData, user.id);
          console.log(`[Feminina] Progresso salvo - Etapa ${newStep}`);
        }

        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
      }
    } else {
      // Mostrar alerta de validação
      setShowValidationAlert(true);
      
      // Fazer scroll para o primeiro campo com erro
      setTimeout(() => {
        const firstError = document.querySelector('.input-error, [data-error="true"]');
        if (firstError) {
          firstError.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        } else {
          // Se não encontrar campo com classe específica, fazer scroll para o topo
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  // Função para voltar etapa
  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);

      // Salvar progresso ao voltar
      if (user) {
        SessionManager.saveFormProgress('nutricional_feminino', newStep, formData, user.id);
        console.log(`[Feminina] Progresso salvo - Etapa ${newStep}`);
      }

      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  };

  // Função para confirmar última etapa
  const confirmStep4 = () => {
    if (validateStep(4)) {
      setConfirmedStep4(true);
      setShowConfirmationMessage(true);
      setTimeout(() => {
        setShowConfirmationMessage(false);
      }, 5000);
    }
  };

  // Funções para lidar com o consentimento
  const handleConsentAccept = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error || !currentUser) {
        setErro('Usuário não autenticado. Por favor, faça login novamente.');
        return;
      }

      const success = await TermsService.recordConsent(currentUser.id, 'AVALIACAO_FISICA_NUTRICIONAL', true);
      if (success) {
        setConsentChecked(true);
        setShowConsentModal(false);
      } else {
        setErro(getErrorMessage('Erro ao registrar consentimento', 'gravação do consentimento'));
      }
    } catch (error) {
      console.error('Erro ao aceitar consentimento:', error);
      setErro('Erro ao registrar consentimento. Tente novamente.');
    }
  };

  const handleConsentReject = async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();

      if (error || !currentUser) {
        setErro('Usuário não autenticado. Por favor, faça login novamente.');
        return;
      }

      const success = await TermsService.recordConsent(currentUser.id, 'AVALIACAO_FISICA_NUTRICIONAL', false);
      if (success) {
        setConsentRejected(true);
        setShowConsentModal(false);
        // Redirecionar para o dashboard após rejeitar
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setErro(getErrorMessage('Erro ao registrar consentimento', 'gravação do consentimento'));
      }
    } catch (error) {
      console.error('Erro ao rejeitar consentimento:', error);
      setErro('Erro ao registrar consentimento. Tente novamente.');
    }
  };

  const handleConsentClose = () => {
    // Fechar modal sem consentimento redireciona para dashboard
    navigate('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }
    
    setLoading(true);
    setErro('');
    setSucesso(false);

    try {
      // Usar verificação simples como outros componentes do sistema
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        throw new Error('Usuário não autenticado');
      }

      const idade = calcularIdade(formData.data_nascimento);

      // Converter data para formato ISO antes do salvamento
      const dataISO = converterDataParaISO(formData.data_nascimento);

      const dadosAvaliacao = {
        ...formData,
        data_nascimento: dataISO, // Usar data convertida
        user_id: currentUser.id,
        idade,
        status: 'PENDENTE',
        ultima_atualizacao: new Date().toISOString()
      };

      const { error: avaliacaoError } = await supabase
        .from('avaliacao_nutricional_feminino')
        .insert([dadosAvaliacao]);

      if (avaliacaoError) {
        console.error('Erro ao salvar avaliação:', avaliacaoError);
        throw avaliacaoError;
      }

      setSucesso(true);

      // Limpar progresso salvo após submissão bem-sucedida
      SessionManager.clearFormProgress('nutricional_feminino', currentUser.id);
      console.log('[Feminina] Progresso limpo após submissão bem-sucedida');

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Erro detalhado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar avaliação nutricional';
      setErro(getErrorMessage(errorMessage, 'submissão do formulário'));
    } finally {
      setLoading(false);
    }
  };

  if (!perfilData) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className={`min-h-screen ${themeClasses.background} relative overflow-hidden`}>
        {/* Background decorativo com efeito nutricional feminino */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Círculos decorativos */}
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-pink-500/5' : 'bg-pink-100/30'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-purple-500/5' : 'bg-purple-100/30'}`}></div>
          <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full ${isDarkMode ? 'bg-blue-500/3' : 'bg-blue-100/20'}`}></div>
          
          {/* Elementos nutricionais femininos animados bem sutis */}
          <div className="absolute inset-0">
            {/* Elemento 1 - linha superior */}
            <div className={`absolute top-20 opacity-5 ${isDarkMode ? 'opacity-3' : 'opacity-5'}`} 
                 style={{
                   animation: 'float 35s linear infinite',
                   left: '-50px'
                 }}>
              <span className="text-3xl">🌸</span>
            </div>
            
            {/* Elemento 2 - linha do meio */}
            <div className={`absolute top-1/2 opacity-5 ${isDarkMode ? 'opacity-3' : 'opacity-5'}`}
                 style={{
                   animation: 'float 40s linear infinite 8s',
                   left: '-50px'
                 }}>
              <span className="text-2xl">🍓</span>
            </div>
            
            {/* Elemento 3 - linha inferior */}
            <div className={`absolute bottom-32 opacity-5 ${isDarkMode ? 'opacity-3' : 'opacity-5'}`}
                 style={{
                   animation: 'float 45s linear infinite 15s',
                   left: '-50px'
                 }}>
              <span className="text-3xl">🥗</span>
            </div>
            
            {/* Elemento 4 - linha alternativa */}
            <div className={`absolute top-1/3 opacity-5 ${isDarkMode ? 'opacity-3' : 'opacity-5'}`}
                 style={{
                   animation: 'float 50s linear infinite 25s',
                   left: '-50px'
                 }}>
              <span className="text-2xl">💖</span>
            </div>
          </div>
        </div>

        {/* Loading de verificação de consentimento */}
        {checkingConsent && (
          <div className="relative z-10 flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className={`${themeClasses.textSecondary}`}>Verificando permissões...</p>
            </div>
          </div>
        )}

        {/* Tela de consentimento rejeitado */}
        {consentRejected && (
          <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
            <div className={`text-center max-w-md p-8 rounded-2xl ${themeClasses.card}`}>
              <div className={`w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-red-900/30' : 'bg-red-100'
              }`}>
                <AlertCircle className={`h-8 w-8 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
              </div>
              <h3 className={`text-xl font-bold mb-4 ${themeClasses.text}`}>
                Acesso Negado
              </h3>
              <p className={`${themeClasses.textSecondary} mb-6`}>
                Você optou por não aceitar os termos de consentimento. Para preencher a avaliação nutricional, 
                é necessário aceitar os termos.
              </p>
              <p className={`text-sm ${themeClasses.textSecondary} mb-6`}>
                Redirecionando para o dashboard em alguns segundos...
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className={`w-full px-6 py-3 rounded-xl font-semibold ${themeClasses.button}`}
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo principal - apenas se consentimento foi dado */}
        {consentChecked && (
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Botão Voltar para Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`group flex items-center mb-6 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700' 
                : 'bg-white/80 text-gray-600 hover:bg-white shadow-sm border border-gray-200'
            }`}
          >
            <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Voltar para Dashboard
          </button>

          {sucesso ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] relative">
              {/* Animação de confete */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-bounce"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  >
                    <span className="text-2xl">
                      {['🎉', '✨', '🌟', '💖', '🌸'][Math.floor(Math.random() * 5)]}
                    </span>
                  </div>
                ))}
              </div>

              <div className={`relative z-10 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100/80'} backdrop-blur-sm rounded-full p-8 mb-8 animate-pulse`}>
                <CheckCircle className={`h-20 w-20 ${isDarkMode ? 'text-green-400' : 'text-green-500'} animate-bounce`} />
              </div>
              
              <h2 className={`text-3xl md:text-4xl font-bold mb-6 text-center bg-gradient-to-r ${
                isDarkMode 
                  ? 'from-green-400 to-emerald-400' 
                  : 'from-green-600 to-emerald-600'
              } bg-clip-text text-transparent animate-pulse`}>
                Avaliação Nutricional Enviada com Sucesso!
              </h2>
              
              <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto shadow-xl border ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}>
                <p className={`${themeClasses.textSecondary} text-center text-lg leading-relaxed`}>
                  🎉 <strong>Parabéns!</strong> Sua avaliação nutricional feminina foi recebida com sucesso e está sendo analisada por nossos especialistas em nutrição feminina.
                  <br /><br />
                  💖 Em breve você receberá seu plano nutricional personalizado, desenvolvido especialmente para suas necessidades e objetivos únicos como mulher.
                </p>
              </div>
              
              <button
                onClick={() => navigate('/dashboard')}
                className={`group flex items-center px-8 py-4 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r ${
                  isDarkMode 
                    ? 'from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600' 
                    : 'from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                } text-white shadow-lg hover:shadow-pink-500/25 font-semibold text-lg`}
              >
                <ArrowLeft className="h-5 w-5 mr-3 transition-transform group-hover:-translate-x-1" />
                Voltar para o Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-12">
                {/* Título principal redesenhado */}
                <div className="relative inline-block mb-8">
                  <h1 className={`text-4xl md:text-5xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                      Avaliação
                    </span>{' '}
                    <span className={isDarkMode ? 'text-white' : 'text-gray-800'}>
                      Nutricional
                    </span>
                  </h1>
                  <div className="h-1 w-32 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full mx-auto opacity-80 animate-pulse"></div>
                </div>
                
                <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-2xl mx-auto`}>
                  Complete sua avaliação nutricional em 4 etapas simples e receba seu plano alimentar personalizado
                </p>
                
                {/* Botão de alternância de tema */}
                <button 
                  onClick={toggleTheme}
                  className={`p-3 rounded-full transition-all duration-300 ease-in-out
                            hover:scale-110 active:scale-95 hover:rotate-12
                            ${isDarkMode 
                              ? 'bg-gray-800/50 text-orange-400 hover:bg-gray-700/50 shadow-lg' 
                              : 'bg-white/80 text-orange-500 hover:bg-white shadow-lg'}
                            border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200/50'}`}
                  aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 transition-transform hover:rotate-180" />
                  ) : (
                    <Moon className="h-5 w-5 transition-transform hover:-rotate-12" />
                  )}
                </button>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-red-500 flex-shrink-0" />
                      <span className="block sm:inline">{erro}</span>
                    </div>
                    {(erro.includes('sessão') || erro.includes('autenticação') || erro.includes('conectar')) && (
                      <button
                        onClick={async () => {
                          setErro('');
                          setLoading(true);
                          try {
                            await carregarDados();
                          } catch (error) {
                            console.error('Erro ao reconectar:', error);
                          } finally {
                            setLoading(false);
                          }
                        }}
                        className="ml-4 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex-shrink-0"
                      >
                        Tentar Novamente
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Notificação de progresso salvo */}
              {progressSaved && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="block sm:inline">Progresso salvo automaticamente!</span>
                  </div>
                </div>
              )}

              {/* Notificação de progresso restaurado */}
              {hasProgressToRestore && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    <span className="block sm:inline">
                      Progresso anterior restaurado! Você pode continuar de onde parou.
                    </span>
                  </div>
                </div>
              )}

              {showValidationAlert && Object.keys(formErrors).length > 0 && (
                <div className={`px-4 py-3 rounded-lg relative mb-6 ${isDarkMode 
                  ? 'bg-red-900/20 border border-red-500/30 text-red-400' 
                  : 'bg-red-50 border border-red-200 text-red-700'
                }`} role="alert">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    <div className="flex-1">
                      <span className="font-medium">Atenção!</span>
                      <p className="text-sm mt-1">
                        Por favor, preencha todos os campos obrigatórios para continuar. 
                        {Object.keys(formErrors).length === 1 
                          ? ' 1 campo precisa ser corrigido.'
                          : ` ${Object.keys(formErrors).length} campos precisam ser corrigidos.`}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Steps Modernizado */}
              <div className="relative mb-12">
                {/* Linha de conexão */}
                <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700 mx-6"></div>
                <div 
                  className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 ease-out"
                  style={{ width: `calc(${((currentStep - 1) / (4 - 1)) * 100}% - 48px)` }}
                ></div>
                
                <div className="flex items-center justify-between relative">
                  {[1, 2, 3, 4].map((step) => {
                    const isCompleted = currentStep > step;
                    const isActive = currentStep === step;
                    const stepEmojis = ['👤', '🏥', '🏃‍♀️', '🍽️'];
                    
                    return (
                      <div key={step} className="flex flex-col items-center relative">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-all duration-300 transform ${
                          isCompleted 
                            ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg scale-110' 
                            : isActive 
                              ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg scale-110 animate-pulse' 
                              : isDarkMode 
                                ? 'bg-gray-700 border-2 border-gray-600' 
                                : 'bg-white border-2 border-gray-300 shadow-sm'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-6 w-6 text-white" />
                          ) : (
                            <span className="text-lg">{stepEmojis[step - 1]}</span>
                          )}
                        </div>
                        
                        <div className="text-center">
                          <span className={`text-xs font-medium block mb-1 ${
                            isActive 
                              ? 'text-orange-600 dark:text-orange-400' 
                              : isCompleted 
                                ? 'text-green-600 dark:text-green-400'
                                : isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Etapa {step}
                          </span>
                          <span className={`text-xs text-center leading-tight ${
                            isActive 
                              ? 'text-orange-700 dark:text-orange-300 font-medium' 
                              : isCompleted 
                                ? 'text-green-700 dark:text-green-300'
                                : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                          }`}>
                            {step === 1 && 'Dados\nPessoais'}
                            {step === 2 && 'Saúde'}
                            {step === 3 && 'Estilo de\nVida'}
                            {step === 4 && 'Hábitos\nAlimentares'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Section */}
              <div className={`${isDarkMode ? 'bg-gray-800/30' : 'bg-white/70'} backdrop-blur-sm rounded-2xl shadow-xl border ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200/50'} p-8`}>
                <form onSubmit={handleSubmit} className="space-y-8">
                  {loading && (
                    <div className="flex justify-center items-center mb-6">
                      <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
                      <span className="ml-2 text-orange-600">Processando...</span>
                    </div>
                  )}

                  {/* Manter o conteúdo existente dos steps aqui */}
                  {/* ... existing steps content ... */}

                  {/* Step 1: Dados Pessoais */}
                  {currentStep === 1 && (
                    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-6 shadow-lg border ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}>
                      <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'} mr-4`}>
                          <User className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                          Dados Pessoais
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                          <label htmlFor="data_nascimento" className={themeClasses.label}>
                            Data de Nascimento<span className={themeClasses.requiredMark}>*</span>
                            <span className="text-sm text-gray-500 ml-2">(Ex: 15/05/1985)</span>
                          </label>
                          <input
                            type="text"
                            id="data_nascimento"
                            name="data_nascimento"
                            value={formData.data_nascimento}
                            onChange={(e) => {
                              const value = e.target.value;
                              let formattedValue = value.replace(/\D/g, '');
                              
                              if (formattedValue.length > 0) {
                                if (formattedValue.length > 2 && formattedValue.length <= 4) {
                                  formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
                                } else if (formattedValue.length > 4) {
                                  formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4) + '/' + formattedValue.slice(4, 8);
                                }
                              }
                              
                              setFormData(prev => ({
                                ...prev,
                                data_nascimento: formattedValue
                              }));
                            }}
                            className={getInputClasses('data_nascimento')}
                            data-error={!!formErrors.data_nascimento}
                            placeholder="DD/MM/AAAA"
                            maxLength={10}
                            required
                          />
                          {formErrors.data_nascimento && (
                            <p className={themeClasses.errorText}>{formErrors.data_nascimento}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="estado_civil" className={themeClasses.label}>
                            Estado Civil<span className={themeClasses.requiredMark}>*</span>
                            <span className="text-sm text-gray-500 ml-2">(Selecione sua situação atual)</span>
                          </label>
                          <select
                            id="estado_civil"
                            name="estado_civil"
                            value={formData.estado_civil}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione seu estado civil</option>
                            <option value="solteira">Solteira</option>
                            <option value="casada">Casada</option>
                            <option value="divorciada">Divorciada</option>
                            <option value="viuva">Viúva</option>
                            <option value="uniao_estavel">União Estável</option>
                          </select>
                          {formErrors.estado_civil && (
                            <p className={themeClasses.errorText}>{formErrors.estado_civil}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>Tem filhos?</label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_filhos"
                                checked={formData.tem_filhos === true}
                                onChange={() => setFormData({...formData, tem_filhos: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_filhos"
                                checked={formData.tem_filhos === false}
                                onChange={() => setFormData({...formData, tem_filhos: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_filhos && (
                          <div className="form-group">
                            <label htmlFor="quantidade_filhos" className={themeClasses.label}>
                              Quantos filhos?
                            </label>
                            <input
                              type="number"
                              id="quantidade_filhos"
                              name="quantidade_filhos"
                              value={formData.quantidade_filhos}
                              onChange={handleChange}
                              min="1"
                              className={themeClasses.input}
                              required={formData.tem_filhos}
                              placeholder="Ex: 2"
                            />
                          </div>
                        )}

                        <div className="form-group md:col-span-2">
                          <label htmlFor="objetivo" className={themeClasses.label}>
                            Objetivo Principal<span className={themeClasses.requiredMark}>*</span>
                            <span className="text-sm text-gray-500 ml-2">(Selecione seu principal objetivo com o acompanhamento)</span>
                          </label>
                          <select
                            id="objetivo"
                            name="objetivo"
                            value={formData.objetivo}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione seu objetivo</option>
                            <option value="PERDER_PESO">Perder Peso</option>
                            <option value="GANHAR_MASSA">Ganhar Massa Muscular</option>
                          </select>
                          {formErrors.objetivo && (
                            <p className={themeClasses.errorText}>{formErrors.objetivo}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="peso" className={themeClasses.label}>
                            Peso Atual (kg)<span className={themeClasses.requiredMark}>*</span>
                            <span className="text-sm text-gray-500 ml-2">(Ex: 65.5)</span>
                          </label>
                          <input
                            type="number"
                            id="peso"
                            name="peso"
                            value={formData.peso}
                            onChange={handleChange}
                            step="0.1"
                            min="30"
                            max="200"
                            className={getInputClasses('peso')}
                            data-error={!!formErrors.peso}
                            required
                            placeholder="65.5"
                          />
                          {formErrors.peso && (
                            <p className={themeClasses.errorText}>{formErrors.peso}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="altura" className={themeClasses.label}>
                            Altura (metros)<span className={themeClasses.requiredMark}>*</span>
                            <span className="text-sm text-gray-500 ml-2">(Ex: 1.65 metros - aceita 165cm que será convertido)</span>
                          </label>
                          <input
                            type="text"
                            id="altura"
                            name="altura"
                            value={formData.altura}
                            onChange={handleAlturaChange}
                            className={getInputClasses('altura')}
                            data-error={!!formErrors.altura}
                            required
                            placeholder="1.65 (ou digite 165 que será convertido)"
                            maxLength={6}
                          />
                          {formErrors.altura && (
                            <p className={themeClasses.errorText}>{formErrors.altura}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="peso_habitual" className={themeClasses.label}>
                            Peso Habitual (kg)
                            <span className="text-sm text-gray-500 ml-2">(Ex: 72.0 - seu peso normal/usual)</span>
                          </label>
                          <input
                            type="number"
                            id="peso_habitual"
                            name="peso_habitual"
                            value={formData.peso_habitual}
                            onChange={handleChange}
                            step="0.1"
                            min="30"
                            max="200"
                            className={getInputClasses('peso_habitual')}
                            data-error={!!formErrors.peso_habitual}
                            required
                            placeholder="72.0"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="variacao_peso" className={themeClasses.label}>
                            Variação de Peso nos Últimos 6 Meses
                            <span className="text-sm text-gray-500 ml-2">(Ex: Ganhou 5kg ou Perdeu 3kg)</span>
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="perda_peso_recente" className="text-sm text-gray-600">Perdeu (kg)</label>
                              <input
                                type="number"
                                id="perda_peso_recente"
                                name="perda_peso_recente"
                                value={formData.perda_peso_recente}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                className={themeClasses.input}
                                placeholder="0.0"
                              />
                            </div>
                            <div>
                              <label htmlFor="ganho_peso_recente" className="text-sm text-gray-600">Ganhou (kg)</label>
                              <input
                                type="number"
                                id="ganho_peso_recente"
                                name="ganho_peso_recente"
                                value={formData.ganho_peso_recente}
                                onChange={handleChange}
                                step="0.1"
                                min="0"
                                className={themeClasses.input}
                                placeholder="0.0"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="percepcao_corporal" className={themeClasses.label}>
                            Como você se sente em relação ao seu corpo?
                            <span className="text-sm text-gray-500 ml-2">(Selecione a opção que melhor representa)</span>
                          </label>
                          <select
                            id="percepcao_corporal"
                            name="percepcao_corporal"
                            value={formData.percepcao_corporal}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione como se sente</option>
                            <option value="muito_satisfeita">Muito satisfeita</option>
                            <option value="satisfeita">Satisfeita</option>
                            <option value="neutra">Neutra</option>
                            <option value="insatisfeita">Insatisfeita</option>
                            <option value="muito_insatisfeita">Muito insatisfeita</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Saúde */}
                  {currentStep === 2 && (
                    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-6 shadow-lg border ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}>
                      <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'} mr-4`}>
                          <Heart className={`h-6 w-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`} />
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                          Saúde Feminina
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        {/* Ciclo Menstrual */}
                        <div className="form-group">
                          <label htmlFor="idade_primeira_menstruacao" className={themeClasses.label}>
                            Idade da primeira menstruação
                            <span className="text-sm text-gray-500 ml-2">(Ex: 12 anos)</span>
                          </label>
                          <input
                            type="number"
                            id="idade_primeira_menstruacao"
                            name="idade_primeira_menstruacao"
                            value={formData.idade_primeira_menstruacao}
                            onChange={handleChange}
                            min="8"
                            max="18"
                            className={themeClasses.input}
                            required
                            placeholder="12"
                          />
                          {formErrors.idade_primeira_menstruacao && (
                            <p className={themeClasses.errorText}>{formErrors.idade_primeira_menstruacao}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Seu ciclo menstrual é regular?
                            <span className="text-sm text-gray-500 ml-2">(Ocorre em intervalos previsíveis)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="ciclo_menstrual_regular"
                                checked={formData.ciclo_menstrual_regular === true}
                                onChange={() => setFormData({...formData, ciclo_menstrual_regular: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="ciclo_menstrual_regular"
                                checked={formData.ciclo_menstrual_regular === false}
                                onChange={() => setFormData({...formData, ciclo_menstrual_regular: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="duracao_ciclo_menstrual" className={themeClasses.label}>
                            Duração média do seu ciclo menstrual (em dias)
                            <span className="text-sm text-gray-500 ml-2">(Ex: 5 dias - do primeiro dia de uma menstruação até o primeiro dia da próxima)</span>
                          </label>
                          <input
                            type="number"
                            id="duracao_ciclo_menstrual"
                            name="duracao_ciclo_menstrual"
                            value={formData.duracao_ciclo_menstrual}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                            min="21"
                            max="35"
                            placeholder="5"
                          />
                          {formErrors.duracao_ciclo_menstrual && (
                            <p className={themeClasses.errorText}>{formErrors.duracao_ciclo_menstrual}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Você monitora seu ciclo menstrual?
                            <span className="text-sm text-gray-500 ml-2">(Usa aplicativo ou anota as datas)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="monitora_ciclo"
                                checked={formData.monitora_ciclo === true}
                                onChange={() => setFormData({...formData, monitora_ciclo: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="monitora_ciclo"
                                checked={formData.monitora_ciclo === false}
                                onChange={() => setFormData({...formData, monitora_ciclo: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {/* TPM */}
                        <div className="form-group">
                          <label htmlFor="sintomas_tpm" className={themeClasses.label}>
                            Quais sintomas você costuma ter na TPM? (Separe por vírgula)
                            <span className="text-sm text-gray-500 ml-2">(Ex: inchaço, dor de cabeça, irritabilidade, ansiedade)</span>
                          </label>
                          <textarea
                            id="sintomas_tpm"
                            name="sintomas_tpm"
                            value={formData.sintomas_tpm.join(', ')}
                            onChange={handleArrayChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="inchaço, dor de cabeça, irritabilidade, ansiedade"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="sintoma_tpm_principal" className={themeClasses.label}>
                            Qual o sintoma que mais te incomoda na TPM?
                            <span className="text-sm text-gray-500 ml-2">(Ex: irritabilidade)</span>
                          </label>
                          <input
                            type="text"
                            id="sintoma_tpm_principal"
                            name="sintoma_tpm_principal"
                            value={formData.sintoma_tpm_principal}
                            onChange={handleChange}
                            className={themeClasses.input}
                            required
                            placeholder="irritabilidade"
                          />
                          {formErrors.sintoma_principal_tpm && (
                            <p className={themeClasses.errorText}>{formErrors.sintoma_principal_tpm}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="tpm_afeta_alimentacao" className={themeClasses.label}>
                            Como a TPM afeta sua alimentação?
                            <span className="text-sm text-gray-500 ml-2">(Ex: aumento do apetite, desejo por doces, compulsão alimentar)</span>
                          </label>
                          <textarea
                            id="tpm_afeta_alimentacao"
                            name="tpm_afeta_alimentacao"
                            value={formData.tpm_afeta_alimentacao}
                            onChange={handleChange}
                            className={themeClasses.input}
                            rows={3}
                            required
                            placeholder="Durante a TPM tenho mais vontade de comer doces e aumento do apetite em geral"
                          />
                          {formErrors.tpm_afeta_alimentacao && (
                            <p className={themeClasses.errorText}>{formErrors.tpm_afeta_alimentacao}</p>
                          )}
                        </div>

                        {/* Doenças e Histórico */}
                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Possui alguma doença ginecológica?
                            <span className="text-sm text-gray-500 ml-2">(Ex: endometriose, mioma, SOP)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_doencas_ginecologicas"
                                checked={formData.tem_doencas_ginecologicas === true}
                                onChange={() => setFormData({...formData, tem_doencas_ginecologicas: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_doencas_ginecologicas"
                                checked={formData.tem_doencas_ginecologicas === false}
                                onChange={() => setFormData({...formData, tem_doencas_ginecologicas: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_doencas_ginecologicas && (
                          <div className="form-group">
                            <label htmlFor="doencas_ginecologicas" className={themeClasses.label}>
                              Quais doenças ginecológicas? (Separe por vírgula)
                              <span className="text-sm text-gray-500 ml-2">(Ex: endometriose, mioma)</span>
                            </label>
                            <textarea
                              id="doencas_ginecologicas"
                              name="doencas_ginecologicas"
                              value={formData.doencas_ginecologicas.join(', ')}
                              onChange={handleArrayChange}
                              className={themeClasses.input}
                              rows={3}
                              required={formData.tem_doencas_ginecologicas}
                              placeholder="endometriose, mioma"
                            />
                            {formErrors.doencas_ginecologicas && (
                              <p className={themeClasses.errorText}>{formErrors.doencas_ginecologicas}</p>
                            )}
                          </div>
                        )}

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Faz acompanhamento ginecológico periódico?
                            <span className="text-sm text-gray-500 ml-2">(Consultas regulares com ginecologista)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="faz_acompanhamento_periodico"
                                checked={formData.faz_acompanhamento_periodico === true}
                                onChange={() => setFormData({...formData, faz_acompanhamento_periodico: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="faz_acompanhamento_periodico"
                                checked={formData.faz_acompanhamento_periodico === false}
                                onChange={() => setFormData({...formData, faz_acompanhamento_periodico: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem suspeita de alguma doença?
                            <span className="text-sm text-gray-500 ml-2">(Ainda não diagnosticada)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_suspeita_doenca"
                                checked={formData.tem_suspeita_doenca === true}
                                onChange={() => setFormData({...formData, tem_suspeita_doenca: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_suspeita_doenca"
                                checked={formData.tem_suspeita_doenca === false}
                                onChange={() => setFormData({...formData, tem_suspeita_doenca: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_suspeita_doenca && (
                          <div className="form-group">
                            <label htmlFor="suspeita_doenca" className={themeClasses.label}>
                              Qual doença suspeita?
                              <span className="text-sm text-gray-500 ml-2">(Ex: endometriose)</span>
                            </label>
                            <input
                              type="text"
                              id="suspeita_doenca"
                              name="suspeita_doenca"
                              value={formData.suspeita_doenca}
                              onChange={handleChange}
                              className={themeClasses.input}
                              required={formData.tem_suspeita_doenca}
                              placeholder="endometriose"
                            />
                            {formErrors.suspeita_doenca && (
                              <p className={themeClasses.errorText}>{formErrors.suspeita_doenca}</p>
                            )}
                          </div>
                        )}

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem histórico familiar de doenças ginecológicas?
                            <span className="text-sm text-gray-500 ml-2">(Mãe, irmãs, avós)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_historico_familiar"
                                checked={formData.tem_historico_familiar === true}
                                onChange={() => setFormData({...formData, tem_historico_familiar: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_historico_familiar"
                                checked={formData.tem_historico_familiar === false}
                                onChange={() => setFormData({...formData, tem_historico_familiar: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_historico_familiar && (
                          <div className="form-group">
                            <label htmlFor="historico_familiar_ginecologico" className={themeClasses.label}>
                              Quais doenças? (Separe por vírgula)
                              <span className="text-sm text-gray-500 ml-2">(Ex: câncer de mama na avó, mioma na mãe)</span>
                            </label>
                            <textarea
                              id="historico_familiar_ginecologico"
                              name="historico_familiar_ginecologico"
                              value={formData.historico_familiar_ginecologico.join(', ')}
                              onChange={handleArrayChange}
                              className={themeClasses.input}
                              rows={3}
                              required={formData.tem_historico_familiar}
                              placeholder="câncer de mama na avó, mioma na mãe"
                            />
                            {formErrors.historico_familiar_ginecologico && (
                              <p className={themeClasses.errorText}>{formErrors.historico_familiar_ginecologico}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Estilo de Vida */}
                  {currentStep === 3 && (
                    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-6 shadow-lg border ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}>
                      <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'} mr-4`}>
                          <span className="text-2xl">🏃‍♀️</span>
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                          Estilo de Vida e Histórico Gestacional
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Histórico Gestacional */}
                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Já engravidou?
                            <span className="text-sm text-gray-500 ml-2">(Considere todas as gestações)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="ja_engravidou"
                                checked={formData.ja_engravidou === true}
                                onChange={() => setFormData({...formData, ja_engravidou: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="ja_engravidou"
                                checked={formData.ja_engravidou === false}
                                onChange={() => setFormData({...formData, ja_engravidou: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.ja_engravidou && (
                          <>
                            <div className="form-group">
                              <label htmlFor="quantidade_gestacoes" className={themeClasses.label}>
                                Quantas gestações?
                                <span className="text-sm text-gray-500 ml-2">(Incluindo gestações interrompidas)</span>
                              </label>
                              <input
                                type="number"
                                id="quantidade_gestacoes"
                                name="quantidade_gestacoes"
                                value={formData.quantidade_gestacoes}
                                onChange={handleChange}
                                min="1"
                                className={themeClasses.input}
                                required={formData.ja_engravidou}
                                placeholder="Ex: 2"
                              />
                            </div>

                            <div className="form-group">
                              <label htmlFor="tipos_parto" className={themeClasses.label}>
                                Tipos de parto
                                <span className="text-sm text-gray-500 ml-2">(Ex: 1 normal, 1 cesárea)</span>
                              </label>
                              <textarea
                                id="tipos_parto"
                                name="tipos_parto"
                                value={formData.tipos_parto.join(', ')}
                                onChange={handleArrayChange}
                                className={themeClasses.input}
                                rows={2}
                                placeholder="Ex: 1 parto normal em 2018, 1 cesárea em 2020"
                              />
                            </div>

                            <div className="form-group">
                              <label className={themeClasses.label}>
                                Teve alguma perda gestacional?
                                <span className="text-sm text-gray-500 ml-2">(Aborto espontâneo ou interrupção)</span>
                              </label>
                              <div className="flex space-x-4">
                                <label className={themeClasses.radioLabel}>
                                  <input
                                    type="radio"
                                    name="teve_perda_gestacional"
                                    checked={formData.teve_perda_gestacional === true}
                                    onChange={() => setFormData({...formData, teve_perda_gestacional: true})}
                                    className={themeClasses.radio}
                                  />
                                  <span className="ml-2">Sim</span>
                                </label>
                                <label className={themeClasses.radioLabel}>
                                  <input
                                    type="radio"
                                    name="teve_perda_gestacional"
                                    checked={formData.teve_perda_gestacional === false}
                                    onChange={() => setFormData({...formData, teve_perda_gestacional: false})}
                                    className={themeClasses.radio}
                                  />
                                  <span className="ml-2">Não</span>
                                </label>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Está tentando engravidar?
                            <span className="text-sm text-gray-500 ml-2">(Busca ativa por gravidez)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tentando_engravidar"
                                checked={formData.tentando_engravidar === true}
                                onChange={() => setFormData({...formData, tentando_engravidar: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tentando_engravidar"
                                checked={formData.tentando_engravidar === false}
                                onChange={() => setFormData({...formData, tentando_engravidar: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Usa método contraceptivo?
                            <span className="text-sm text-gray-500 ml-2">(Pílula, DIU, etc)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="usa_contraceptivo"
                                checked={formData.usa_contraceptivo === true}
                                onChange={() => setFormData({...formData, usa_contraceptivo: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="usa_contraceptivo"
                                checked={formData.usa_contraceptivo === false}
                                onChange={() => setFormData({...formData, usa_contraceptivo: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.usa_contraceptivo && (
                          <>
                            <div className="form-group">
                              <label htmlFor="metodo_contraceptivo" className={themeClasses.label}>
                                Qual método contraceptivo?
                                <span className="text-sm text-gray-500 ml-2">(Ex: Pílula Yasmin, DIU Mirena)</span>
                              </label>
                              <input
                                type="text"
                                id="metodo_contraceptivo"
                                name="metodo_contraceptivo"
                                value={formData.metodo_contraceptivo}
                                onChange={handleChange}
                                className={themeClasses.input}
                                required={formData.usa_contraceptivo}
                                placeholder="Ex: Pílula Yasmin"
                              />
                            </div>

                            <div className="form-group">
                              <label htmlFor="tempo_uso_contraceptivo" className={themeClasses.label}>
                                Há quanto tempo usa?
                                <span className="text-sm text-gray-500 ml-2">(Ex: 2 anos e 3 meses)</span>
                              </label>
                              <input
                                type="text"
                                id="tempo_uso_contraceptivo"
                                name="tempo_uso_contraceptivo"
                                value={formData.tempo_uso_contraceptivo}
                                onChange={handleChange}
                                className={themeClasses.input}
                                required={formData.usa_contraceptivo}
                                placeholder="Ex: 2 anos e 3 meses"
                              />
                            </div>
                          </>
                        )}

                        <div className="form-group">
                          <label htmlFor="libido" className={themeClasses.label}>
                            Como está sua libido?
                            <span className="text-sm text-gray-500 ml-2">(Desejo sexual)</span>
                          </label>
                          <select
                            id="libido"
                            name="libido"
                            value={formData.libido}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="normal">Normal</option>
                            <option value="aumentada">Aumentada</option>
                            <option value="diminuida">Diminuída</option>
                            <option value="ausente">Ausente</option>
                          </select>
                        </div>

                        {/* Estilo de Vida */}
                        <div className="form-group">
                          <label htmlFor="nivel_estresse" className={themeClasses.label}>
                            Nível de Estresse (1-10)
                            <span className="text-sm text-gray-500 ml-2">(1: muito baixo, 10: muito alto)</span>
                          </label>
                          <input
                            type="number"
                            id="nivel_estresse"
                            name="nivel_estresse"
                            value={formData.nivel_estresse}
                            onChange={handleChange}
                            min="1"
                            max="10"
                            className={themeClasses.input}
                            placeholder="Ex: 7"
                          />
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Fumante?
                            <span className="text-sm text-gray-500 ml-2">(Inclui cigarro eletrônico)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="fumante"
                                checked={formData.fumante === true}
                                onChange={() => setFormData({...formData, fumante: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="fumante"
                                checked={formData.fumante === false}
                                onChange={() => setFormData({...formData, fumante: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="consumo_alcool" className={themeClasses.label}>
                            Consumo de bebidas alcoólicas
                            <span className="text-sm text-gray-500 ml-2">(Frequência semanal)</span>
                          </label>
                          <select
                            id="consumo_alcool"
                            name="consumo_alcool"
                            value={formData.consumo_alcool}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="nunca">Nunca</option>
                            <option value="raramente">Raramente (1x por mês ou menos)</option>
                            <option value="ocasionalmente">Ocasionalmente (1-2x por semana)</option>
                            <option value="frequentemente">Frequentemente (3-4x por semana)</option>
                            <option value="diariamente">Diariamente</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="horas_sono" className={themeClasses.label}>
                            Quantas horas dorme por noite?
                            <span className="text-sm text-gray-500 ml-2">(Em média)</span>
                          </label>
                          <input
                            type="number"
                            id="horas_sono"
                            name="horas_sono"
                            value={formData.horas_sono}
                            onChange={handleChange}
                            min="1"
                            max="24"
                            className={themeClasses.input}
                            required
                            placeholder="Ex: 7"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="qualidade_sono" className={themeClasses.label}>
                            Como avalia a qualidade do seu sono?
                            <span className="text-sm text-gray-500 ml-2">(Considere o último mês)</span>
                          </label>
                          <select
                            id="qualidade_sono"
                            name="qualidade_sono"
                            value={formData.qualidade_sono}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="otima">Ótima - Acordo disposta</option>
                            <option value="boa">Boa - Acordo relativamente bem</option>
                            <option value="regular">Regular - Às vezes acordo cansada</option>
                            <option value="ruim">Ruim - Frequentemente acordo cansada</option>
                            <option value="pessima">Péssima - Sempre acordo cansada</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Pratica exercícios físicos?
                            <span className="text-sm text-gray-500 ml-2">(Atividade física regular)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="pratica_exercicios"
                                checked={formData.pratica_exercicios === true}
                                onChange={() => setFormData({...formData, pratica_exercicios: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="pratica_exercicios"
                                checked={formData.pratica_exercicios === false}
                                onChange={() => setFormData({...formData, pratica_exercicios: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.pratica_exercicios && (
                          <>
                            <div className="form-group">
                              <label htmlFor="frequencia_exercicios" className={themeClasses.label}>
                                Frequência de exercícios
                                <span className="text-sm text-gray-500 ml-2">(Vezes por semana)</span>
                              </label>
                              <select
                                id="frequencia_exercicios"
                                name="frequencia_exercicios"
                                value={formData.frequencia_exercicios}
                                onChange={handleChange}
                                className={themeClasses.select}
                                required={formData.pratica_exercicios}
                              >
                                <option value="">Selecione</option>
                                <option value="diariamente">Diariamente</option>
                                <option value="3_4_vezes">3-4 vezes por semana</option>
                                <option value="1_2_vezes">1-2 vezes por semana</option>
                                <option value="ocasionalmente">Ocasionalmente</option>
                              </select>
                            </div>

                            <div className="form-group">
                              <label htmlFor="tipo_exercicios" className={themeClasses.label}>
                                Quais exercícios pratica?
                                <span className="text-sm text-gray-500 ml-2">(Ex: musculação, pilates)</span>
                              </label>
                              <textarea
                                id="tipo_exercicios"
                                name="tipo_exercicios"
                                value={formData.tipo_exercicios}
                                onChange={handleChange}
                                className={themeClasses.input}
                                rows={2}
                                required={formData.pratica_exercicios}
                                placeholder="Ex: Musculação 3x/semana, Pilates 2x/semana"
                              />
                            </div>

                            <div className="form-group">
                              <label htmlFor="detalhes_exercicios" className={themeClasses.label}>
                                Detalhes dos exercícios
                                <span className="text-sm text-gray-500 ml-2">(Duração, intensidade, etc)</span>
                              </label>
                              <textarea
                                id="detalhes_exercicios"
                                name="detalhes_exercicios"
                                value={formData.detalhes_exercicios}
                                onChange={handleChange}
                                className={themeClasses.input}
                                rows={3}
                                required={formData.pratica_exercicios}
                                placeholder="Ex: Musculação 1h por sessão, intensidade moderada. Pilates 50min por sessão"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Hábitos Alimentares */}
                  {currentStep === 4 && (
                    <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white/80'} backdrop-blur-sm rounded-xl p-6 shadow-lg border ${isDarkMode ? 'border-gray-700/50' : 'border-white/50'}`}>
                      <div className="flex items-center mb-6">
                        <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-pink-500/20' : 'bg-pink-100'} mr-4`}>
                          <span className="text-2xl">🍽️</span>
                        </div>
                        <h3 className={`text-2xl font-bold ${themeClasses.text}`}>
                          Hábitos Alimentares e Intestinais
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-6">
                        {/* Hábitos Intestinais */}
                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Seu intestino é regular?
                            <span className="text-sm text-gray-500 ml-2">(Evacuação em horários semelhantes)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="intestino_regular"
                                checked={formData.intestino_regular === true}
                                onChange={() => setFormData({...formData, intestino_regular: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="intestino_regular"
                                checked={formData.intestino_regular === false}
                                onChange={() => setFormData({...formData, intestino_regular: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="frequencia_evacuacao" className={themeClasses.label}>
                            Com que frequência evacua?
                            <span className="text-sm text-gray-500 ml-2">(Ex: 1 vez por dia, pela manhã)</span>
                          </label>
                          <select
                            id="frequencia_evacuacao"
                            name="frequencia_evacuacao"
                            value={formData.frequencia_evacuacao}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="mais_1_dia">Mais de 1 vez por dia</option>
                            <option value="1_dia">1 vez por dia</option>
                            <option value="2_dias">A cada 2 dias</option>
                            <option value="3_dias">A cada 3 dias</option>
                            <option value="mais_3_dias">Mais de 3 dias</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="consistencia_fezes" className={themeClasses.label}>
                            Consistência das fezes
                            <span className="text-sm text-gray-500 ml-2">(Considere a maioria das vezes)</span>
                          </label>
                          <select
                            id="consistencia_fezes"
                            name="consistencia_fezes"
                            value={formData.consistencia_fezes}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="ressecadas">Ressecadas (difícil passagem)</option>
                            <option value="normais">Normais (bem formadas)</option>
                            <option value="amolecidas">Amolecidas (pastosas)</option>
                            <option value="liquidas">Líquidas (diarreia)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem constipação?
                            <span className="text-sm text-gray-500 ml-2">(Dificuldade para evacuar, fezes ressecadas)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_constipacao"
                                checked={formData.tem_constipacao === true}
                                onChange={() => setFormData({...formData, tem_constipacao: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_constipacao"
                                checked={formData.tem_constipacao === false}
                                onChange={() => setFormData({...formData, tem_constipacao: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem diarreia?
                            <span className="text-sm text-gray-500 ml-2">(Fezes líquidas, mais de 3 vezes ao dia)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_diarreia"
                                checked={formData.tem_diarreia === true}
                                onChange={() => setFormData({...formData, tem_diarreia: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_diarreia"
                                checked={formData.tem_diarreia === false}
                                onChange={() => setFormData({...formData, tem_diarreia: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem dificuldade para evacuar?
                            <span className="text-sm text-gray-500 ml-2">(Esforço excessivo, demora muito tempo)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="dificuldade_evacuar"
                                checked={formData.dificuldade_evacuar === true}
                                onChange={() => setFormData({...formData, dificuldade_evacuar: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="dificuldade_evacuar"
                                checked={formData.dificuldade_evacuar === false}
                                onChange={() => setFormData({...formData, dificuldade_evacuar: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem sangramento ao evacuar?
                            <span className="text-sm text-gray-500 ml-2">(Sangue nas fezes ou no papel higiênico)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="sangramento_evacuar"
                                checked={formData.sangramento_evacuar === true}
                                onChange={() => setFormData({...formData, sangramento_evacuar: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="sangramento_evacuar"
                                checked={formData.sangramento_evacuar === false}
                                onChange={() => setFormData({...formData, sangramento_evacuar: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="observacoes_intestinais" className={themeClasses.label}>
                            Observações sobre hábitos intestinais
                            <span className="text-sm text-gray-500 ml-2">(Ex: gases, dor, inchaço)</span>
                          </label>
                          <textarea
                            id="observacoes_intestinais"
                            name="observacoes_intestinais"
                            value={formData.observacoes_intestinais}
                            onChange={handleChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Ex: Sinto gases após consumir leite, tenho dor abdominal antes de evacuar"
                          />
                        </div>

                        {/* Hábitos Alimentares */}
                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Tem intolerância alimentar?
                            <span className="text-sm text-gray-500 ml-2">(Diagnóstico médico ou suspeita)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_intolerancia"
                                checked={formData.tem_intolerancia === true}
                                onChange={() => setFormData({...formData, tem_intolerancia: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="tem_intolerancia"
                                checked={formData.tem_intolerancia === false}
                                onChange={() => setFormData({...formData, tem_intolerancia: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        {formData.tem_intolerancia && (
                          <div className="form-group">
                            <label htmlFor="intolerancia_alimentar" className={themeClasses.label}>
                              Quais intolerâncias?
                              <span className="text-sm text-gray-500 ml-2">(Ex: lactose, glúten, frutose)</span>
                            </label>
                            <textarea
                              id="intolerancia_alimentar"
                              name="intolerancia_alimentar"
                              value={formData.intolerancia_alimentar.join(', ')}
                              onChange={handleArrayChange}
                              className={themeClasses.input}
                              rows={2}
                              required={formData.tem_intolerancia}
                              placeholder="Ex: Intolerância à lactose (diagnosticada), suspeita de intolerância ao glúten"
                            />
                          </div>
                        )}

                        <div className="form-group">
                          <label htmlFor="alimentos_essenciais" className={themeClasses.label}>
                            Alimentos que não podem faltar na sua alimentação
                            <span className="text-sm text-gray-500 ml-2">(Alimentos que você consome diariamente)</span>
                          </label>
                          <textarea
                            id="alimentos_essenciais"
                            name="alimentos_essenciais"
                            value={formData.alimentos_essenciais.join(', ')}
                            onChange={handleArrayChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Ex: arroz integral, frango, ovos, banana, aveia, café"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="preferencia_sabor" className={themeClasses.label}>
                            Qual sabor você mais gosta?
                            <span className="text-sm text-gray-500 ml-2">(Sua preferência principal)</span>
                          </label>
                          <select
                            id="preferencia_sabor"
                            name="preferencia_sabor"
                            value={formData.preferencia_sabor}
                            onChange={handleChange}
                            className={themeClasses.select}
                          >
                            <option value="">Selecione</option>
                            <option value="doce">Doce (chocolates, bolos, sobremesas)</option>
                            <option value="salgado">Salgado (salgadinhos, frituras)</option>
                            <option value="azedo">Azedo (limão, vinagre)</option>
                            <option value="amargo">Amargo (café puro, chocolate amargo)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="aversao_alimentar" className={themeClasses.label}>
                            Alimentos que você não gosta ou não come
                            <span className="text-sm text-gray-500 ml-2">(Aversões e restrições)</span>
                          </label>
                          <textarea
                            id="aversao_alimentar"
                            name="aversao_alimentar"
                            value={formData.aversao_alimentar.join(', ')}
                            onChange={handleArrayChange}
                            className={themeClasses.input}
                            rows={3}
                            placeholder="Ex: jiló, fígado, berinjela, peixe cru"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="horario_mais_fome" className={themeClasses.label}>
                            Em qual horário você sente mais fome?
                            <span className="text-sm text-gray-500 ml-2">(Horário de maior apetite)</span>
                          </label>
                          <input
                            type="text"
                            id="horario_mais_fome"
                            name="horario_mais_fome"
                            value={formData.horario_mais_fome}
                            onChange={handleChange}
                            className={themeClasses.input}
                            placeholder="Ex: Entre 15h e 16h da tarde, ou antes do almoço"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="numero_refeicoes" className={themeClasses.label}>
                            Quantas refeições faz por dia?
                            <span className="text-sm text-gray-500 ml-2">(Incluindo lanches)</span>
                          </label>
                          <input
                            type="number"
                            id="numero_refeicoes"
                            name="numero_refeicoes"
                            value={formData.numero_refeicoes}
                            onChange={handleChange}
                            min="1"
                            max="10"
                            className={themeClasses.input}
                            required
                            placeholder="Ex: 6 (café, lanche, almoço, lanche, jantar, ceia)"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="local_refeicoes" className={themeClasses.label}>
                            Onde costuma fazer suas refeições?
                            <span className="text-sm text-gray-500 ml-2">(Local mais frequente)</span>
                          </label>
                          <input
                            type="text"
                            id="local_refeicoes"
                            name="local_refeicoes"
                            value={formData.local_refeicoes}
                            onChange={handleChange}
                            className={themeClasses.input}
                            placeholder="Ex: Almoço no trabalho, demais refeições em casa"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="consumo_agua_litros" className={themeClasses.label}>
                            Quantos litros de água consome por dia?
                            <span className="text-sm text-gray-500 ml-2">(Apenas água pura)</span>
                          </label>
                          <input
                            type="number"
                            id="consumo_agua_litros"
                            name="consumo_agua_litros"
                            value={formData.consumo_agua_litros}
                            onChange={handleChange}
                            step="0.1"
                            min="0"
                            max="10"
                            className={themeClasses.input}
                            required
                            placeholder="Ex: 2.5 (não incluir chás, café ou outras bebidas)"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="velocidade_comer" className={themeClasses.label}>
                            Como você considera sua velocidade ao comer?
                            <span className="text-sm text-gray-500 ml-2">(Tempo médio por refeição)</span>
                          </label>
                          <select
                            id="velocidade_comer"
                            name="velocidade_comer"
                            value={formData.velocidade_comer}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="muito_rapido">Muito rápido (menos de 10 minutos)</option>
                            <option value="rapido">Rápido (10-15 minutos)</option>
                            <option value="normal">Normal (15-20 minutos)</option>
                            <option value="devagar">Devagar (20-30 minutos)</option>
                            <option value="muito_devagar">Muito devagar (mais de 30 minutos)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="mastigacao" className={themeClasses.label}>
                            Como você considera sua mastigação?
                            <span className="text-sm text-gray-500 ml-2">(Número de mastigadas por garfada)</span>
                          </label>
                          <select
                            id="mastigacao"
                            name="mastigacao"
                            value={formData.mastigacao}
                            onChange={handleChange}
                            className={themeClasses.select}
                            required
                          >
                            <option value="">Selecione</option>
                            <option value="muito_boa">Muito boa (mais de 20 mastigadas)</option>
                            <option value="boa">Boa (15-20 mastigadas)</option>
                            <option value="regular">Regular (10-15 mastigadas)</option>
                            <option value="ruim">Ruim (5-10 mastigadas)</option>
                            <option value="muito_ruim">Muito ruim (menos de 5 mastigadas)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className={themeClasses.label}>
                            Costuma beliscar entre as refeições?
                            <span className="text-sm text-gray-500 ml-2">(Comer fora dos horários principais)</span>
                          </label>
                          <div className="flex space-x-4">
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="belisca_entre_refeicoes"
                                checked={formData.belisca_entre_refeicoes === true}
                                onChange={() => setFormData({...formData, belisca_entre_refeicoes: true})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className={themeClasses.radioLabel}>
                              <input
                                type="radio"
                                name="belisca_entre_refeicoes"
                                checked={formData.belisca_entre_refeicoes === false}
                                onChange={() => setFormData({...formData, belisca_entre_refeicoes: false})}
                                className={themeClasses.radio}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="rotina_diaria" className={themeClasses.label}>
                            Descreva sua rotina diária
                            <span className="text-sm text-gray-500 ml-2">(Horários e atividades principais)</span>
                          </label>
                          <textarea
                            id="rotina_diaria"
                            name="rotina_diaria"
                            value={formData.rotina_diaria}
                            onChange={handleChange}
                            className={themeClasses.input}
                            rows={4}
                            placeholder="Ex: 6h - acordo e tomo café
8h às 17h - trabalho
18h - academia
19h30 - jantar
22h30 - dormir"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="rotina_alimentar" className={themeClasses.label}>
                            Descreva sua rotina alimentar
                            <span className="text-sm text-gray-500 ml-2">(Refeições e horários habituais)</span>
                          </label>
                          <textarea
                            id="rotina_alimentar"
                            name="rotina_alimentar"
                            value={formData.rotina_alimentar}
                            onChange={handleChange}
                            className={themeClasses.input}
                            rows={4}
                            placeholder="Ex: 7h - café da manhã (pão integral, ovo, café)
10h - lanche (fruta e iogurte)
13h - almoço (arroz, feijão, frango, salada)
16h - lanche (barra de cereal)
20h - jantar (similar ao almoço)"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="diario_alimentar" className={themeClasses.label}>
                            Descreva o que comeu nas últimas 24 horas
                            <span className="text-sm text-gray-500 ml-2">(Inclua TODAS as refeições e bebidas)</span>
                          </label>
                          <textarea
                            id="diario_alimentar"
                            name="diario_alimentar"
                            value={formData.diario_alimentar}
                            onChange={handleChange}
                            className={themeClasses.input}
                            rows={4}
                            placeholder="Ex: Café da manhã: 2 fatias de pão integral, 1 ovo mexido, café com leite
Lanche: 1 maçã e 1 iogurte natural
Almoço: 4 colheres de arroz, 2 de feijão, 1 filé de frango grelhado, salada de alface
Lanche: 1 barra de cereal e 1 café
Jantar: 1 prato de sopa de legumes com frango
Bebidas: 2L de água, 3 cafés"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons Modernizados */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mt-12 pt-6 border-t border-gray-200/20">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={prevStep}
                        className={`group flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                          isDarkMode 
                            ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                        Voltar
                      </button>
                    )}
                    {currentStep < 4 && (
                      <button
                        type="button"
                        onClick={nextStep}
                        className={`group flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:shadow-xl`}
                      >
                        Próximo
                        <ArrowLeft className="h-4 w-4 ml-2 rotate-180 transition-transform group-hover:translate-x-1" />
                      </button>
                    )}
                    {currentStep === 4 && (
                      <>
                        <button
                          type="button"
                          onClick={confirmStep4}
                          className={`group flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                            isDarkMode 
                              ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
                          Revisar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className={`group flex items-center justify-center w-full sm:w-auto px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {loading ? (
                            <span className="flex items-center">
                              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                              Enviando...
                            </span>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Enviar Formulário
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
        )}

        {/* Modal de confirmação modernizado - igual ao masculino */}
        {showConfirmationMessage && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
            <div className={`${isDarkMode ? 'bg-gray-800/90' : 'bg-white/90'} backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4 border ${isDarkMode ? 'border-orange-500/30' : 'border-orange-200'} shadow-2xl animate-scaleIn`}>
              <div className="text-center mb-6">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'} mb-2`}>
                  Confirmar Envio
                </h3>
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} leading-relaxed`}>
                  Tem certeza que deseja enviar o formulário? Verifique se todas as informações estão corretas.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmationMessage(false)}
                  className={`flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    isDarkMode 
                      ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 border border-gray-600' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Consentimento */}
        <ConsentModal
          isOpen={showConsentModal}
          termType="AVALIACAO_FISICA_NUTRICIONAL"
          onAccept={handleConsentAccept}
          onReject={handleConsentReject}
          onClose={handleConsentClose}
        />
        </div>
    </Layout>
  );
}
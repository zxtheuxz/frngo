import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ClipboardCheck, AlertCircle, Upload, ArrowLeft, CheckCircle, Activity, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import { Layout } from '../components/Layout';
import { ConsentModal } from '../components/ConsentModal';
import { TermsService } from '../lib/termsService';

export function AvaliacaoFisica() {
  console.log('Componente AvaliacaoFisica renderizado');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const currentTheme = getThemeClass(isDarkMode, 'cardBg');
  const [formData, setFormData] = useState({
    sexo: '',
    idade: '',
    objetivo: '',
    tempo_inativo: '',
    experiencia_musculacao: '',
    disponibilidade_semanal: '',
    nivel_experiencia: '',
    sente_dores: '',
    tem_laudo_medico: '',
    laudo_medico_url: '',
    usa_medicamentos: '',
    doenca_pre_existente: '',
    doenca_impossibilita: '',
    tem_lesao: ''
  });
  const [laudoFile, setLaudoFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Dividir o formulário em etapas lógicas
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmedStep3, setConfirmedStep3] = useState(false);
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  
  // Estados para o modal de consentimento
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentRejected, setConsentRejected] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(true);

  // Usando o getThemeClass para obter as classes do tema
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `${getThemeClass(isDarkMode, 'cardBg')} border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: getThemeClass(isDarkMode, 'input'),
    select: getThemeClass(isDarkMode, 'select'),
    label: getThemeClass(isDarkMode, 'label'),
    helperText: getThemeClass(isDarkMode, 'helperText'),
    radio: isDarkMode ? 'text-orange-400' : 'text-orange-600',
    radioLabel: isDarkMode ? 'text-gray-300' : 'text-gray-700',
    errorText: isDarkMode ? 'text-red-400' : 'text-red-600',
    formSection: `${getThemeClass(isDarkMode, 'cardBg')} p-8 rounded-xl border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    stepIndicatorCompleted: 'bg-green-500 shadow-lg',
    stepIndicatorActive: isDarkMode ? 'bg-orange-500 shadow-lg' : 'bg-orange-600 shadow-lg',
    stepIndicatorInactive: isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
  };

  // Adicione esta função para validar cada etapa
  const validateStep = (step: number): boolean => {
    console.log(`Validando etapa ${step}...`);
    console.log('Dados do formulário:', formData);
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      // Validação da etapa 1 - Informações Básicas
      if (!formData.sexo) errors.sexo = "Por favor, selecione o sexo";
      if (!formData.idade) errors.idade = "Por favor, selecione a idade";
      if (!formData.objetivo) errors.objetivo = "Por favor, selecione o objetivo";
      
      console.log('Erros encontrados na etapa 1:', errors);
    } 
    else if (step === 2) {
      // Validação da etapa 2 - Experiência
      if (!formData.tempo_inativo) errors.tempo_inativo = "Por favor, selecione o tempo sem atividade física";
      if (!formData.experiencia_musculacao) errors.experiencia_musculacao = "Por favor, selecione a experiência com musculação";
      if (!formData.disponibilidade_semanal) errors.disponibilidade_semanal = "Por favor, selecione a disponibilidade semanal";
      if (!formData.nivel_experiencia) errors.nivel_experiencia = "Por favor, selecione o nível de experiência";
    }
    else if (step === 3) {
      // Validação da etapa 3 - Saúde
      if (!formData.sente_dores) 
        errors.sente_dores = "Por favor, responda esta pergunta";
      
      if (formData.sente_dores === 'sim') {
        if (!formData.tem_laudo_medico)
          errors.tem_laudo_medico = "Por favor, responda esta pergunta";
        
        if (formData.tem_laudo_medico === 'sim' && !laudoFile) 
          errors.laudo = "É necessário enviar um laudo médico";
      }
      
      if (!formData.usa_medicamentos) 
        errors.usa_medicamentos = "Por favor, responda esta pergunta";
      if (!formData.doenca_pre_existente) 
        errors.doenca_pre_existente = "Por favor, selecione uma opção";
      if (formData.doenca_pre_existente === 'sim' && !formData.doenca_impossibilita) 
        errors.doenca_impossibilita = "Por favor, responda esta pergunta";
      if (!formData.tem_lesao) 
        errors.tem_lesao = "Por favor, responda esta pergunta";
    }
    
    console.log(`Erros na etapa ${step}:`, errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Função para avançar para a próxima etapa
  const handleNextStep = () => {
    console.log(`Tentando avançar para a etapa ${currentStep + 1}`);
    console.log('Estado atual do formulário:', formData);
    
    // Validar a etapa atual antes de avançar
    if (validateStep(currentStep)) {
      console.log(`Etapa ${currentStep} validada com sucesso, avançando...`);
      setCurrentStep(currentStep + 1);
    } else {
      console.log(`Etapa ${currentStep} contém erros, não pode avançar.`);
      // Exibir mensagem de erro ou destacar campos com erro
    }
  };

  // Função para voltar para a etapa anterior
  const handlePrevStep = () => {
    console.log(`Voltando para a etapa ${currentStep - 1}`);
    setCurrentStep(currentStep - 1);
  };

  // Modifique a função validateForm para usar a validação de etapas
  const validateForm = () => {
    console.log('Validando formulário...');
    // Validar todas as etapas antes de enviar
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);
    
    console.log('Validação das etapas:', { step1Valid, step2Valid, step3Valid });
    
    if (!step1Valid) {
      setCurrentStep(1);
      setErro('Por favor, complete a etapa 1 antes de enviar.');
      return false;
    }
    
    if (!step2Valid) {
      setCurrentStep(2);
      setErro('Por favor, complete a etapa 2 antes de enviar.');
      return false;
    }
    
    if (!step3Valid) {
      setCurrentStep(3);
      setErro('Por favor, complete a etapa 3 antes de enviar.');
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // Adicionar CSS personalizado para animação dos frangos
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float {
        0% { transform: translateX(-100px); opacity: 0; }
        10% { opacity: ${isDarkMode ? '0.05' : '0.1'}; }
        90% { opacity: ${isDarkMode ? '0.05' : '0.1'}; }
        100% { transform: translateX(calc(100vw + 100px)); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup: remover o style quando o componente for desmontado
    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]);

  // UseEffect para verificar consentimento
  useEffect(() => {
    const checkConsent = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login');
          return;
        }

        const consent = await TermsService.hasUserConsented(user.id, 'AVALIACAO_FISICA_NUTRICIONAL');
        
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
        setErro('Erro ao carregar página. Tente novamente.');
      } finally {
        setCheckingConsent(false);
      }
    };

    checkConsent();
  }, [navigate]);

  useEffect(() => {
    // Remover qualquer rascunho existente ao carregar o componente
    localStorage.removeItem('avaliacao_fisica_draft');
    
    // Aplicar background consistente com o dashboard
    if (isDarkMode) {
      document.documentElement.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.documentElement.style.backgroundColor = '#0f172a';
      document.body.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)';
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234f46e5' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")";
    } else {
      document.documentElement.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
      document.documentElement.style.backgroundColor = '#f5f7ff';
      document.body.style.background = 'linear-gradient(135deg, #f5f7ff 0%, #e0e6ff 100%)';
      document.body.style.backgroundColor = '#f5f7ff';
      document.body.style.backgroundImage = "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%239C92AC' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E\")";
    }
    
    console.log('AvaliacaoFisica: Componente montado');
  }, [isDarkMode]);

  // Modificar a função clearDraft para garantir que todos os campos fiquem vazios
  const clearDraft = () => {
    localStorage.removeItem('avaliacao_fisica_draft');
    // Reset do formulário para valores iniciais
    setFormData({
      sexo: '',
      idade: '',
      objetivo: '',
      tempo_inativo: '',
      experiencia_musculacao: '',
      disponibilidade_semanal: '',
      nivel_experiencia: '',
      sente_dores: '',
      tem_laudo_medico: '',
      laudo_medico_url: '',
      usa_medicamentos: '',
      doenca_pre_existente: '',
      doenca_impossibilita: '',
      tem_lesao: ''
    });
    setLaudoFile(null);
    setFormErrors({});
    setCurrentStep(1);
    setConfirmedStep3(false);
    setShowConfirmationMessage(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErro('Por favor, envie apenas arquivos PDF, PNG ou JPEG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setErro('O arquivo deve ter no máximo 5MB');
        return;
      }
      setLaudoFile(file);
      setErro('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setErro('Por favor, envie apenas arquivos PDF, PNG ou JPEG');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErro('O arquivo deve ter no máximo 5MB');
        return;
      }
      setLaudoFile(file);
      setErro('');
    }
  };

  const uploadLaudo = async (userId: string): Promise<string | null> => {
    if (!laudoFile) return null;

    // Sanitizar o nome do arquivo removendo caracteres especiais
    const sanitizedFileName = laudoFile.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();
      
    const fileName = `${userId}/${Date.now()}-${sanitizedFileName}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('laudos')
        .upload(fileName, laudoFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw new Error(`Falha no upload: ${error.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('laudos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erro detalhado no upload:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Formulário enviado');
    
    // Verificação adicional para evitar envio automático
    if (!e.isTrusted) {
      console.warn('Tentativa de envio automático detectada e bloqueada');
      return;
    }
    
    // Verificação adicional para garantir que o usuário interagiu com o formulário
    const userInteracted = sessionStorage.getItem('user_interacted_with_form');
    if (!userInteracted) {
      setErro('Por favor, revise e confirme suas respostas antes de enviar o formulário.');
      sessionStorage.setItem('user_interacted_with_form', 'true');
      return;
    }
    
    setLoading(true);
    setErro('');
    
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log('Enviando dados para o servidor...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let laudoUrl = null;
      if (formData.sente_dores === 'sim' && laudoFile) {
        laudoUrl = await uploadLaudo(user.id);
      }

      // Converter strings para booleanos antes de enviar para o banco de dados
      const formDataFormatado = {
        ...formData,
        sente_dores: formData.sente_dores === 'sim',
        tem_laudo_medico: formData.tem_laudo_medico === 'sim',
        usa_medicamentos: formData.usa_medicamentos === 'sim',
        doenca_impossibilita: formData.doenca_impossibilita === 'sim',
        tem_lesao: formData.tem_lesao === 'sim'
      };

      console.log('Dados formatados para envio:', formDataFormatado);

      const { error } = await supabase
        .from('avaliacao_fisica')
        .insert([
          {
            user_id: user.id,
            ...formDataFormatado,
            laudo_medico_url: laudoUrl
          }
        ]);

      if (error) throw error;

      // Se há laudo médico, criar entrada na tabela analises_medicamentos para aprovação
      if (formData.sente_dores === 'sim' && formData.tem_laudo_medico === 'sim' && laudoUrl) {
        const { error: analiseError } = await supabase
          .from('analises_medicamentos')
          .insert([
            {
              user_id: user.id,
              tipo_documento: 'LAUDO_MEDICO',
              documento_url: laudoUrl,
              status: 'PENDENTE',
              observacoes: `Laudo médico enviado via formulário de avaliação física. Usuário relatou sentir dores durante atividades físicas.`
            }
          ]);

        if (analiseError) {
          console.error('Erro ao criar análise do laudo:', analiseError);
          // Não falhar o processo principal, apenas logar o erro
        }

        // Atualizar status do laudo no perfil
        const { error: perfilError } = await supabase
          .from('perfis')
          .update({ laudo_aprovado: 'pendente' })
          .eq('user_id', user.id);

        if (perfilError) {
          console.error('Erro ao atualizar perfil:', perfilError);
          // Não falhar o processo principal, apenas logar o erro
        }
      }
      
      console.log('Formulário enviado com sucesso!');
      // Definir formSubmitted como true para mostrar a mensagem de sucesso
      setFormSubmitted(true);
      
      // Não navegar para o dashboard, mostrar a mensagem de sucesso
      // navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        setErro(error.message);
      } else {
        setErro('Erro ao salvar avaliação física');
      }
    } finally {
      setLoading(false);
    }
  };

  // Adicionar um efeito para detectar interação do usuário
  useEffect(() => {
    const handleUserInteraction = () => {
      sessionStorage.setItem('user_interacted_with_form', 'true');
    };
    
    // Adicionar listeners para detectar interação do usuário
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('change', handleUserInteraction);
    
    return () => {
      // Remover listeners quando o componente for desmontado
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('change', handleUserInteraction);
    };
  }, []);

  // Adicionar esta função para confirmar a etapa 3
  const confirmStep3 = () => {
    setConfirmedStep3(true);
    setShowConfirmationMessage(true);
    sessionStorage.setItem('user_interacted_with_form', 'true');
    
    // Esconder a mensagem após 5 segundos
    setTimeout(() => {
      setShowConfirmationMessage(false);
    }, 5000);
  };

  // Resetar a confirmação quando mudar de etapa
  useEffect(() => {
    if (currentStep !== 3) {
      setConfirmedStep3(false);
    }
  }, [currentStep]);

  // Funções para lidar com o consentimento
  const handleConsentAccept = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErro('Usuário não autenticado');
        return;
      }

      const success = await TermsService.recordConsent(user.id, 'AVALIACAO_FISICA_NUTRICIONAL', true);
      if (success) {
        setConsentChecked(true);
        setShowConsentModal(false);
      } else {
        setErro('Erro ao registrar consentimento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao aceitar consentimento:', error);
      setErro('Erro ao registrar consentimento. Tente novamente.');
    }
  };

  const handleConsentReject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErro('Usuário não autenticado');
        return;
      }

      const success = await TermsService.recordConsent(user.id, 'AVALIACAO_FISICA_NUTRICIONAL', false);
      if (success) {
        setConsentRejected(true);
        setShowConsentModal(false);
        // Redirecionar para o dashboard após rejeitar
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setErro('Erro ao registrar consentimento. Tente novamente.');
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

  return (
    <Layout>
      <div className={`min-h-screen ${themeClasses.background} relative overflow-hidden`}>
        {/* Background decorativo com frangos animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Círculos decorativos originais */}
          <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-orange-500/5' : 'bg-orange-100/30'}`}></div>
          <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full ${isDarkMode ? 'bg-purple-500/5' : 'bg-purple-100/30'}`}></div>
          
          {/* Frangos animados bem sutis - Extermina Frango Theme */}
          <div className="absolute inset-0">
            {/* Frango 1 - movimento horizontal suave */}
            <div className={`absolute top-20 -left-12 ${isDarkMode ? 'opacity-5' : 'opacity-10'} animate-pulse`} 
                 style={{
                   animation: 'float 25s linear infinite',
                   transform: 'translateX(-100px)'
                 }}>
              <span className="text-4xl filter blur-sm">🐔</span>
            </div>
            
            {/* Frango 2 - movimento mais lento */}
            <div className={`absolute top-1/3 -left-16 ${isDarkMode ? 'opacity-5' : 'opacity-10'} animate-bounce`}
                 style={{
                   animation: 'float 35s linear infinite 8s',
                   animationDelay: '5s'
                 }}>
              <span className="text-3xl filter blur-sm">🐓</span>
            </div>
            
            {/* Frango 3 - posição diferente */}
            <div className={`absolute bottom-40 -left-10 ${isDarkMode ? 'opacity-5' : 'opacity-10'}`}
                 style={{
                   animation: 'float 30s linear infinite 10s'
                 }}>
              <span className="text-4xl filter blur-sm">🐔</span>
            </div>
            
            {/* Frango 4 - bem sutil no canto */}
            <div className={`absolute top-1/2 -left-20 ${isDarkMode ? 'opacity-3' : 'opacity-8'}`}
                 style={{
                   animation: 'float 45s linear infinite 20s'
                 }}>
              <span className="text-2xl filter blur-sm">🐓</span>
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
                Você optou por não aceitar os termos de consentimento. Para preencher a avaliação física, 
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
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-6">
          {/* Header melhorado */}
          <div className="mb-8">
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
          </div>

          {formSubmitted ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fadeIn">
              <div className="relative mb-8">
                <div className="absolute inset-0 animate-ping bg-orange-500 rounded-full opacity-20"></div>
                <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 rounded-full p-8 shadow-2xl">
                  <CheckCircle className="h-20 w-20 text-white" />
                </div>
              </div>
              
              <div className="text-center max-w-2xl">
                <h2 className={`text-3xl md:text-4xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent`}>
                  Avaliação Física Enviada!
                </h2>
                <div className={`space-y-4 text-lg ${themeClasses.textSecondary}`}>
                  <p>🎉 Parabéns! Sua avaliação foi recebida com sucesso.</p>
                  <p>⚡ Nossa equipe de especialistas está analisando seus dados.</p>
                  <p>💪 Em breve você receberá seu plano de treino personalizado!</p>
                </div>
              </div>
              
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-8 group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover:-translate-x-1" />
                  Voltar para o Dashboard
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          ) : (
            <>
            <div className="text-center mb-12">
              {/* Título principal redesenhado */}
              <div className="relative mb-8">
                <h1 className="relative text-4xl md:text-5xl font-bold mb-4">
                  <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
                    Avaliação
                  </span>
                  <span className={`ml-3 ${themeClasses.text}`}>
                    Física
                  </span>
                  {/* Sublinhado animado */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full animate-pulse"></div>
                </h1>
                
                <p className={`text-lg ${themeClasses.textSecondary} max-w-md mx-auto`}>
                  Monte seu perfil fitness completo em 3 etapas simples
                </p>
              </div>
              
              {/* Botão de tema reposicionado */}
              <div className="flex justify-center mb-8">
                <button 
                  onClick={toggleTheme}
                  className={`group p-3 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 ${
                    isDarkMode 
                      ? 'bg-gray-800/80 text-yellow-400 hover:bg-gray-700/80 border border-gray-600 shadow-lg' 
                      : 'bg-white/90 text-indigo-600 hover:bg-white shadow-lg border border-gray-200'
                  }`}
                  aria-label={isDarkMode ? "Ativar modo claro" : "Ativar modo escuro"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 transition-transform group-hover:rotate-180" />
                  ) : (
                    <Moon className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  )}
                </button>
              </div>
            </div>

              {erro && (
                <div className={`${isDarkMode ? 'bg-red-900/30 border-red-500' : 'bg-red-50 border-red-400'} border-l-4 p-4 rounded-lg mb-6`}>
                  <div className="flex items-center">
                    <AlertCircle className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'} mr-2`} />
                    <p className={isDarkMode ? 'text-red-100' : 'text-red-800'}>{erro}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Progress Steps - Design Melhorado */}
                <div className="relative mb-12">
                  {/* Linha de conexão */}
                  <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700"></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    {Array.from({ length: totalSteps }).map((_, index) => {
                      const stepNumber = index + 1;
                      const isCompleted = currentStep > stepNumber;
                      const isActive = currentStep === stepNumber;
                      const stepInfo = [
                        { title: 'Informações Básicas', icon: '👤', description: 'Dados pessoais' },
                        { title: 'Experiência', icon: '💪', description: 'Histórico fitness' },
                        { title: 'Saúde', icon: '🏥', description: 'Condições médicas' }
                      ][index];
                      
                      return (
                        <div key={index} className="flex flex-col items-center max-w-xs">
                          <div className={`relative flex items-center justify-center w-12 h-12 rounded-full mb-3 transition-all duration-500 ${
                            isCompleted 
                              ? 'bg-green-500 shadow-lg shadow-green-500/30 scale-110' 
                              : isActive 
                                ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 scale-110' 
                                : isDarkMode ? 'bg-gray-700 border-2 border-gray-600' : 'bg-gray-100 border-2 border-gray-300'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-6 w-6 text-white animate-pulse" />
                            ) : (
                              <span className={`text-lg ${isActive ? 'text-white font-bold' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {stepInfo.icon}
                              </span>
                            )}
                            {isActive && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full blur opacity-60 animate-pulse"></div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <h3 className={`text-sm font-semibold mb-1 ${
                              isActive ? themeClasses.text : themeClasses.textSecondary
                            }`}>
                              {stepInfo.title}
                            </h3>
                            <p className={`text-xs ${themeClasses.textSecondary}`}>
                              {stepInfo.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1: Informações Básicas */}
                  {currentStep === 1 && (
                  <div className={`rounded-xl p-6 ${themeClasses.card}`}>
                    <div className="flex items-center mb-6">
                      <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-600'} mr-3`}>
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Informações Básicas</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="sexo" className={`block font-medium ${themeClasses.text}`}>Sexo</label>
                        <select
                          id="sexo"
                          name="sexo"
                          value={formData.sexo}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="masculino">Masculino</option>
                          <option value="feminino">Feminino</option>
                        </select>
                        {formErrors.sexo && <p className="text-red-400 text-sm mt-1">{formErrors.sexo}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="idade" className={`block font-medium ${themeClasses.text}`}>Idade</label>
                        <input
                          type="number"
                          id="idade"
                          name="idade"
                          value={formData.idade}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          placeholder="Digite sua idade"
                          min="1"
                          max="120"
                          required
                        />
                        {formErrors.idade && <p className="text-red-400 text-sm mt-1">{formErrors.idade}</p>}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="objetivo" className={`block font-medium ${themeClasses.text}`}>Objetivo Principal</label>
                        <select
                          id="objetivo"
                          name="objetivo"
                          value={formData.objetivo}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione seu objetivo</option>
                          <option value="hipertrofia">Hipertrofia (Ganho de Massa Muscular)</option>
                          <option value="emagrecimento">Emagrecimento</option>
                          <option value="condicionamento">Condicionamento Físico</option>
                          <option value="saude">Saúde e Bem-estar</option>
                          <option value="forca">Ganho de Força</option>
                          <option value="resistencia">Resistência</option>
                        </select>
                        {formErrors.objetivo && <p className="text-red-400 text-sm mt-1">{formErrors.objetivo}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Experiência */}
                {currentStep === 2 && (
                  <div className={`rounded-xl p-6 ${themeClasses.card}`}>
                    <div className="flex items-center mb-6">
                      <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-600'} mr-3`}>
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Experiência e Disponibilidade</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="tempo_inativo" className={`block font-medium ${themeClasses.text}`}>Tempo sem praticar atividade física</label>
                        <select
                          id="tempo_inativo"
                          name="tempo_inativo"
                          value={formData.tempo_inativo}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="ativo">Estou ativo atualmente</option>
                          <option value="menos_1_mes">Menos de 1 mês</option>
                          <option value="1_3_meses">1 a 3 meses</option>
                          <option value="3_6_meses">3 a 6 meses</option>
                          <option value="6_12_meses">6 a 12 meses</option>
                          <option value="mais_1_ano">Mais de 1 ano</option>
                          <option value="nunca_pratiquei">Nunca pratiquei</option>
                        </select>
                        {formErrors.tempo_inativo && <p className="text-red-400 text-sm mt-1">{formErrors.tempo_inativo}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="experiencia_musculacao" className={`block font-medium ${themeClasses.text}`}>Experiência com musculação</label>
                        <select
                          id="experiencia_musculacao"
                          name="experiencia_musculacao"
                          value={formData.experiencia_musculacao}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione sua experiência</option>
                          <option value="nenhuma">Sedentário (Nunca treinou)</option>
                          <option value="iniciante">Iniciante (0-6 meses)</option>
                          <option value="basico">Básico (6 meses - 1 ano)</option>
                          <option value="intermediario">Intermediário (1-2 anos)</option>
                          <option value="avancado">Avançado (2+ anos)</option>
                        </select>
                        {formErrors.experiencia_musculacao && <p className="text-red-400 text-sm mt-1">{formErrors.experiencia_musculacao}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="disponibilidade_semanal" className={`block font-medium ${themeClasses.text}`}>Disponibilidade semanal para treino</label>
                        <select
                          id="disponibilidade_semanal"
                          name="disponibilidade_semanal"
                          value={formData.disponibilidade_semanal}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione</option>
                          <option value="3 DIAS POR SEMANA">3 DIAS POR SEMANA</option>
                          <option value="4 DIAS POR SEMANA">4 DIAS POR SEMANA</option>
                          <option value="5 DIAS POR SEMANA">5 DIAS POR SEMANA</option>
                        </select>
                        {formErrors.disponibilidade_semanal && <p className="text-red-400 text-sm mt-1">{formErrors.disponibilidade_semanal}</p>}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="nivel_experiencia" className={`block font-medium ${themeClasses.text}`}>Como você classifica seu nível de experiência</label>
                        <select
                          id="nivel_experiencia"
                          name="nivel_experiencia"
                          value={formData.nivel_experiencia}
                          onChange={handleChange}
                          className={`w-full rounded-lg px-4 py-2.5 ${themeClasses.input}`}
                          required
                        >
                          <option value="">Selecione seu nível</option>
                          <option value="sedentario">Sedentário</option>
                          <option value="iniciante">Iniciante</option>
                          <option value="basico">Básico</option>
                          <option value="intermediario">Intermediário</option>
                          <option value="avancado">Avançado</option>
                          <option value="expert">Expert</option>
                        </select>
                        {formErrors.nivel_experiencia && <p className="text-red-400 text-sm mt-1">{formErrors.nivel_experiencia}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Saúde */}
                  {currentStep === 3 && (
                  <div className={`rounded-xl p-6 ${themeClasses.card}`}>
                    <div className="flex items-center mb-6">
                      <div className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-600'} mr-3`}>
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      <h2 className={`text-xl font-semibold ${themeClasses.text}`}>Informações de Saúde</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className={`block font-medium ${themeClasses.text}`}>Você sente dores ao realizar atividades físicas?</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sente_dores"
                              value="sim"
                              checked={formData.sente_dores === 'sim'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sente_dores"
                              value="nao"
                              checked={formData.sente_dores === 'nao'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Não</span>
                          </label>
                        </div>
                        {formErrors.sente_dores && <p className="text-red-400 text-sm mt-1">{formErrors.sente_dores}</p>}
                      </div>

                      {formData.sente_dores === 'sim' && (
                        <>
                          <div className="space-y-2">
                            <label className={`block font-medium ${themeClasses.text}`}>Você possui laudo médico para a prática de atividades físicas?</label>
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="tem_laudo_medico"
                                  value="sim"
                                  checked={formData.tem_laudo_medico === 'sim'}
                                  onChange={handleChange}
                                  className="form-radio"
                                  required
                                />
                                <span className="ml-2">Sim</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="radio"
                                  name="tem_laudo_medico"
                                  value="nao"
                                  checked={formData.tem_laudo_medico === 'nao'}
                                  onChange={handleChange}
                                  className="form-radio"
                                  required
                                />
                                <span className="ml-2">Não</span>
                              </label>
                            </div>
                            {formErrors.tem_laudo_medico && <p className="text-red-400 text-sm mt-1">{formErrors.tem_laudo_medico}</p>}
                          </div>

                          {formData.tem_laudo_medico === 'sim' && (
                            <div className="space-y-2">
                              <label className={`block font-medium ${themeClasses.text}`}>Envie seu laudo médico (PDF, JPG ou PNG)</label>
                              <div 
                                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
                                  isDragging 
                                    ? 'border-orange-500 bg-orange-500/10' 
                                    : 'border-gray-600 hover:border-orange-400 hover:bg-gray-800/30'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('laudo_file')?.click()}
                              >
                                <input
                                  type="file"
                                  id="laudo_file"
                                  onChange={handleFileChange}
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                />
                                <Upload className="h-10 w-10 mx-auto mb-3 text-gray-400" />
                                {laudoFile ? (
                                  <p className="text-orange-400">Arquivo selecionado: {laudoFile.name}</p>
                                ) : (
                                  <>
                                    <p className="text-gray-300 mb-1">Arraste e solte seu arquivo aqui ou clique para selecionar</p>
                                    <p className="text-gray-500 text-sm">Formatos aceitos: PDF, JPG, PNG (máx. 5MB)</p>
                                  </>
                                )}
                              </div>
                              {formErrors.laudo_medico_url && <p className="text-red-400 text-sm mt-1">{formErrors.laudo_medico_url}</p>}
                            </div>
                          )}
                        </>
                      )}

                      <div className="space-y-2">
                        <label className={`block font-medium ${themeClasses.text}`}>Você utiliza algum medicamento regularmente?</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="usa_medicamentos"
                              value="sim"
                              checked={formData.usa_medicamentos === 'sim'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="usa_medicamentos"
                              value="nao"
                              checked={formData.usa_medicamentos === 'nao'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Não</span>
                          </label>
                        </div>
                        {formErrors.usa_medicamentos && <p className="text-red-400 text-sm mt-1">{formErrors.usa_medicamentos}</p>}
                      </div>

                      <div className="space-y-2">
                        <label className={`block font-medium ${themeClasses.text}`}>Você possui alguma doença pré-existente?</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="doenca_pre_existente"
                              value="sim"
                              checked={formData.doenca_pre_existente === 'sim'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="doenca_pre_existente"
                              value="nao"
                              checked={formData.doenca_pre_existente === 'nao'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Não</span>
                          </label>
                        </div>
                        {formErrors.doenca_pre_existente && <p className="text-red-400 text-sm mt-1">{formErrors.doenca_pre_existente}</p>}
                      </div>

                      {formData.doenca_pre_existente === 'sim' && (
                        <div className="space-y-2">
                          <label className={`block font-medium ${themeClasses.text}`}>Essa doença impossibilita a prática de atividades físicas?</label>
                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="doenca_impossibilita"
                                value="sim"
                                checked={formData.doenca_impossibilita === 'sim'}
                                onChange={handleChange}
                                className="form-radio"
                                required={formData.doenca_pre_existente === 'sim'}
                              />
                              <span className="ml-2">Sim</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                name="doenca_impossibilita"
                                value="nao"
                                checked={formData.doenca_impossibilita === 'nao'}
                                onChange={handleChange}
                                className="form-radio"
                                required={formData.doenca_pre_existente === 'sim'}
                              />
                              <span className="ml-2">Não</span>
                            </label>
                          </div>
                          {formErrors.doenca_impossibilita && <p className="text-red-400 text-sm mt-1">{formErrors.doenca_impossibilita}</p>}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className={`block font-medium ${themeClasses.text}`}>Você possui alguma lesão que limita seus movimentos?</label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="tem_lesao"
                              value="sim"
                              checked={formData.tem_lesao === 'sim'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Sim</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="tem_lesao"
                              value="nao"
                              checked={formData.tem_lesao === 'nao'}
                              onChange={handleChange}
                              className="form-radio"
                              required
                            />
                            <span className="ml-2">Não</span>
                          </label>
                        </div>
                        {formErrors.tem_lesao && <p className="text-red-400 text-sm mt-1">{formErrors.tem_lesao}</p>}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className={`flex items-center px-5 py-2.5 rounded-lg ${themeClasses.buttonSecondary}`}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className={`ml-auto px-5 py-2.5 rounded-lg ${themeClasses.button}`}
                    >
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className={`ml-auto px-5 py-2.5 rounded-lg ${themeClasses.button}`}
                      disabled={loading}
                    >
                      {loading ? 'Enviando...' : 'Enviar Avaliação'}
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
              <div className={`rounded-lg p-6 max-w-md w-full shadow-xl ${themeClasses.card}`}>
                <h3 className={`text-xl font-semibold mb-4 ${themeClasses.text}`}>Confirmar Envio</h3>
                <p className={`mb-6 ${themeClasses.textSecondary}`}>
                  Você está prestes a enviar sua avaliação física. Tem certeza que deseja continuar?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className={`px-4 py-2 rounded-lg ${themeClasses.buttonSecondary}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmStep3}
                    className={`px-4 py-2 rounded-lg ${themeClasses.button}`}
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          )}
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

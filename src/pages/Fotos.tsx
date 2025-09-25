import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  Image, 
  FileText, 
  CheckCircle, 
  Clock, 
  Download, 
  X, 
  AlertTriangle,
  Camera,
  FileCheck,
  Upload
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useActivityLoggerContext } from '../providers/ActivityLoggerProvider';
import { ConsentModal } from '../components/ConsentModal';
import { TermsService } from '../lib/termsService';
import { usePageVisibility } from '../hooks/usePageVisibility';
import { clearAnaliseCorpCache } from '../utils/cacheUtils';

interface PerfilFotos {
  nome_completo?: string;
  foto_lateral_url?: string;
  foto_abertura_url?: string;
}

interface LaudoMedico {
  id: string;
  status: string;
  tipo_documento: string;
  documento_url: string;
  observacoes?: string;
  created_at: string;
  aprovado_em?: string;
}

interface FotoInfo {
  id: string;
  title: string;
  url?: string;
  position: string;
  uploaded: boolean;
  description?: string;
}

export const Fotos = React.memo(function Fotos() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilFotos | null>(null);
  const [laudos, setLaudos] = useState<LaudoMedico[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const navigate = useNavigate();
  const activityLogger = useActivityLoggerContext();
  
  // Estados para o modal de consentimento
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentRejected, setConsentRejected] = useState(false);
  const [checkingConsent, setCheckingConsent] = useState(false);
  const hasLoadedRef = useRef(false);
  
  // Hook de visibilidade para prevenir re-fetching
  usePageVisibility({
    preventRefetchOnFocus: true
  });

  // Hook para fechar modal com tecla ESC
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedPhoto) {
        setSelectedPhoto(null);
      }
    };

    if (selectedPhoto) {
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [selectedPhoto]);

  const loadUserPhotos = useCallback(async () => {
    // Se já carregou uma vez, não recarregar
    if (hasLoadedRef.current && perfil !== null) {
      return;
    }
    
    try {
      setLoading(true);
        
        // Buscar usuário logado
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar dados do perfil com fotos
          const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select(`
              nome_completo,
              foto_lateral_url,
              foto_abertura_url
            `)
            .eq('user_id', user.id)
            .single();

          if (perfilError) {
            console.error('Erro ao buscar perfil:', perfilError);
            setError('Erro ao carregar suas fotos. Tente novamente.');
          } else {
            setPerfil(perfilData);
            
            // Verificar se o usuário tem fotos e precisa de consentimento
            const temFotos = perfilData && (
              perfilData.foto_lateral_url ||
              perfilData.foto_abertura_url
            );
            
            if (temFotos) {
              // Verificar consentimento para envio de fotos
              setCheckingConsent(true);
              const consent = await TermsService.hasUserConsented(user.id, 'ENVIO_FOTOS');
              
              if (consent === null) {
                // Usuário nunca deu consentimento, mostrar modal
                setShowConsentModal(true);
              } else if (consent === false) {
                // Usuário rejeitou o termo (não bloqueia acesso, apenas registra)
                setConsentRejected(true);
              } else {
                // Usuário aceitou o termo
                setConsentChecked(true);
              }
              setCheckingConsent(false);
            } else {
              // Sem fotos, não precisa de consentimento
              setConsentChecked(true);
            }
          }

          // Buscar laudos médicos na tabela analises_medicamentos
          const { data: laudosData, error: laudosError } = await supabase
            .from('analises_medicamentos')
            .select(`
              id,
              status,
              tipo_documento,
              documento_url,
              observacoes,
              created_at,
              aprovado_em
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (laudosError) {
            console.error('Erro ao buscar laudos:', laudosError);
          } else {
            setLaudos(laudosData || []);
          }

          // Registrar acesso à página
          try {
            await activityLogger.logPageVisit('Página de Fotos', '/fotos');
          } catch (error) {
            console.error('Erro ao registrar acesso à página de fotos:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
        setError('Erro ao verificar sua sessão.');
      } finally {
        setLoading(false);
        hasLoadedRef.current = true;
      }
  }, [activityLogger]);
  
  useEffect(() => {
    loadUserPhotos();
  }, [loadUserPhotos]);

  // Preparar dados das fotos
  const fotos: FotoInfo[] = [
    {
      id: 'lateral',
      title: 'Foto Lateral',
      url: perfil?.foto_lateral_url,
      position: 'lateral',
      uploaded: !!perfil?.foto_lateral_url,
      description: 'Tire uma foto de perfil (lado do corpo) em pé, com boa iluminação'
    },
    {
      id: 'abertura',
      title: 'Foto de Abertura',
      url: perfil?.foto_abertura_url,
      position: 'abertura',
      uploaded: !!perfil?.foto_abertura_url,
      description: 'Tire uma foto de frente com os braços abertos em cruz (formato T)'
    }
  ];

  const fotosEnviadas = fotos.filter(foto => foto.uploaded).length;
  const totalFotos = fotos.length;

  const handleDownloadLaudo = useCallback((laudoUrl: string) => {
    if (laudoUrl) {
      window.open(laudoUrl, '_blank');
    }
  }, []);

  // Funções para lidar com o consentimento
  const handleConsentAccept = useCallback(async () => {
    try {
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const success = await TermsService.recordConsent(user.id, 'ENVIO_FOTOS', true);
      if (success) {
        setConsentChecked(true);
        setShowConsentModal(false);
      } else {
        setError('Erro ao registrar consentimento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao aceitar consentimento:', error);
      setError('Erro ao registrar consentimento. Tente novamente.');
    }
  }, [user]);

  const handleConsentReject = useCallback(async () => {
    try {
      if (!user) {
        setError('Usuário não autenticado');
        return;
      }

      const success = await TermsService.recordConsent(user.id, 'ENVIO_FOTOS', false);
      if (success) {
        setConsentRejected(true);
        setConsentChecked(true); // Permite acesso mesmo rejeitando (fotos não são obrigatórias)
        setShowConsentModal(false);
      } else {
        setError('Erro ao registrar consentimento. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao rejeitar consentimento:', error);
      setError('Erro ao registrar consentimento. Tente novamente.');
    }
  }, [user]);

  const handleConsentClose = useCallback(() => {
    // Para fotos, fechar sem consentimento ainda permite acesso
    setConsentChecked(true);
    setShowConsentModal(false);
  }, []);

  // Função para lidar com upload de fotos
  const handleUploadClick = useCallback((fotoId: string) => {
    // Criar input file programaticamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && user) {
        await handleFileUpload(file, fotoId);
      }
    };
    input.click();
  }, [user]);

  const handleFileUpload = useCallback(async (file: File, fotoId: string) => {
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 10MB');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${fotoId}_${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('fotos-usuarios')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública da foto
      const { data: { publicUrl } } = supabase.storage
        .from('fotos-usuarios')
        .getPublicUrl(fileName);

      // Determinar qual campo atualizar
      const updateData: any = {};
      if (fotoId === 'lateral') {
        updateData.foto_lateral_url = publicUrl;
        updateData.foto_lateral_enviada_em = new Date().toISOString();
      } else if (fotoId === 'abertura') {
        updateData.foto_abertura_url = publicUrl;
        updateData.foto_abertura_enviada_em = new Date().toISOString();
      }

      // Atualizar perfil com a URL da foto
      const { error: updateError } = await supabase
        .from('perfis')
        .update(updateData)
        .eq('user_id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Registrar upload
      try {
        await activityLogger.logDocumentUpload(
          `foto_${fotoId}`,
          `${fotoId}_${Date.now()}.jpg`
        );
      } catch (logError) {
        console.error('Erro ao registrar upload:', logError);
      }

      // Recarregar dados
      await loadUserPhotos();

      // Limpar cache da análise corporal para forçar atualização
      clearAnaliseCorpCache(user.id);

      // Mostrar mensagem de sucesso (opcional - você pode adicionar um toast/notificação aqui)
      console.log(`Foto ${fotoId} enviada com sucesso!`);
      
      // Verificar se deve processar análise corporal automaticamente
      await verificarEProcessarAnalise();
      
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      setError('Erro ao enviar foto. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [user, activityLogger, loadUserPhotos]);
  
  // Função para verificar e processar análise corporal automaticamente
  const verificarEProcessarAnalise = useCallback(async () => {
    if (!user) return;
    
    try {
      // Buscar perfil atualizado
      const { data: perfilAtualizado } = await supabase
        .from('perfis')
        .select('foto_lateral_url, foto_abertura_url')
        .eq('user_id', user.id)
        .single();
        
      // Se tem ambas as fotos
      if (perfilAtualizado?.foto_lateral_url && perfilAtualizado?.foto_abertura_url) {
        console.log('✅ Ambas as fotos detectadas, verificando se precisa processar análise...');
        
        // Verificar se já tem análise corporal
        const { data: analiseExistente } = await supabase
          .from('medidas_corporais')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
          
        if (!analiseExistente || analiseExistente.length === 0) {
          console.log('🚀 Iniciando processamento automático de análise corporal...');
          
          // Verificar se tem avaliação nutricional
          const { data: avalNutricional } = await supabase
            .from('avaliacao_nutricional')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
            
          const { data: avalNutricionalFem } = await supabase
            .from('avaliacao_nutricional_feminino')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);
            
          if ((avalNutricional && avalNutricional.length > 0) || 
              (avalNutricionalFem && avalNutricionalFem.length > 0)) {
            
            console.log('📊 Chamando Edge Function para processar análise corporal...');
            
            // Chamar Edge Function para processar
            const { data, error } = await supabase.functions.invoke('processar-analise-corporal', {
              body: { user_id: user.id }
            });
            
            if (error) {
              console.error('❌ Erro ao processar análise corporal:', error);
            } else {
              console.log('✅ Análise corporal processada com sucesso!', data);
              // Limpar cache novamente para forçar atualização
              clearAnaliseCorpCache(user.id);
            }
          } else {
            console.log('⚠️ Usuário não tem avaliação nutricional preenchida');
          }
        } else {
          console.log('ℹ️ Análise corporal já existe para este usuário');
        }
      } else {
        console.log('ℹ️ Aguardando ambas as fotos para processar análise');
      }
    } catch (error) {
      console.error('Erro ao verificar/processar análise corporal:', error);
    }
  }, [user]);

  if (loading || checkingConsent) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {loading ? 'Carregando suas fotos...' : 'Verificando permissões...'}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className={`flex items-center justify-center min-h-screen ${
          isDarkMode ? 'bg-black' : 'bg-gray-50'
        }`}>
          <div className={`text-center max-w-md p-6 rounded-2xl shadow-xl ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          } border`}>
            <AlertTriangle className={`h-16 w-16 mx-auto mb-4 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
            <h2 className={`text-xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Erro
            </h2>
            <p className={`mb-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {error}
            </p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-6 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white transition-all duration-200"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      } px-4 py-8 relative`}>
        {consentChecked && (
          <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Suas Fotos e Laudos
            </h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Acompanhe suas fotos de progresso e laudos médicos
            </p>
          </div>

          {/* Conteúdo Principal */}
              {/* Status das Fotos */}
              <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${
                isDarkMode 
                  ? 'bg-gray-900 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Fotos de Progresso
              </h2>
              <div className={`px-4 py-2 rounded-full text-sm font-medium ${
                fotosEnviadas === totalFotos
                  ? isDarkMode 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-green-100 text-green-700'
                  : isDarkMode 
                    ? 'bg-orange-900/30 text-orange-400' 
                    : 'bg-orange-100 text-orange-700'
              }`}>
                {fotosEnviadas}/{totalFotos} fotos enviadas
              </div>
            </div>
            

            {/* Grid de Fotos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fotos.map((foto) => (
                <div
                  key={foto.id}
                  className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                    foto.uploaded
                      ? 'border-green-500 cursor-pointer hover:shadow-lg'
                      : isDarkMode 
                        ? 'border-gray-600 border-dashed' 
                        : 'border-gray-300 border-dashed'
                  }`}
                  onClick={() => foto.uploaded && setSelectedPhoto(foto.url!)}
                >
                  {foto.uploaded ? (
                    <>
                      <img
                        src={foto.url}
                        alt={foto.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                      </div>
                    </>
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-opacity-80 ${
                      isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                      onClick={() => handleUploadClick(foto.id)}
                    >
                      <Upload className={`h-12 w-12 mb-3 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <p className={`text-sm font-medium mb-1 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Clique para enviar
                      </p>
                      <p className={`text-xs text-center px-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {foto.description}
                      </p>
                    </div>
                  )}
                  <div className={`absolute bottom-0 left-0 right-0 p-2 ${
                    isDarkMode ? 'bg-black/70' : 'bg-white/90'
                  }`}>
                    <p className={`text-xs font-medium truncate ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {foto.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Laudos */}
          <div className={`mb-8 p-6 rounded-2xl shadow-lg border ${
            isDarkMode 
              ? 'bg-gray-900 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <h2 className={`text-2xl font-bold mb-6 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Laudos Médicos
            </h2>
            
            {laudos.length > 0 ? (
              <div className="space-y-4">
                {laudos.map((laudo) => (
                  <div 
                    key={laudo.id}
                    className={`p-4 rounded-xl border ${
                      laudo.aprovado_em
                        ? isDarkMode 
                          ? 'bg-green-900/20 border-green-500/30' 
                          : 'bg-green-50 border-green-200'
                        : isDarkMode 
                          ? 'bg-yellow-900/20 border-yellow-500/30' 
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileCheck className={`h-8 w-8 mr-4 ${
                          laudo.aprovado_em
                            ? isDarkMode ? 'text-green-400' : 'text-green-600'
                            : isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                        }`} />
                        <div>
                          <h3 className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {laudo.tipo_documento || 'Laudo Médico'}
                          </h3>
                          <p className={`text-sm ${
                            laudo.aprovado_em
                              ? isDarkMode ? 'text-green-200' : 'text-green-700'
                              : isDarkMode ? 'text-yellow-200' : 'text-yellow-700'
                          }`}>
                            {laudo.aprovado_em 
                              ? 'Aprovado pela equipe médica' 
                              : `Status: ${laudo.status || 'Em análise'}`}
                          </p>
                          {laudo.observacoes && (
                            <p className={`text-xs mt-1 ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {laudo.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadLaudo(laudo.documento_url)}
                        className={`p-3 rounded-xl transition-all duration-200 ${
                          isDarkMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-6 rounded-xl border-2 border-dashed text-center ${
                isDarkMode 
                  ? 'border-gray-600 bg-gray-800/50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                <FileText className={`h-12 w-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <h3 className={`font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Nenhum laudo enviado
                </h3>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Laudos médicos enviados aparecerão aqui
                </p>
              </div>
            )}
          </div>
        </div>
        )}


        {/* Modal para visualizar foto */}
        {selectedPhoto && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 cursor-pointer overflow-auto"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Botão de fechar - fixo no canto superior direito */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhoto(null);
              }}
              className="fixed top-6 right-6 z-20 p-3 bg-black/70 hover:bg-black/90 rounded-full text-white transition-all duration-200 backdrop-blur-sm"
              title="Fechar (ESC)"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Container principal centralizado */}
            <div className="min-h-screen flex items-center justify-center p-6">
              <div className="relative">
                <img
                  src={selectedPhoto}
                  alt="Foto ampliada"
                  className="max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] object-contain rounded-lg shadow-2xl cursor-default"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* Dica para fechar - fixo na parte inferior */}
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 text-white/70 text-sm bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm pointer-events-none">
              Clique fora da imagem ou pressione ESC para fechar
            </div>
          </div>
        )}

        {/* Modal de Consentimento */}
        <ConsentModal
          isOpen={showConsentModal}
          termType="ENVIO_FOTOS"
          onAccept={handleConsentAccept}
          onReject={handleConsentReject}
          onClose={handleConsentClose}
        />
      </div>
    </Layout>
  );
});
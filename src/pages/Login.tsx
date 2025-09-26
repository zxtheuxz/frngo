import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/global.css';

// Helper para logs condicionais de debug (preserva stack trace)
const debugLog = process.env.NODE_ENV === 'development'
  ? console.log.bind(console)
  : () => {};

// Função para limpeza agressiva de cache
const clearAllCaches = async () => {
  console.log('🧹 Iniciando limpeza agressiva de cache...');

  try {
    // 1. Limpar Service Worker caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️ Removendo cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    // 2. Limpar localStorage (incluindo tokens antigos)
    if (typeof Storage !== 'undefined') {
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('supabase') || key.includes('auth') || key.includes('cache')) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removido do localStorage: ${key}`);
        }
      });
    }

    // 3. Limpar sessionStorage
    if (typeof Storage !== 'undefined') {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removido do sessionStorage: ${key}`);
      });
    }
  } catch (error) {
    console.error('❌ Erro na limpeza de cache:', error);
  }

  console.log('✅ Cache limpo com sucesso!');
};

// Versão que preserva tokens de autenticação válidos
const clearCachePreservingAuth = async () => {
  console.log('🧽 Limpeza seletiva preservando autenticação...');

  try {
    // 1. Limpar Service Worker caches (seguro)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`🗑️ Removendo cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    // 2. Limpar sessionStorage (dados temporários)
    if (typeof Storage !== 'undefined') {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        // Só remove dados não relacionados a auth ativa
        if (!key.includes('supabase.auth.token') && !key.includes('sb-')) {
          sessionStorage.removeItem(key);
          console.log(`🗑️ Removido do sessionStorage: ${key}`);
        }
      });
    }

    // 3. Limpar localStorage seletivamente (preserva tokens ativos)
    if (typeof Storage !== 'undefined') {
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        // Remove cache mas preserva tokens de sessão ativa
        if (key.includes('cache') || key.includes('theme') ||
            (key.includes('supabase') && !key.includes('auth.token') && !key.includes('sb-'))) {
          localStorage.removeItem(key);
          console.log(`🗑️ Removido seletivamente: ${key}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro na limpeza seletiva:', error);
  }

  console.log('✅ Cache seletivo limpo (auth preservado)!');
};

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { signIn, signOut, userProfile, loading, profileLoading, getDefaultRouteForRole } = useAuth();
  const isDarkMode = theme === 'dark';

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [recuperandoSenha, setRecuperandoSenha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Limpeza agressiva de cache ao carregar o Login
  useEffect(() => {
    clearAllCaches();
  }, []);

  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setErro(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Limpar o state do location
      navigate('/login', { replace: true });
    }
  }, [location.state, navigate]);

  // DEBUG: Monitorar mudanças no userProfile
  useEffect(() => {
    console.log('Login: useEffect - userProfile mudou para:', userProfile);
    console.log('Login: useEffect - loading:', loading);
    console.log('Login: useEffect - profileLoading:', profileLoading);
  }, [userProfile, loading, profileLoading]);

  // Detectar quando login e perfil completaram para fazer redirecionamento
  useEffect(() => {
    const handleRedirect = async () => {
      // Só redirecionar se:
      // 1. Não está mais carregando (loading = false)
      // 2. Não está carregando perfil (profileLoading = false)
      // 3. Tem userProfile carregado
      // 4. Não há erro
      if (!loading && !profileLoading && userProfile && !erro) {
        const userRole = userProfile.role;
        debugLog(`Login: Redirecionamento automático. Role: ${userRole}`);

        // BLOQUEAR admin e preparador - fazer logout imediato
        if (userRole === 'admin' || userRole === 'preparador') {
          debugLog('Login: Staff user detectado, fazendo logout e bloqueando acesso');

          signOut();

          setErro('Admins e preparadores devem usar o Login Staff. Acesse através do link abaixo.');

          setTimeout(() => {
            navigate('/staff', {
              state: {
                message: 'Use este login para acessar como admin ou preparador.',
                email: email
              }
            });
          }, 3000);
          return;
        }

        // PERMITIR usuários normais (cliente/usuario)
        if (userRole === 'cliente' || userRole === 'usuario') {
          const defaultRoute = getDefaultRouteForRole();
          debugLog(`Login: Redirecionando para ${defaultRoute}`);

          // Limpeza seletiva preservando autenticação válida
          try {
            await clearCachePreservingAuth();
            debugLog('Login: Cache seletivo limpo com sucesso');
          } catch (error) {
            console.warn('Login: Erro ao limpar cache seletivamente (continuando):', error);
          }

          navigate(defaultRoute);
          return;
        }

        // Role não reconhecido
        debugLog(`Login: Role não reconhecido: ${userRole}`);
        signOut();
        setErro('Tipo de usuário não reconhecido. Entre em contato com o suporte.');
      }
    };

    handleRedirect();
  }, [loading, profileLoading, userProfile, erro, navigate, signOut, getDefaultRouteForRole, email]);

  // DEBUG: Log do render completo
  console.log('Login: Renderizando - userProfile:', userProfile, 'loading:', loading, 'profileLoading:', profileLoading);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    try {
      debugLog('Login: Fazendo login...');

      // Usar a função signIn do AuthContext - ela gerencia todo o processo
      const { user, error } = await signIn(email, senha);

      if (error) {
        console.error('Login: Erro na autenticação:', error);

        // Verificar se é erro específico de perfil
        if (error.message?.includes('PROFILE_ERROR')) {
          setErro('Erro na configuração da sua conta. Entre em contato com o suporte através do WhatsApp.');
          return;
        }

        setErro('Erro ao fazer login. Verifique suas credenciais.');
        return;
      }

      // Se chegou aqui, login foi bem-sucedido
      // O AuthContext vai gerenciar loading e profileLoading automaticamente
      debugLog('Login: Autenticação bem-sucedida, AuthContext processando...');

    } catch (error) {
      console.error('Login: Erro inesperado:', error);

      // Verificar se é erro específico de perfil vindo do AuthContext
      if (error instanceof Error && error.message === 'PROFILE_ERROR') {
        setErro('Erro na configuração da sua conta. Entre em contato com o suporte através do WhatsApp.');
        return;
      }

      setErro('Erro ao fazer login. Verifique suas credenciais.');
    }
  };

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErro('Por favor, informe seu email para recuperar a senha.');
      return;
    }

    setRecuperandoSenha(true);
    setErro('');
    setSucesso('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) throw error;
      setSucesso(
        'Email de recuperação enviado! Verifique sua caixa de entrada e spam.'
      );
    } catch (error) {
      setErro('Erro ao enviar email de recuperação. Verifique se o email está correto.');
    } finally {
      setRecuperandoSenha(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${
      isDarkMode 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      
      {/* Left Side - Hero Section */}
      <div className={`hidden lg:flex lg:w-1/2 ${
        isDarkMode 
          ? 'bg-gradient-to-br from-gray-900 to-black' 
          : 'bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600'
      } relative overflow-hidden`}>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="max-w-md">
            <img
              src="/images/Logo-Consultoria.png"
              alt="Consultoria Extermina Frango"
              className="w-80 h-80 mx-auto mb-6 drop-shadow-2xl"
            />
            
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Transforme seu corpo e domine sua mente. Sua jornada fitness começa aqui.
            </p>
            
            <div className="space-y-4 text-white/80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Treinos personalizados</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Acompanhamento nutricional</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-yellow-300 rounded-full"></div>
                <span>Resultados comprovados</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className={`w-full lg:w-1/2 flex items-center justify-center p-8 ${
        isDarkMode ? 'bg-black' : 'bg-gray-50'
      }`}>
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <img
              src="/images/Logo-Consultoria.png"
              alt="Consultoria Extermina Frango"
              className="w-24 h-24 mx-auto mb-4"
            />
          </div>
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className={`text-3xl font-bold mb-2 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Bem-vindo de volta
            </h2>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Entre na sua conta para continuar
            </p>
          </div>
          
          {/* Messages */}
          {erro && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}

          {sucesso && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{sucesso}</span>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="senha" className={`block text-sm font-semibold mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Senha
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`} />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 rounded-xl border-2 transition-all duration-200 text-lg ${
                    isDarkMode 
                      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500 focus:border-orange-500 focus:bg-gray-800' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-orange-500 focus:bg-orange-50'
                  } focus:outline-none`}
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${
                    isDarkMode ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-600'
                  } transition-colors`}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRecuperarSenha}
                disabled={recuperandoSenha}
                className="text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors"
              >
                {recuperandoSenha ? 'Enviando...' : 'Esqueceu sua senha?'}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || profileLoading}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform ${
                loading || profileLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 shadow-lg hover:shadow-xl hover:-translate-y-1'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Entrando...
                </>
              ) : profileLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Carregando perfil...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Divider */}
          <div className="my-8 relative">
            <div className={`absolute inset-0 flex items-center`}>
              <div className={`w-full border-t ${
                isDarkMode ? 'border-gray-700' : 'border-gray-300'
              }`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-4 ${
                isDarkMode ? 'bg-black text-gray-400' : 'bg-gray-50 text-gray-500'
              }`}>
                Não tem uma conta?
              </span>
            </div>
          </div>
          
          {/* Sign Up Link */}
          <Link
            to="/cadastro"
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg border-2 transition-all duration-200 transform hover:-translate-y-1 ${
              isDarkMode 
                ? 'border-gray-700 text-gray-300 hover:bg-gray-900 hover:border-gray-600' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400'
            }`}
          >
            Criar conta gratuita
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
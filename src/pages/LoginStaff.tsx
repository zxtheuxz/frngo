import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export function LoginStaff() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signOut, userProfile, getDefaultRouteForRole } = useAuth();
  
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Verificar se há mensagem de redirecionamento
  useEffect(() => {
    const state = location.state as { message?: string; email?: string } | null;
    if (state?.message) {
      setErro(state.message);
      if (state.email) {
        setEmail(state.email);
      }
      // Limpar o state do location
      navigate('/staff', { replace: true });
    }
  }, [location.state, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    
    try {
      // PRIMEIRO: Verificar se o email corresponde a um usuário staff
      let roleData = null;

      try {
        // Fazer login temporário para obter user_id e verificar role
        const { data: tempAuth, error: tempError } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (tempError) {
          setErro('Credenciais inválidas.');
          return;
        }

        // Buscar role com o user_id obtido
        const { data: profileData, error: profileError } = await supabase
          .from('perfis')
          .select('role, user_id, nome_completo')
          .eq('user_id', tempAuth.user.id)
          .single();

        if (profileError) {
          // Fazer logout da tentativa temporária
          await supabase.auth.signOut();
          setErro('Usuário não encontrado no sistema.');
          return;
        }

        roleData = profileData;
      } catch (err) {
        setErro('Erro ao verificar permissões. Tente novamente.');
        return;
      }

      if (!roleData) {
        setErro('Usuário não encontrado ou não autorizado para esta área.');
        return;
      }

      const userRole = roleData.role;

      // BLOQUEAR usuários comuns ANTES da autenticação
      if (userRole === 'cliente' || userRole === 'usuario') {
        setErro('Esta área é restrita ao staff. Use o login normal.');
        
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Esta área é restrita ao staff. Use o login normal.',
              email: email 
            } 
          });
        }, 3000);
        return;
      }

      // PERMITIR apenas admin, preparador e nutricionista
      if (userRole !== 'admin' && userRole !== 'preparador' && userRole !== 'nutricionista') {
        setErro('Role de usuário não autorizado para esta área.');
        return;
      }

      // SEGUNDO: Se já foi autenticado na verificação inicial, usar signIn para atualizar AuthContext
      // Se não foi autenticado ainda, fazer a autenticação agora
      const { user, error } = await signIn(email, senha);

      if (error) {
        console.error('LoginStaff: Erro de autenticação:', error);
        setErro('Credenciais inválidas ou erro de conexão.');
        return;
      }

      if (user) {
        // Redirecionar baseado no role local (não dependendo do AuthContext que pode estar desatualizado)
        let targetRoute = '/dashboard';
        
        switch (userRole) {
          case 'admin':
            targetRoute = '/admin/dashboard';
            break;
          case 'preparador':
            targetRoute = '/preparador/dashboard';
            break;
          case 'nutricionista':
            targetRoute = '/nutricionista/dashboard';
            break;
          default:
            targetRoute = '/dashboard';
        }
        
        console.log('LoginStaff: Redirecionando para:', targetRoute, 'userRole:', userRole);
        navigate(targetRoute);
      }
    } catch (error) {
      console.error('LoginStaff: Erro inesperado:', error);
      setErro('Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Left Side - Corporate Hero */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 to-slate-900 relative overflow-hidden">
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center px-12 w-full">
          <div className="max-w-md">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-blue-500 to-slate-400 rounded-2xl flex items-center justify-center">
              <Shield className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-4xl font-black text-white mb-6 leading-tight">
              ÁREA
              <br />
              <span className="text-blue-400">RESTRITA</span>
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 leading-relaxed">
              Acesso exclusivo para administradores e preparadores autorizados.
            </p>
            
            <div className="space-y-4 text-slate-400">
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Sistema de gestão</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Controle administrativo</span>
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Análise profissional</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-32 left-16 w-24 h-24 bg-slate-400/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-slate-600 rounded-xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-900">
              ACESSO <span className="text-blue-600">STAFF</span>
            </h1>
          </div>
          
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 text-slate-900">
              Acesso Restrito
            </h2>
            <p className="text-lg text-slate-600">
              Entre com suas credenciais de staff
            </p>
          </div>
          
          {/* Error Message */}
          {erro && (
            <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{erro}</span>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold mb-2 text-slate-700">
                Email Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-300 text-lg bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-blue-50 focus:outline-none transition-all duration-200"
                  placeholder="staff@empresa.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold mb-2 text-slate-700">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="senha"
                  name="senha"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-xl border-2 border-slate-300 text-lg bg-white text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:bg-blue-50 focus:outline-none transition-all duration-200"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 transform ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-slate-700 hover:from-blue-700 hover:to-slate-800 shadow-lg hover:shadow-xl hover:-translate-y-1'
              } text-white`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Verificando...
                </>
              ) : (
                <>
                  Entrar no Sistema
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Security Notice */}
          <div className="mt-8 p-4 bg-slate-100 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">
                  Acesso Monitorado
                </p>
                <p className="text-xs text-slate-500">
                  Tentativas de acesso são registradas e monitoradas. 
                  Apenas staff autorizado deve utilizar este sistema.
                </p>
              </div>
            </div>
          </div>
          
          {/* Back to Client Login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              ← Voltar para área do cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
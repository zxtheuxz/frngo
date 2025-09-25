import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Lock, Save, Settings, Shield, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

export function Configuracoes() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Estilos limpos e profissionais
  const themeStyles = {
    light: {
      background: "bg-gray-50",
      text: "text-gray-900",
      textSecondary: "text-gray-600",
      card: "bg-white shadow-sm border border-gray-200",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonSecondary: "bg-gray-100 hover:bg-gray-200 text-gray-700",
      input: "bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
      accent: "text-blue-600"
    },
    dark: {
      background: "bg-gray-900",
      text: "text-white",
      textSecondary: "text-gray-300",
      card: "bg-gray-800 border border-gray-700",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      buttonSecondary: "bg-gray-700 hover:bg-gray-600 text-gray-200",
      input: "bg-gray-800 border border-gray-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20",
      accent: "text-blue-400"
    }
  };

  const currentTheme = isDarkMode ? themeStyles.dark : themeStyles.light;

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  
  // Estados para alteração de senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');



  // Carregar dados do usuário
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  // Função para alterar senha
  const alterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (novaSenha !== confirmarSenha) {
      setMensagem({ 
        texto: 'As senhas não coincidem. Verifique e tente novamente.', 
        tipo: 'erro' 
      });
      return;
    }

    if (novaSenha.length < 6) {
      setMensagem({ 
        texto: 'A nova senha deve ter pelo menos 6 caracteres.', 
        tipo: 'erro' 
      });
      return;
    }
    
    setSalvando(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha
      });
      
      if (error) throw error;
      
      setMensagem({ 
        texto: 'Senha alterada com sucesso!', 
        tipo: 'sucesso' 
      });
      
      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Limpar mensagem após 5 segundos
      setTimeout(() => setMensagem({ texto: '', tipo: '' }), 5000);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setMensagem({ 
        texto: 'Erro ao alterar senha. Verifique sua senha atual e tente novamente.', 
        tipo: 'erro' 
      });
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${currentTheme.background}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`min-h-screen ${currentTheme.background} px-4 py-8`}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className={`w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mr-4`}>
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-semibold ${currentTheme.text}`}>
                  Configurações
                </h1>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Mantenha sua conta segura
                </p>
              </div>
            </div>
          </div>
          
          {/* Mensagem de feedback */}
          {mensagem.texto && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
              mensagem.tipo === 'sucesso' 
                ? `${isDarkMode ? 'bg-green-900/20 border-green-500' : 'bg-green-50 border-green-500'}`
                : `${isDarkMode ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-500'}`
            }`}>
              <div className="flex items-center">
                <div className={`${mensagem.tipo === 'sucesso' ? 'text-green-500' : 'text-red-500'} mr-3`}>
                  {mensagem.tipo === 'sucesso' ? 
                    <CheckCircle2 className="w-5 h-5" /> : 
                    <AlertCircle className="w-5 h-5" />
                  }
                </div>
                <p className={`text-sm font-medium ${
                  mensagem.tipo === 'sucesso' 
                    ? (isDarkMode ? 'text-green-200' : 'text-green-800')
                    : (isDarkMode ? 'text-red-200' : 'text-red-800')
                }`}>
                  {mensagem.texto}
                </p>
              </div>
            </div>
          )}
          
          {/* Card principal */}
          <div className={`${currentTheme.card} rounded-lg p-6`}>
            {/* Header do card */}
            <div className="flex items-center mb-6">
              <div className={`w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center mr-3`}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${currentTheme.text}`}>
                  Alterar Senha
                </h2>
                <p className={`text-sm ${currentTheme.textSecondary}`}>
                  Mantenha sua conta protegida
                </p>
              </div>
            </div>

            <form onSubmit={alterarSenha} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="senhaAtual" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Senha Atual
                  </label>
                  <div className="relative">
                    <input
                      id="senhaAtual"
                      name="senhaAtual"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      className={`${currentTheme.input} block w-full px-4 py-3 rounded-lg pl-12`}
                      placeholder="Digite sua senha atual"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className={`h-5 w-5 ${currentTheme.accent}`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="novaSenha" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="novaSenha"
                      name="novaSenha"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className={`${currentTheme.input} block w-full px-4 py-3 rounded-lg pl-12`}
                      placeholder="Digite sua nova senha (mín. 6 caracteres)"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className={`h-5 w-5 ${currentTheme.accent}`} />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmarSenha" className={`block text-sm font-medium ${currentTheme.text} mb-2`}>
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      id="confirmarSenha"
                      name="confirmarSenha"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      className={`${currentTheme.input} block w-full px-4 py-3 rounded-lg pl-12`}
                      placeholder="Confirme sua nova senha"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Shield className={`h-5 w-5 ${currentTheme.accent}`} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={salvando}
                  className={`${currentTheme.button} relative w-full flex justify-center py-3 px-6 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/25 ${
                    salvando ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <Save className={`h-5 w-5 text-white ${salvando ? 'animate-spin' : ''}`} />
                  </span>
                  {salvando ? 'Salvando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>

            {/* Dicas de segurança */}
            <div className={`mt-6 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <h3 className={`text-sm font-medium ${currentTheme.text} mb-2 flex items-center`}>
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                Dicas de Segurança
              </h3>
              <ul className={`text-sm ${currentTheme.textSecondary} space-y-1`}>
                <li>• Use pelo menos 8 caracteres com letras, números e símbolos</li>
                <li>• Evite informações pessoais como nome, data de nascimento</li>
                <li>• Altere sua senha regularmente para manter a segurança</li>
                <li>• Nunca compartilhe sua senha com outras pessoas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 
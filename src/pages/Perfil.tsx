import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Users, Activity, Mail, User as UserIcon, Calendar, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClass } from '../styles/theme';
import '../styles/global.css';

interface Perfil {
  sexo?: string;
  nome_completo?: string;
}

export function Perfil() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const themeClasses = {
    background: getThemeClass(isDarkMode, 'background'),
    text: getThemeClass(isDarkMode, 'text'),
    textSecondary: getThemeClass(isDarkMode, 'textSecondary'),
    card: `${getThemeClass(isDarkMode, 'cardBg')} border ${getThemeClass(isDarkMode, 'border')} ${getThemeClass(isDarkMode, 'shadow')}`,
    button: getThemeClass(isDarkMode, 'button'),
    buttonSecondary: getThemeClass(isDarkMode, 'buttonSecondary'),
    input: getThemeClass(isDarkMode, 'input'),
    label: getThemeClass(isDarkMode, 'label'),
    helperText: getThemeClass(isDarkMode, 'helperText'),
    errorText: isDarkMode ? 'text-red-400' : 'text-red-600'
  };

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // Carregar dados do usuário
  useEffect(() => {
    async function getUser() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: perfilData, error: perfilError } = await supabase
            .from('perfis')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (perfilError && perfilError.code !== 'PGRST116') {
            console.error('Erro ao buscar perfil do usuário:', perfilError);
          } else if (perfilData) {
            setPerfil(perfilData);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
      } finally {
        setLoading(false);
      }
    }

    getUser();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${themeClasses.background}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className={`p-8 ${themeClasses.background} min-h-screen`}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className={`text-4xl font-bold ${themeClasses.text} mb-2`}>Meu Perfil</h1>
            <p className={`${themeClasses.textSecondary} text-lg`}>Informações básicas da sua conta</p>
          </div>
          
          <div className={`${themeClasses.card} p-8 rounded-2xl`}>
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                  {perfil?.nome_completo ? (
                    <span className="text-4xl font-bold text-white">
                      {perfil.nome_completo.split(' ').map(name => name.charAt(0).toUpperCase()).join('').substring(0, 2)}
                    </span>
                  ) : (
                    <UserIcon className="h-16 w-16 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-green-500 p-2 rounded-full border-2 border-white shadow-md">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
            
            <h2 className={`text-2xl font-bold text-center ${themeClasses.text} mb-8 pb-4 border-b ${getThemeClass(isDarkMode, 'border')}`}>
              Informações do Perfil
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Nome */}
              <div className={`${themeClasses.card} p-6 rounded-xl transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full mr-4 shadow-inner">
                    <UserIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Nome</p>
                    <p className={`font-semibold text-xl ${themeClasses.text}`}>{perfil?.nome_completo || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className={`${themeClasses.card} p-6 rounded-xl transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full mr-4 shadow-inner">
                    <Mail className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Email</p>
                    <p className={`font-semibold text-xl ${themeClasses.text}`}>{user?.email || 'Não informado'}</p>
                  </div>
                </div>
              </div>

              {/* Sexo */}
              <div className={`${themeClasses.card} p-6 rounded-xl transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full mr-4 shadow-inner">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Sexo</p>
                    <p className={`font-semibold text-xl ${themeClasses.text}`}>
                      {perfil?.sexo ? (perfil.sexo.charAt(0).toUpperCase() + perfil.sexo.slice(1)) : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data de Cadastro */}
              <div className={`${themeClasses.card} p-6 rounded-xl transition-all duration-300 hover:shadow-md transform hover:-translate-y-1`}>
                <div className="flex items-center">
                  <div className="bg-orange-100 p-3 rounded-full mr-4 shadow-inner">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">Data de Cadastro</p>
                    <p className={`font-semibold text-xl ${themeClasses.text}`}>
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
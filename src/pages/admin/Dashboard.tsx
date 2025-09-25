import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Shield, Users, BarChart3, Settings, FileText, Database, AlertTriangle, TrendingUp, Activity, Clock, LogOut, Phone, Brain } from 'lucide-react';
import { ClientesList } from '../../components/ClientesList';
import { TelefonesAutorizados } from '../../components/TelefonesAutorizados';
import { AnaliseCorporalQueue } from '../../components/shared/AnaliseCorporalQueue';
import { useAuth } from '../../contexts/AuthContext';

interface Perfil {
  nome_completo?: string;
  role?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user: authUser, userProfile, isAuthenticated, hasRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'telefones' | 'analises'>('usuarios');
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    usuariosAtivos: 0,
    analisesHoje: 0,
    analisesPendentes: 0,
    analisesCorporais: 0,
    sistemaStatus: 'online'
  });

  // Verificação adicional de segurança - verificar se usuário tem permissão admin
  useEffect(() => {
    if (!isAuthenticated || !userProfile || !hasRole(['admin'])) {
      console.log('Admin Dashboard: Acesso negado, redirecionando para /staff');
      navigate('/staff');
      return;
    }
  }, [isAuthenticated, userProfile, hasRole, navigate]);

  const handleClienteSelect = (cliente: any) => {
    console.log('Cliente selecionado:', cliente);
    // Aqui você pode adicionar ações específicas quando um cliente é selecionado
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do admin
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('nome_completo, role')
            .eq('user_id', user.id)
            .single();
          
          setPerfil(perfilData);
          
          // Buscar estatísticas do sistema
          const { count: totalUsuarios } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true });
          
          const { count: usuariosAtivos } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('liberado', 'sim');
          
          const { count: analisesHoje } = await supabase
            .from('analises_medicamentos')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);

          const { count: analisesPendentes } = await supabase
            .from('analises_medicamentos')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE');
          
          const { count: analisesCorporais } = await supabase
            .from('medidas_corporais')
            .select('*', { count: 'exact', head: true });
          
          setStats({
            totalUsuarios: totalUsuarios || 0,
            usuariosAtivos: usuariosAtivos || 0,
            analisesHoje: analisesHoje || 0,
            analisesPendentes: analisesPendentes || 0,
            analisesCorporais: analisesCorporais || 0,
            sistemaStatus: 'online'
          });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const getNomeAdmin = () => {
    if (userProfile?.nome_completo) {
      return userProfile.nome_completo.split(' ')[0];
    }
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return authUser?.email?.split('@')[0] || user?.email?.split('@')[0] || 'Admin';
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/staff');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Admin */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-slate-700 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                  Bem-vindo, {getNomeAdmin()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Online</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-none mx-auto">
          
          {/* Status Info */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-slate-600">Sistema Online</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                Última atualização: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Total Usuários</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.totalUsuarios}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm text-green-600">+12%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Ativos</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.usuariosAtivos}</p>
                </div>
                <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm text-green-600">+8%</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Análises Hoje</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.analisesHoje}</p>
                </div>
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500 mr-1" />
                <span className="text-xs sm:text-sm text-slate-600">24h</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-slate-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Pendentes</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.analisesPendentes}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 mr-1" />
                <span className="text-xs sm:text-sm text-amber-600 truncate">Atenção</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-4 sm:mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('usuarios')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'usuarios'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Gerenciamento de Usuários</span>
                    <span className="sm:hidden">Usuários</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('telefones')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'telefones'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Telefones Autorizados</span>
                    <span className="sm:hidden">Telefones</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analises')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'analises'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Análises Corporais</span>
                    <span className="sm:hidden">Análises</span>
                    {stats.analisesCorporais > 0 && (
                      <span className="ml-1 sm:ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                        {stats.analisesCorporais}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="w-full">
            {activeTab === 'usuarios' && (
              <ClientesList onClienteSelect={handleClienteSelect} />
            )}
            
            {activeTab === 'telefones' && (
              <TelefonesAutorizados />
            )}
            
            {activeTab === 'analises' && (
              <AnaliseCorporalQueue userRole="admin" />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
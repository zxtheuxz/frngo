import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Apple, Users, FileCheck, TrendingUp, Clock, BarChart3, AlertCircle, CheckCircle, Activity, Calendar, LogOut, Salad, ChefHat, Brain } from 'lucide-react';
import { AvaliacoesNutricionaisQueue } from '../../components/nutricionista/AvaliacoesNutricionaisQueue';
import { AnaliseCorporalQueue } from '../../components/shared/AnaliseCorporalQueue';

interface Perfil {
  nome_completo?: string;
  role?: string;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [activeTab, setActiveTab] = useState<'masculino' | 'feminino' | 'analise_corporal'>('masculino');
  const [stats, setStats] = useState({
    clientesAtivos: 0,
    avaliacoesMasculinoPendentes: 0,
    avaliacoesFemininoPendentes: 0,
    analisesCorporaisPendentes: 0,
    avaliacoesHoje: 0,
    taxaAdesao: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar perfil do nutricionista
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('nome_completo, role')
            .eq('user_id', user.id)
            .single();
          
          setPerfil(perfilData);
          
          // Buscar estatísticas dos clientes
          const { count: clientesAtivos } = await supabase
            .from('perfis')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'cliente')
            .eq('liberado', 'sim');
          
          const { count: avaliacoesMasculino } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE')
            .eq('tipo_avaliacao', 'masculino');
          
          const { count: avaliacoesFeminino } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDENTE')
            .eq('tipo_avaliacao', 'feminino');
          
          const { count: avaliacoesHoje } = await supabase
            .from('aprovacoes_nutricionais')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);
          
          const { count: analisesCorporais } = await supabase
            .from('medidas_corporais')
            .select('*', { count: 'exact', head: true });
          
          setStats({
            clientesAtivos: clientesAtivos || 0,
            avaliacoesMasculinoPendentes: avaliacoesMasculino || 0,
            avaliacoesFemininoPendentes: avaliacoesFeminino || 0,
            analisesCorporaisPendentes: analisesCorporais || 0,
            avaliacoesHoje: avaliacoesHoje || 0,
            taxaAdesao: 87 // Valor fixo para demonstração
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

  const getNomeNutricionista = () => {
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'Nutricionista';
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
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-50">
      {/* Header Nutricionista */}
      <header className="bg-white shadow-sm border-b border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  Dashboard Nutricional
                </h1>
                <p className="text-sm text-slate-600 mt-0.5">
                  Bem-vindo, {getNomeNutricionista()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Ativo</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Status Info */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-slate-600">Status: Ativo</span>
              <span className="text-sm text-slate-400 ml-2 hidden sm:inline">
                Última atualização: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-amber-200 p-4 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 truncate">Clientes Ativos</p>
                  <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.clientesAtivos}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 truncate">+8% mês</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-blue-200 p-4 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 truncate">Aval. Masculino</p>
                  <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.avaliacoesMasculinoPendentes}</p>
                </div>
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">Pendentes</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-pink-200 p-4 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 truncate">Aval. Feminino</p>
                  <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.avaliacoesFemininoPendentes}</p>
                </div>
                <Salad className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-pink-500 mr-1" />
                <span className="text-sm text-pink-600">Pendentes</span>
              </div>
            </div>


            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-green-200 p-4 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-600 truncate">Taxa Adesão</p>
                  <p className="text-2xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.taxaAdesao}%</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 truncate">Ótimo</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-hide px-1">
                <button
                  onClick={() => setActiveTab('masculino')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap min-w-max ${
                    activeTab === 'masculino'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4" />
                    <span className="hidden sm:inline">Avaliações Masculino</span>
                    <span className="sm:hidden">Masculino</span>
                    {stats.avaliacoesMasculinoPendentes > 0 && (
                      <span className="ml-2 bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {stats.avaliacoesMasculinoPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('feminino')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap min-w-max ${
                    activeTab === 'feminino'
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Salad className="w-4 h-4" />
                    <span className="hidden sm:inline">Avaliações Feminino</span>
                    <span className="sm:hidden">Feminino</span>
                    {stats.avaliacoesFemininoPendentes > 0 && (
                      <span className="ml-2 bg-pink-100 text-pink-600 text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {stats.avaliacoesFemininoPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analise_corporal')}
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap min-w-max ${
                    activeTab === 'analise_corporal'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    <span className="hidden sm:inline">Análise Corporal</span>
                    <span className="sm:hidden">Corporal</span>
                    {stats.analisesCorporaisPendentes > 0 && (
                      <span className="ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {stats.analisesCorporaisPendentes}
                      </span>
                    )}
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full">
            {activeTab === 'analise_corporal' ? (
              <AnaliseCorporalQueue userRole="nutricionista" />
            ) : (
              <AvaliacoesNutricionaisQueue tipoAvaliacao={activeTab} />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Target, Users, FileCheck, TrendingUp, Clock, BarChart3, AlertCircle, CheckCircle, Activity, Calendar, LogOut, Pill, Dumbbell, Brain } from 'lucide-react';
import { AnalisesQueue } from '../../components/AnalisesQueue';
import { AvaliacoesFisicasQueue } from '../../components/preparador/AvaliacoesFisicasQueue';
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
  const [activeTab, setActiveTab] = useState<'medicamentos' | 'fisicas' | 'analise_corporal'>('fisicas');
  const [stats, setStats] = useState({
    clientesAtivos: 0,
    avaliacoesPendentes: 0,
    avaliacoesFisicasPendentes: 0,
    analisesCorporaisPendentes: 0,
    programacoesHoje: 0,
    taxaSucesso: 0
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Buscar usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          // Buscar todas as informações em paralelo com Promise.allSettled
          const results = await Promise.allSettled([
            // Perfil do preparador
            supabase
              .from('perfis')
              .select('nome_completo, role')
              .eq('user_id', user.id)
              .single(),
            
            // Clientes ativos
            supabase
              .from('perfis')
              .select('*', { count: 'exact', head: true })
              .eq('role', 'cliente')
              .eq('liberado', 'sim'),
            
            // Avaliações médicas pendentes
            supabase
              .from('analises_medicamentos')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'PENDENTE'),
            
            // Avaliações físicas pendentes
            supabase
              .from('aprovacoes_fisicas')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'PENDENTE'),
            
            // Análises corporais disponíveis (usuários com fotos e formulários preenchidos)
            supabase
              .from('medidas_corporais')
              .select('*', { count: 'exact', head: true }),
            
            // Programações de hoje
            supabase
              .from('avaliacao_fisica')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', new Date().toISOString().split('T')[0])
          ]);
          
          // Processar resultados com tratamento de erros individual
          const [perfilResult, clientesResult, avaliacoesResult, fisicasResult, corporaisResult, programacoesResult] = results;
          
          if (perfilResult.status === 'fulfilled' && perfilResult.value.data) {
            setPerfil(perfilResult.value.data);
          }
          
          setStats({
            clientesAtivos: clientesResult.status === 'fulfilled' ? (clientesResult.value.count || 0) : 0,
            avaliacoesPendentes: avaliacoesResult.status === 'fulfilled' ? (avaliacoesResult.value.count || 0) : 0,
            avaliacoesFisicasPendentes: fisicasResult.status === 'fulfilled' ? (fisicasResult.value.count || 0) : 0,
            analisesCorporaisPendentes: corporaisResult.status === 'fulfilled' ? (corporaisResult.value.count || 0) : 0,
            programacoesHoje: programacoesResult.status === 'fulfilled' ? (programacoesResult.value.count || 0) : 0,
            taxaSucesso: 92 // Valor fixo para demonstração
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

  const getNomePreparador = () => {
    if (perfil?.nome_completo) {
      return perfil.nome_completo.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'Preparador';
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
      <div className="flex items-center justify-center min-h-screen bg-green-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header Preparador */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-teal-700 rounded-xl flex items-center justify-center mr-2 sm:mr-3">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-slate-900">
                  Preparador Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">
                  Bem-vindo, {getNomePreparador()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-slate-600">Ativo</span>
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
        <div className="max-w-7xl mx-auto">
          
          {/* Status Info */}
          <div className="mb-4 sm:mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
              <span className="text-xs sm:text-sm text-slate-600">Status: Ativo</span>
              <span className="text-xs text-slate-400 ml-2 hidden sm:inline">
                Última atualização: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-green-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Clientes Ativos</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.clientesAtivos}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm text-green-600 truncate">+5% semana</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-orange-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Aval. Físicas</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.avaliacoesFisicasPendentes}</p>
                </div>
                <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 mr-1" />
                <span className="text-xs sm:text-sm text-orange-600 truncate">Aguardando</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-purple-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Análises Médicas</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.avaliacoesPendentes}</p>
                </div>
                <Pill className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 mr-1" />
                <span className="text-xs sm:text-sm text-purple-600 truncate">Documentos</span>
              </div>
            </div>


            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-indigo-200 p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Program. Hoje</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.programacoesHoje}</p>
                </div>
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 mr-1" />
                <span className="text-xs sm:text-sm text-indigo-600">Meta: 8/dia</span>
              </div>
            </div>

            <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-teal-200 p-3 sm:p-4 lg:p-6 col-span-2 sm:col-span-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Taxa Sucesso</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mt-1">{stats.taxaSucesso}%</p>
                </div>
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 mt-2 sm:mt-0" />
              </div>
              <div className="mt-2 sm:mt-4 flex items-center">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-1" />
                <span className="text-xs sm:text-sm text-green-600">Excelente</span>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mb-4 sm:mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setActiveTab('fisicas')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'fisicas'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Avaliações Físicas</span>
                    <span className="sm:hidden">Físicas</span>
                    {stats.avaliacoesFisicasPendentes > 0 && (
                      <span className="ml-1 sm:ml-2 bg-orange-100 text-orange-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                        {stats.avaliacoesFisicasPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('medicamentos')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'medicamentos'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Pill className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Análises Médicas</span>
                    <span className="sm:hidden">Médicas</span>
                    {stats.avaliacoesPendentes > 0 && (
                      <span className="ml-1 sm:ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
                        {stats.avaliacoesPendentes}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('analise_corporal')}
                  className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'analise_corporal'
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Análise Corporal</span>
                    <span className="sm:hidden">Corporal</span>
                    {stats.analisesCorporaisPendentes > 0 && (
                      <span className="ml-1 sm:ml-2 bg-purple-100 text-purple-600 text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full">
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
              <AnaliseCorporalQueue userRole="preparador" />
            ) : activeTab === 'fisicas' ? (
              <AvaliacoesFisicasQueue />
            ) : (
              <AnalisesQueue />
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
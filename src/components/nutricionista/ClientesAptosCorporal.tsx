import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { normalizarAltura } from '../../utils/normalizarAltura';
import { 
  User, 
  Brain, 
  Camera, 
  Ruler, 
  Scale, 
  AlertCircle,
  Loader2,
  CheckCircle,
  Calendar,
  Activity,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClienteApto {
  user_id: string;
  nome_completo: string;
  sexo: string;
  foto_lateral_url: string;
  foto_abertura_url: string;
  altura: number;
  peso: number;
  data_avaliacao: string;
  tipo_avaliacao: 'masculino' | 'feminino';
}

export function ClientesAptosCorporal() {
  const navigate = useNavigate();
  const [clientesAptos, setClientesAptos] = useState<ClienteApto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buscarClientesAptos();
  }, []);

  const buscarClientesAptos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar perfis com fotos
      const { data: perfisComFotos, error: errorPerfis } = await supabase
        .from('perfis')
        .select('user_id, nome_completo, sexo, foto_lateral_url, foto_abertura_url')
        .not('foto_lateral_url', 'is', null)
        .not('foto_abertura_url', 'is', null);

      if (errorPerfis) throw errorPerfis;

      const userIdsComFotos = perfisComFotos?.map(p => p.user_id) || [];

      // Buscar clientes com formulário masculino
      const { data: clientesMasc, error: errorMasc } = await supabase
        .from('avaliacao_nutricional')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      // Buscar clientes com formulário feminino
      const { data: clientesFem, error: errorFem } = await supabase
        .from('avaliacao_nutricional_feminino')
        .select('user_id, altura, peso, created_at')
        .in('user_id', userIdsComFotos)
        .order('created_at', { ascending: false });

      if (errorMasc) throw errorMasc;
      if (errorFem) throw errorFem;

      // Criar map de perfis para acesso rápido
      const perfisMap = new Map(perfisComFotos?.map(p => [p.user_id, p]) || []);

      // Combinar e formatar os dados
      const todosClientes: ClienteApto[] = [];

      if (clientesMasc) {
        clientesMasc.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'masculino'
            });
          }
        });
      }

      if (clientesFem) {
        clientesFem.forEach(cliente => {
          const perfil = perfisMap.get(cliente.user_id);
          if (perfil) {
            // Usa a função para normalizar altura para metros
            const alturaEmMetros = normalizarAltura(cliente.altura);
            
            todosClientes.push({
              user_id: cliente.user_id,
              nome_completo: perfil.nome_completo,
              sexo: perfil.sexo,
              foto_lateral_url: perfil.foto_lateral_url,
              foto_abertura_url: perfil.foto_abertura_url,
              altura: alturaEmMetros,
              peso: cliente.peso,
              data_avaliacao: cliente.created_at,
              tipo_avaliacao: 'feminino'
            });
          }
        });
      }

      // Remover duplicatas (caso tenha preenchido ambos os formulários)
      const clientesUnicos = todosClientes.reduce((acc, atual) => {
        const existe = acc.find(c => c.user_id === atual.user_id);
        if (!existe || new Date(atual.data_avaliacao) > new Date(existe.data_avaliacao)) {
          return [...acc.filter(c => c.user_id !== atual.user_id), atual];
        }
        return acc;
      }, [] as ClienteApto[]);

      // Verificar quais já têm análise corporal gerada
      const userIds = clientesUnicos.map(c => c.user_id);
      const { data: analisesExistentes } = await supabase
        .from('medidas_corporais')
        .select('user_id')
        .in('user_id', userIds);

      const idsComAnalise = new Set(analisesExistentes?.map(a => a.user_id) || []);
      const clientesSemAnalise = clientesUnicos.filter(c => !idsComAnalise.has(c.user_id));

      setClientesAptos(clientesSemAnalise);
    } catch (error) {
      console.error('Erro ao buscar clientes aptos:', error);
      setError('Erro ao carregar clientes aptos para análise corporal');
    } finally {
      setLoading(false);
    }
  };

  const handleGerarAnalise = () => {
    // Redirecionar para o sistema unificado
    navigate('/nutricionista/dashboard');
    
    // Aguardar um pouco para garantir que a página carregou
    setTimeout(() => {
      // Simular clique na aba de análise corporal
      const tabs = document.querySelectorAll('button[data-tab]');
      tabs.forEach(tab => {
        if (tab.textContent?.includes('Análise Corporal') || tab.textContent?.includes('Corporal')) {
          (tab as HTMLButtonElement).click();
        }
      });
    }, 500);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-slate-600">Carregando clientes aptos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-red-800">Erro ao carregar dados</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientesAptos.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Todos os clientes já foram analisados</h3>
        <p className="text-slate-600">Não há clientes pendentes para análise corporal no momento.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Clientes Aptos para Análise Corporal</h3>
          <p className="text-sm text-slate-600">
            Clientes com fotos e formulário nutricional preenchidos, prontos para gerar análise corporal
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>{clientesAptos.length} clientes disponíveis</span>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="grid gap-4">
          {clientesAptos.map((cliente) => (
            <div
              key={cliente.user_id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Informações do cliente */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{cliente.nome_completo}</h4>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span className="capitalize">{cliente.sexo}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Avaliação: {formatDate(cliente.data_avaliacao)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Dados disponíveis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-slate-600">Fotos OK</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-slate-600">{(cliente.altura * 100).toFixed(0)} cm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-purple-600" />
                      <span className="text-sm text-slate-600">{cliente.peso.toFixed(1)} kg</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-slate-600">Formulário {cliente.tipo_avaliacao}</span>
                    </div>
                  </div>
                </div>

                {/* Botão de ação */}
                <div className="ml-4">
                  <button
                    onClick={handleGerarAnalise}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ir para Sistema Unificado
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Info sobre sistema unificado */}
        <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 mb-1">Sistema Unificado de Análise Corporal</h4>
              <p className="text-sm text-purple-700">
                Todas as análises corporais agora são processadas através do sistema unificado na aba "Análise Corporal" do dashboard principal.
                Clique no botão roxo para ser redirecionado automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
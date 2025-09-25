import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedFormRouteProps {
  component: React.ComponentType<any>;
  formType: 'fisica' | 'nutricional';
}

export function ProtectedFormRoute({ component: Component, formType }: ProtectedFormRouteProps) {
  const [loading, setLoading] = useState(true);
  const [formJaPreenchido, setFormJaPreenchido] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function verificarFormulario() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('Usuário não autenticado, redirecionando para login');
          navigate('/login');
          return;
        }

        console.log(`Verificando se o usuário ${user.id} já preencheu o formulário de ${formType}`);
        
        // Verificação para avaliacao_fisica
        if (formType === 'fisica') {
          // Primeiro, tenta buscar diretamente
          const { data: avaliacaoFisica, error: errorFisica } = await supabase
            .from('avaliacao_fisica')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (errorFisica) {
            console.error('Erro ao verificar avaliação física:', errorFisica);
          }
          
          // Se encontrou um registro, o formulário já foi preenchido
          if (avaliacaoFisica) {
            console.log('Avaliação física encontrada:', avaliacaoFisica);
            setFormJaPreenchido(true);
            setLoading(false);
            return;
          }
          
          // Verificação adicional com contagem
          const { count, error: countError } = await supabase
            .from('avaliacao_fisica')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (countError) {
            console.error('Erro ao contar avaliações físicas:', countError);
          } else {
            console.log(`Contagem de avaliações físicas para ${user.id}:`, count);
            setFormJaPreenchido(count !== null && count > 0);
          }
        } 
        // Verificação para avaliações nutricionais
        else if (formType === 'nutricional') {
          // Buscar perfil para verificar o sexo
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('sexo')
            .eq('user_id', user.id)
            .single();
            
          const sexo = perfilData?.sexo;
          console.log(`Sexo do usuário: ${sexo}`);
          
          let temAvaliacao = false;
          
          // Verificar na tabela avaliacao_nutricional
          const { data: avaliacaoNutricional, error: errorNutricional } = await supabase
            .from('avaliacao_nutricional')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (errorNutricional) {
            console.error('Erro ao verificar avaliação nutricional:', errorNutricional);
          }
          
          // Se encontrou um registro, o formulário já foi preenchido
          if (avaliacaoNutricional) {
            console.log('Avaliação nutricional encontrada:', avaliacaoNutricional);
            temAvaliacao = true;
          }
          
          // Se for feminino, verificar também na tabela específica
          if (sexo === 'feminino') {
            const { data: avaliacaoFeminina, error: errorFeminina } = await supabase
              .from('avaliacao_nutricional_feminino')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (errorFeminina) {
              console.error('Erro ao verificar avaliação nutricional feminina:', errorFeminina);
            }
            
            if (avaliacaoFeminina) {
              console.log('Avaliação nutricional feminina encontrada:', avaliacaoFeminina);
              temAvaliacao = true;
            }
          }
          
          setFormJaPreenchido(temAvaliacao);
          if (temAvaliacao) {
            setLoading(false);
            return;
          }
          
          // Verificação adicional com contagem
          let countTotal = 0;
          
          // Contar na tabela principal
          const { count: countNutri, error: countError } = await supabase
            .from('avaliacao_nutricional')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (countError) {
            console.error('Erro ao contar avaliações nutricionais:', countError);
          } else {
            countTotal += countNutri || 0;
          }
          
          // Se for feminino, contar também na tabela específica
          if (sexo === 'feminino') {
            const { count: countFem, error: countFemError } = await supabase
              .from('avaliacao_nutricional_feminino')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            if (countFemError) {
              console.error('Erro ao contar avaliações nutricionais femininas:', countFemError);
            } else {
              countTotal += countFem || 0;
            }
          }
          
          console.log(`Contagem total de avaliações nutricionais para ${user.id}:`, countTotal);
          setFormJaPreenchido(countTotal > 0);
        }
      } catch (error) {
        console.error('Erro ao verificar formulário:', error);
      } finally {
        setLoading(false);
      }
    }

    verificarFormulario();
  }, [formType, navigate]);

  if (loading) {
    console.log('ProtectedFormRoute: Carregando...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (formJaPreenchido) {
    console.log('ProtectedFormRoute: Formulário já preenchido, mostrando mensagem');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="bg-yellow-100 rounded-full p-4 mx-auto w-16 h-16 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Formulário já preenchido</h2>
          <p className="text-gray-600 mb-6">
            Você já preencheu este formulário e não é possível atualizá-lo. 
            Seus resultados estão disponíveis na aba Resultados do Dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  console.log('ProtectedFormRoute: Renderizando componente', formType);
  try {
    return <Component />;
  } catch (error) {
    console.error('Erro ao renderizar componente:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Erro ao carregar formulário</h2>
          <p className="text-gray-600 mb-6">
            Ocorreu um erro ao carregar o formulário. Por favor, tente novamente mais tarde.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }
} 
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  ResultadoAnalise, 
  interpretarResultados,
  classificarQuadril,
  classificarCintura,
  classificarIndiceMassaMagra,
  classificarIndiceMassaGorda,
  classificarRazaoCinturaQuadril,
  classificarRazaoCinturaEstatura,
  classificarIndiceConicidade,
  analisarComposicaoCorporal
} from '../../utils/calculosComposicaoCorporal';
import { Activity, TrendingUp, Scale, Zap, AlertCircle, Calendar, Target, Heart, Ruler, Edit3, Save, X, Loader2 } from 'lucide-react';
import EscalaRisco from './EscalaRisco';
import EscalaRiscoLimpa from './EscalaRiscoLimpa';
import LegendaCores from './LegendaCores';
import GraficoPizzaComposicao from './GraficoPizzaComposicao';
import AvatarMedidas from './AvatarMedidas';
import GraficoDispersao from './GraficoDispersao';
import GridIndicadores from './GridIndicadores';
import TabelaReferencias from './TabelaReferencias';
import LoadingAnalise from './LoadingAnalise';

interface ResultadosAnaliseProps {
  resultado?: ResultadoAnalise | null;
}

interface MedidaSalva {
  id: string;
  medida_bracos: number;
  medida_antebracos: number;
  medida_cintura: number;
  medida_quadril: number;
  medida_coxas: number;
  medida_panturrilhas: number;
  percentual_gordura: number;
  massa_magra: number;
  massa_gorda: number;
  tmb: number;
  imc: number;
  razao_cintura_quadril: number;
  razao_cintura_estatura: number;
  indice_conicidade: number;
  shaped_score: number;
  altura_usada: number;
  peso_usado: number;
  idade_calculada: number;
  sexo_usado: string;
  created_at: string;
}


const ResultadosAnalise: React.FC<ResultadosAnaliseProps> = ({ resultado }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [medidaSalva, setMedidaSalva] = useState<MedidaSalva | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para edição de altura e peso
  const [editando, setEditando] = useState(false);
  const [novaAltura, setNovaAltura] = useState('');
  const [novoPeso, setNovoPeso] = useState('');
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [dadosAtualizados, setDadosAtualizados] = useState<ResultadoAnalise | null>(null);

  useEffect(() => {
    if (!resultado && user?.id) {
      buscarUltimaMedida();
    }
  }, [resultado, user?.id]);

  const buscarUltimaMedida = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('medidas_corporais')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        // Tratar especificamente erro 406 que é comum quando não há dados
        if (error.code === '406' || error.code === 'PGRST116') {
          console.log('📊 Usuário ainda não possui medidas corporais (erro 406)');
          return;
        }
        
        console.error('Erro ao buscar medida:', error);
        return;
      }

      // Se não há dados, usuário não tem medidas corporais ainda
      if (!data || data.length === 0) {
        console.log('📊 Usuário ainda não possui medidas corporais');
        return;
      }

      setMedidaSalva(data[0]); // Pegar o primeiro (e único) resultado
    } catch (error) {
      console.error('Erro ao buscar medida:', error);
    } finally {
      setLoading(false);
    }
  };

  // Funções para edição de altura e peso
  const iniciarEdicao = () => {
    const dadosAtivos = dadosAtualizados || dados;
    if (dadosAtivos) {
      setNovaAltura(dadosAtivos.perfil.altura.toFixed(2));
      setNovoPeso(dadosAtivos.perfil.peso.toString());
      setEditando(true);
    }
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setNovaAltura('');
    setNovoPeso('');
  };

  const validarValores = (altura: number, peso: number): string | null => {
    if (altura < 1.0 || altura > 2.5) {
      return 'Altura deve estar entre 1,0m e 2,5m';
    }
    if (peso < 30 || peso > 300) {
      return 'Peso deve estar entre 30kg e 300kg';
    }
    return null;
  };

  const salvarEdicao = async () => {
    if (!user?.id || !medidaSalva) return;

    const alturaNum = parseFloat(novaAltura.replace(',', '.'));
    const pesoNum = parseFloat(novoPeso.replace(',', '.'));

    const erro = validarValores(alturaNum, pesoNum);
    if (erro) {
      alert(erro);
      return;
    }

    setSalvandoEdicao(true);
    
    try {
      // 1. Deletar medida atual
      const { error: deleteError } = await supabase
        .from('medidas_corporais')
        .delete()
        .eq('id', medidaSalva.id);

      if (deleteError) {
        console.error('Erro ao deletar medida:', deleteError);
        alert('Erro ao deletar medida anterior');
        return;
      }

      // 2. Recalcular com novos valores
      const perfilAtualizado = {
        altura: alturaNum,
        peso: pesoNum,
        idade: medidaSalva.idade_calculada,
        sexo: medidaSalva.sexo_usado as 'M' | 'F'
      };

      const medidasOriginais = {
        bracos: medidaSalva.medida_bracos,
        antebracos: medidaSalva.medida_antebracos,
        cintura: medidaSalva.medida_cintura,
        quadril: medidaSalva.medida_quadril,
        coxas: medidaSalva.medida_coxas,
        panturrilhas: medidaSalva.medida_panturrilhas
      };

      const novoResultado = analisarComposicaoCorporal(medidasOriginais, perfilAtualizado);

      // 3. Salvar nova medida
      const { data: novaMedida, error: insertError } = await supabase
        .from('medidas_corporais')
        .insert([{
          user_id: user.id,
          medida_bracos: novoResultado.medidas.bracos,
          medida_antebracos: novoResultado.medidas.antebracos,
          medida_cintura: novoResultado.medidas.cintura,
          medida_quadril: novoResultado.medidas.quadril,
          medida_coxas: novoResultado.medidas.coxas,
          medida_panturrilhas: novoResultado.medidas.panturrilhas,
          percentual_gordura: novoResultado.composicao.percentualGordura,
          massa_magra: novoResultado.composicao.massaMagra,
          massa_gorda: novoResultado.composicao.massaGorda,
          tmb: novoResultado.composicao.tmb,
          imc: novoResultado.composicao.imc,
          razao_cintura_quadril: novoResultado.indices.razaoCinturaQuadril.valor,
          razao_cintura_estatura: novoResultado.indices.razaoCinturaEstatura.valor,
          indice_conicidade: novoResultado.indices.indiceConicidade.valor,
          shaped_score: novoResultado.indices.indiceGrimaldi,
          altura_usada: alturaNum,
          peso_usado: pesoNum,
          idade_calculada: perfilAtualizado.idade,
          sexo_usado: perfilAtualizado.sexo
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao salvar nova medida:', insertError);
        alert('Erro ao salvar nova medida');
        return;
      }

      // 4. Atualizar estados
      setMedidaSalva(novaMedida);
      setDadosAtualizados(novoResultado);
      setEditando(false);
      setNovaAltura('');
      setNovoPeso('');

    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro inesperado ao salvar edição');
    } finally {
      setSalvandoEdicao(false);
    }
  };

  // Loading agora é controlado pelo componente pai MedidasCorporais
  // if (loading) {
  //   return <LoadingAnalise step="loading_results" isDarkMode={isDarkMode} />;
  // }

  const dados = dadosAtualizados || resultado || (medidaSalva ? {
    composicao: {
      percentualGordura: medidaSalva.percentual_gordura || 0,
      massaGorda: medidaSalva.massa_gorda || 0,
      massaMagra: medidaSalva.massa_magra || 0,
      tmb: medidaSalva.tmb || 0,
      imc: medidaSalva.imc || 0,
      aguaCorporal: (medidaSalva.massa_magra || 0) * 0.723,
      aguaCorporalPercentual: medidaSalva.peso_usado > 0 ? ((medidaSalva.massa_magra || 0) * 0.723 / medidaSalva.peso_usado) * 100 : 0
    },
    indices: {
      indiceGrimaldi: medidaSalva.shaped_score || 0, // Renomeado de shapedScore para indiceGrimaldi
      // Usar funções de classificação corretas baseadas nos valores salvos
      razaoCinturaQuadril: classificarRazaoCinturaQuadril(medidaSalva.razao_cintura_quadril || 0, medidaSalva.sexo_usado as 'M' | 'F' || 'M'),
      razaoCinturaEstatura: classificarRazaoCinturaEstatura(medidaSalva.razao_cintura_estatura || 0),
      indiceConicidade: classificarIndiceConicidade(medidaSalva.indice_conicidade || 0),
      indiceMassaMagra: classificarIndiceMassaMagra(
        medidaSalva.altura_usada > 0 ? (medidaSalva.massa_magra || 0) / Math.pow(medidaSalva.altura_usada, 2) : 0,
        medidaSalva.sexo_usado as 'M' | 'F' || 'M'
      ),
      indiceMassaGorda: classificarIndiceMassaGorda(
        medidaSalva.altura_usada > 0 ? (medidaSalva.massa_gorda || 0) / Math.pow(medidaSalva.altura_usada, 2) : 0
      ),
      cintura: classificarCintura(medidaSalva.medida_cintura || 0, medidaSalva.sexo_usado as 'M' | 'F' || 'M'),
      quadril: classificarQuadril(medidaSalva.medida_quadril || 0, medidaSalva.sexo_usado as 'M' | 'F' || 'M')
    },
    medidas: {
      bracos: medidaSalva.medida_bracos || 0,
      antebracos: medidaSalva.medida_antebracos || 0,
      cintura: medidaSalva.medida_cintura || 0,
      quadril: medidaSalva.medida_quadril || 0,
      coxas: medidaSalva.medida_coxas || 0,
      panturrilhas: medidaSalva.medida_panturrilhas || 0
    },
    perfil: {
      altura: medidaSalva.altura_usada || 0,
      peso: medidaSalva.peso_usado || 0,
      idade: medidaSalva.idade_calculada || 0,
      sexo: (medidaSalva.sexo_usado || 'M') as 'M' | 'F'
    }
  } : null);


  if (!dados) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Nenhuma análise encontrada
        </p>
      </div>
    );
  }

  const interpretacoes = interpretarResultados(dados);

  // Funções para gerar faixas padronizadas baseadas no documento de referência
  const obterFaixasPercentualGordura = () => [
    { label: 'Atenção', cor: '#22c55e', inicio: 0, fim: 11.1 },
    { label: 'Baixo risco', cor: '#eab308', inicio: 11.1, fim: 18.2 },
    { label: 'Moderado', cor: '#f97316', inicio: 18.2, fim: 21.9 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 21.9, fim: 35 }
  ];

  const obterFaixasCintura = () => [
    { label: 'Baixo risco', cor: '#22c55e', inicio: 0, fim: 94 },
    { label: 'Moderado', cor: '#eab308', inicio: 94, fim: 102 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 102, fim: 200 }
  ];

  const obterFaixasQuadril = () => [
    { label: 'Atenção', cor: '#22c55e', inicio: 0, fim: 97.2 },
    { label: 'Baixo risco', cor: '#eab308', inicio: 97.2, fim: 104.8 },
    { label: 'Moderado', cor: '#f97316', inicio: 104.8, fim: 108.6 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 108.6, fim: 200 }
  ];

  const obterFaixasIMM = () => [
    { label: 'Baixo', cor: '#ef4444', inicio: 0, fim: 17.8 }, // Vermelho - ruim
    { label: 'Adequado', cor: '#22c55e', inicio: 17.8, fim: 22.3 }, // Verde - bom
    { label: 'Alto', cor: '#22c55e', inicio: 22.3, fim: 32 } // Verde também - alto é bom para massa magra
  ];

  const obterFaixasIMG = () => [
    { label: 'Baixo', cor: '#22c55e', inicio: 0, fim: 2.2 }, // Verde - baixa gordura é bom
    { label: 'Adequado', cor: '#eab308', inicio: 2.2, fim: 4.4 }, // Amarelo - moderado
    { label: 'Alto', cor: '#ef4444', inicio: 4.4, fim: 12 } // Vermelho - muita gordura é ruim
  ];

  const obterFaixasRazaoCinturaQuadril = () => [
    { label: 'Adequado', cor: '#22c55e', inicio: 0, fim: 0.9 },
    { label: 'Inadequado', cor: '#ef4444', inicio: 0.9, fim: 1.3 }
  ];

  const obterFaixasRazaoCinturaEstatura = () => [
    { label: 'Baixo risco', cor: '#22c55e', inicio: 0, fim: 0.5 },
    { label: 'Moderado', cor: '#eab308', inicio: 0.5, fim: 0.55 },
    { label: 'Alto risco', cor: '#ef4444', inicio: 0.55, fim: 0.8 }
  ];

  const obterFaixasIndiceConicidade = () => [
    { label: 'Adequado', cor: '#22c55e', inicio: 0, fim: 1.25 },
    { label: 'Inadequado', cor: '#ef4444', inicio: 1.25, fim: 1.8 }
  ];

  return (
    <div className="space-y-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header com opção de edição */}
      <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2 sm:gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center sm:text-left">
            {dados.perfil.sexo === 'M' ? 'Masculino' : 'Feminino'} {dados.perfil.idade} anos
          </h1>

          {/* Campos de altura e peso editáveis */}
          <div className="flex items-center justify-center sm:justify-start gap-2">
            {!editando ? (
              <>
                <span className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {dados.perfil.altura.toFixed(2)} m • {dados.perfil.peso.toFixed(1)} kg
                </span>
                {medidaSalva && (
                  <button
                    onClick={iniciarEdicao}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                    title="Editar altura e peso"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Altura (m):
                    </label>
                    <input
                      type="text"
                      value={novaAltura}
                      onChange={(e) => setNovaAltura(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="1.75"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Peso (kg):
                    </label>
                    <input
                      type="text"
                      value={novoPeso}
                      onChange={(e) => setNovoPeso(e.target.value)}
                      className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="70"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 ml-2">
                  <button
                    onClick={salvarEdicao}
                    disabled={salvandoEdicao}
                    className="p-1 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                    title="Salvar alterações"
                  >
                    {salvandoEdicao ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                  <button
                    onClick={cancelarEdicao}
                    disabled={salvandoEdicao}
                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                    title="Cancelar edição"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Avaliação em: {medidaSalva ? new Date(medidaSalva.created_at).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}
        </p>
        {dadosAtualizados && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
            ✓ Dados atualizados com sucesso
          </p>
        )}
      </div>

      {/* PÁGINA 1 - Composição Corporal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado esquerdo - Gráfico de pizza */}
        <div>
          <GraficoPizzaComposicao composicao={dados.composicao} peso={dados.perfil.peso} />
        </div>

        {/* Lado direito - Indicadores com escalas */}
        <div className="space-y-8">
          {/* IMC */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Índice de massa corporal (IMC): {interpretacoes.imc} ({dados.composicao.imc.toFixed(1)} kg/m²)
            </h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 grid grid-cols-2 gap-2">
              <span>Baixo peso: &lt;18 kg/m²</span>
              <span>Eutrofia: 18 a 24,9 kg/m²</span>
              <span>Sobrepeso: 25 a 29,9 kg/m²</span>
              <span>Obesidade: &gt;30 kg/m²</span>
            </div>
          </div>

          {/* Legenda de cores para esta seção */}
          <LegendaCores />

          {/* TEMPORARIAMENTE REMOVIDO - Percentual de gordura com escala limpa */}
          {/*
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              O percentual de gordura nessa avaliação tem como objetivo classificar risco para doenças cardiometabólicas, portanto não possui fins estéticos.
            </p>

            <EscalaRiscoLimpa
              titulo="Percentual de gordura"
              valorAtual={dados.composicao.percentualGordura}
              unidade="%"
              faixas={obterFaixasPercentualGordura()}
              resultadoTexto={interpretacoes.percentualGordura}
            />
          </div>
          */}

          {/* TEMPORARIAMENTE REMOVIDO - Índices em grid com escalas limpas */}
          {/*
          <div className="grid grid-cols-1 gap-6">
            <EscalaRiscoLimpa
              titulo="Índice de massa magra"
              valorAtual={dados.indices.indiceMassaMagra.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMM()}
              resultadoTexto={dados.indices.indiceMassaMagra.descricao}
              altura="pequena"
            />

            <EscalaRiscoLimpa
              titulo="Índice de massa gorda"
              valorAtual={dados.indices.indiceMassaGorda.valor}
              unidade="kg/m²"
              faixas={obterFaixasIMG()}
              resultadoTexto={dados.indices.indiceMassaGorda.descricao}
              altura="pequena"
            />
          </div>
          */}
        </div>
      </div>

      {/* ESCALAS AVANÇADAS - Indicadores que o Shaped tem */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
          Perímetros e Razões Antropométricas
        </h2>
        
        {/* Legenda de cores universal */}
        <LegendaCores className="mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cintura */}
          <EscalaRiscoLimpa
            titulo="Cintura"
            valorAtual={dados.medidas.cintura}
            unidade="cm"
            faixas={obterFaixasCintura()}
            resultadoTexto={dados.indices.cintura.descricao}
          />

          {/* Quadril */}
          <EscalaRiscoLimpa
            titulo="Quadril"
            valorAtual={dados.medidas.quadril}
            unidade="cm"
            faixas={obterFaixasQuadril()}
            resultadoTexto={dados.indices.quadril.descricao}
          />

          {/* Razão Cintura/Estatura */}
          <EscalaRiscoLimpa
            titulo="Razão cintura/estatura"
            valorAtual={dados.indices.razaoCinturaEstatura.valor}
            faixas={obterFaixasRazaoCinturaEstatura()}
            resultadoTexto={dados.indices.razaoCinturaEstatura.descricao}
          />

          {/* Razão Cintura/Quadril */}
          <EscalaRiscoLimpa
            titulo="Razão cintura/quadril"
            valorAtual={dados.indices.razaoCinturaQuadril.valor}
            faixas={obterFaixasRazaoCinturaQuadril()}
            resultadoTexto={dados.indices.razaoCinturaQuadril.descricao}
          />
        </div>

        {/* Índice de Conicidade com explicação visual */}
        <div className="mt-8">
          <EscalaRiscoLimpa
            titulo="Índice de conicidade"
            valorAtual={dados.indices.indiceConicidade.valor}
            faixas={obterFaixasIndiceConicidade()}
            resultadoTexto={dados.indices.indiceConicidade.descricao}
          />
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Perímetros e suas razões são importantes indicadores de saúde</strong>, ajudando a monitorar e prevenir complicações associadas ao excesso de peso.
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              <strong>Índice de conicidade:</strong> Indica a distribuição de gordura corporal, especialmente abdominal, para avaliar o risco de doenças cardiovasculares. Indivíduo bicôncavo possui menor risco, enquanto o bicônico apresenta risco elevado de complicações.
            </p>
          </div>
        </div>
      </div>

      {/* TEMPORARIAMENTE REMOVIDO - GRID DE INDICADORES - Cards organizados como o Shaped */}
      {/*
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <GridIndicadores dados={dados} />
      </div>
      */}

      {/* PÁGINA 2 - Medidas e Avatar */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lado esquerdo - Avatar com medidas */}
          <div>
            <AvatarMedidas 
              medidas={dados.medidas} 
              userId={user?.id || ''} 
              sexo={dados.perfil.sexo}
            />
          </div>

          {/* TEMPORARIAMENTE REMOVIDO - Lado direito - Gráfico de Dispersão */}
          {/*
          <GraficoDispersao
            indiceMassaMagra={dados.indices.indiceMassaMagra.valor}
            indiceMassaGorda={dados.indices.indiceMassaGorda.valor}
            sexo={dados.perfil.sexo}
          />
          */}
        </div>
        
        {/* Tabela de medidas extraídas - Abaixo dos gráficos */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Medidas Extraídas (cm)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Braços</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.bracos.toFixed(1)} cm</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Antebraços</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.antebracos.toFixed(1)} cm</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Cintura</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.cintura.toFixed(1)} cm</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Quadril</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.quadril.toFixed(1)} cm</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Coxas</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.coxas.toFixed(1)} cm</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-700 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Panturrilhas</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{dados.medidas.panturrilhas.toFixed(1)} cm</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Medidas extraídas automaticamente por análise de imagem
            </div>
          </div>
        </div>
      </div>

      {/* Índice Grimaldi expandido - largura total */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4 text-green-800 dark:text-green-200">
              Índice Grimaldi {dados.indices.indiceGrimaldi}/100
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
                O índice é gerado com base nos indicadores de composição corporal. 
                Quanto maior o índice, melhor a condição física. Utilize-o como complemento à avaliação clínica.
              </p>
              
              {/* Barra de progresso do Índice Grimaldi */}
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 mb-4">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-6 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(dados.indices.indiceGrimaldi, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>0</span>
                  <span className="font-semibold text-green-700 dark:text-green-300">
                    {dados.indices.indiceGrimaldi}
                  </span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TEMPORARIAMENTE REMOVIDO - TABELA DE REFERÊNCIAS - Como o Shaped tem */}
      {/*
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <TabelaReferencias dados={dados} />
      </div>
      */}

      {/* Aviso final igual ao PDF */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
          <strong>Avaliação por fotos</strong><br/>
          Os dados gerados por esta avaliação não têm poder diagnóstico.<br/>
          Eles devem ser interpretados em conjunto com a história clínica do paciente.<br/>
          Poses, vestimentas e a qualidade da imagem podem influenciar os resultados.<br/>
          A avaliação final e a interpretação são de responsabilidade do profissional de saúde.
        </p>
      </div>
    </div>
  );
};

export default ResultadosAnalise;
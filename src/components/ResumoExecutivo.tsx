import React from 'react';
import { AlertTriangle, Target, Heart, Activity, CheckCircle, XCircle, Clock } from 'lucide-react';

interface AvaliacaoFisica {
  id: string;
  sexo: string;
  idade: string;
  objetivo: string;
  tempo_inativo: string;
  experiencia_musculacao: string;
  disponibilidade_semanal: string;
  nivel_experiencia: string;
  tem_laudo_medico: boolean;
  doenca_pre_existente: string;
  sente_dores: boolean;
  usa_medicamentos: boolean;
  doenca_impossibilita: boolean;
  tem_lesao: boolean;
  created_at: string;
}

interface AvaliacaoNutricional {
  id: string;
  peso: number;
  altura: number;
  idade: number;
  nivel_atividade: string;
  objetivo: string;
  restricao_alimentar: string[];
  intolerancia_alimentar: string[];
  suplementacao: string[];
  consumo_agua: number;
  horario_acordar: string;
  horario_dormir: string;
  qtd_refeicoes: number;
  created_at: string;
  // Campos femininos
  nome?: string;
  ciclo_menstrual_regular?: boolean;
  sintomas_tpm?: string[];
  ja_engravidou?: boolean;
  quantidade_gestacoes?: number;
  metodo_contraceptivo?: string;
  nivel_estresse?: number;
  horas_sono?: number;
  pratica_exercicios?: boolean;
  intestino_regular?: boolean;
}

interface Cliente {
  id: string;
  user_id: string;
  nome_completo: string;
  telefone: string;
  sexo: string;
  role: string;
  liberado: string;
  laudo_aprovado: string;
  created_at: string;
  email?: string;
}

interface ResumoExecutivoProps {
  cliente: Cliente;
  avaliacaoFisica: AvaliacaoFisica | null;
  avaliacaoNutricional: AvaliacaoNutricional | null;
}

export function ResumoExecutivo({ cliente, avaliacaoFisica, avaliacaoNutricional }: ResumoExecutivoProps) {
  // Analisar pontos de atenção
  const pontosAtencao = [];
  
  if (avaliacaoFisica) {
    if (avaliacaoFisica.tem_lesao) pontosAtencao.push("Possui lesão");
    if (avaliacaoFisica.usa_medicamentos) pontosAtencao.push("Usa medicamentos");
    if (avaliacaoFisica.sente_dores) pontosAtencao.push("Sente dores");
    if (avaliacaoFisica.doenca_pre_existente && avaliacaoFisica.doenca_pre_existente !== 'nao') {
      pontosAtencao.push("Doença pré-existente");
    }
    if (avaliacaoFisica.doenca_impossibilita) pontosAtencao.push("Doença impossibilita exercícios");
  }

  // Determinar status geral
  const statusGeral = pontosAtencao.length > 0 ? 'atencao' : 'apto';

  // Calcular IMC se disponível
  const calcularIMC = () => {
    if (!avaliacaoNutricional?.peso || !avaliacaoNutricional?.altura) return null;
    const alturaMetros = avaliacaoNutricional.altura < 10 ? avaliacaoNutricional.altura : avaliacaoNutricional.altura / 100;
    const imc = avaliacaoNutricional.peso / (alturaMetros * alturaMetros);
    return imc.toFixed(1);
  };

  const imc = calcularIMC();

  const getIMCStatus = (imc: string) => {
    const value = parseFloat(imc);
    if (value < 18.5) return { status: 'atencao', text: 'Abaixo do peso' };
    if (value < 25) return { status: 'normal', text: 'Peso normal' };
    if (value < 30) return { status: 'atencao', text: 'Sobrepeso' };
    return { status: 'atencao', text: 'Obesidade' };
  };

  const imcStatus = imc ? getIMCStatus(imc) : null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Resumo Executivo</h3>
          <p className="text-sm text-slate-600">Visão geral do perfil do cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Geral */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            {statusGeral === 'apto' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-medium text-slate-900">Status Geral</span>
          </div>
          <div className={`text-sm font-medium px-3 py-1 rounded-full ${
            statusGeral === 'apto' 
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {statusGeral === 'apto' ? 'Apto para treinar' : 'Requer atenção'}
          </div>
        </div>

        {/* Objetivo Principal */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-slate-900">Objetivo</span>
          </div>
          <div className="text-sm text-slate-700">
            {avaliacaoFisica?.objetivo || avaliacaoNutricional?.objetivo || 'Não informado'}
          </div>
        </div>

        {/* IMC */}
        {imc && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-500" />
              <span className="font-medium text-slate-900">IMC</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-slate-900">{imc}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                imcStatus?.status === 'normal' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {imcStatus?.text}
              </span>
            </div>
          </div>
        )}

        {/* Experiência */}
        {avaliacaoFisica?.nivel_experiencia && (
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="font-medium text-slate-900">Experiência</span>
            </div>
            <div className="text-sm text-slate-700 capitalize">
              {avaliacaoFisica.nivel_experiencia.replace('_', ' ')}
            </div>
          </div>
        )}
      </div>

      {/* Pontos de Atenção */}
      {pontosAtencao.length > 0 && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">Pontos de Atenção</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {pontosAtencao.map((ponto, index) => (
              <span 
                key={index}
                className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full border border-yellow-300"
              >
                {ponto}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações Rápidas */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">Recomendações</span>
        </div>
        <div className="text-sm text-blue-700">
          {statusGeral === 'apto' ? (
            <>
              Cliente apto para iniciar programa de treinamento.
              {avaliacaoFisica?.tem_laudo_medico && " Possui laudo médico em dia."}
            </>
          ) : (
            <>
              Avaliar pontos de atenção antes de iniciar treino.
              {!avaliacaoFisica?.tem_laudo_medico && " Recomenda-se avaliação médica."}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
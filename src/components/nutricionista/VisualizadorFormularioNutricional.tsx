import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, FileText, Heart, Activity, Apple, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface FormularioData {
  // Dados básicos
  data_nascimento?: string;
  idade?: number;
  estado_civil?: string;
  tem_filhos?: boolean;
  quantidade_filhos?: number;
  objetivo?: string;
  
  // Medidas
  peso?: number;
  altura?: number;
  peso_habitual?: number;
  variacao_peso_6meses?: string;
  
  // Saúde
  tem_doencas_cronicas?: boolean;
  doencas_cronicas?: string[];
  tem_cirurgias?: boolean;
  cirurgias_anteriores?: string[];
  tem_alergias?: boolean;
  intolerancia_alimentar?: string[];
  usa_medicamentos?: boolean;
  medicamentos?: string[];
  tem_historico_familiar?: boolean;
  historico_familiar_doencas?: string[];
  nivel_ansiedade?: number;
  
  // Estilo de vida
  nivel_atividade?: string;
  horas_sono?: number;
  horario_acordar?: string;
  horario_dormir?: string;
  consumo_alcool?: boolean;
  frequencia_alcool?: string;
  fumante?: boolean;
  cigarros_por_dia?: number;
  horas_trabalho?: number;
  usa_suplementos?: boolean;
  suplementacao?: string[];
  
  // Sistema digestivo
  intestino_regular?: boolean;
  intestino_diario?: boolean;
  frequencia_intestino?: string;
  tem_problemas_digestivos?: boolean;
  problemas_digestivos?: string[];
  urina_normal?: boolean;
  urina_caracteristicas?: string[];
  
  // Hábitos alimentares
  consumo_agua?: number;
  qtd_refeicoes?: number;
  ja_fez_dieta?: boolean;
  dificuldades_dieta?: string[];
  diario_alimentar?: string;
  alimentos_aversao?: string[];
  alimentos_preferidos?: string[];
  preferencia_alimentar?: string[];
  aversao_alimentar?: string[];
  consumo_refrigerante?: boolean;
  frequencia_refrigerante?: string;
  alimentacao_fim_semana?: string;
  come_frente_tv?: boolean;
  
  // Campos específicos feminino
  tipo_avaliacao?: string;
  perda_peso_recente?: string;
  ganho_peso_recente?: string;
  percepcao_corporal?: string;
  doencas_ginecologicas?: string[];
  faz_acompanhamento_periodico?: boolean;
  suspeita_doenca?: string;
  doencas_repetitivas?: string;
  historico_familiar_ginecologico?: string[];
}

interface VisualizadorFormularioNutricionalProps {
  userId: string;
  tipoAvaliacao: 'masculino' | 'feminino';
  isOpen: boolean;
  onClose: () => void;
}

export function VisualizadorFormularioNutricional({ 
  userId, 
  tipoAvaliacao, 
  isOpen, 
  onClose 
}: VisualizadorFormularioNutricionalProps) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormularioData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadFormularioData();
    }
  }, [isOpen, userId, tipoAvaliacao]);

  const loadFormularioData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tipoAvaliacao === 'masculino') {
        const { data, error } = await supabase
          .from('avaliacao_nutricional')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Nenhum dado encontrado
            setFormData(null);
          } else {
            console.error('Erro ao buscar avaliação masculina:', error);
            throw new Error('Erro ao buscar dados da avaliação nutricional');
          }
        } else {
          setFormData(data);
        }
      } else {
        // Para feminino, buscar de ambas as tabelas
        const [nutricionalResult, femininoResult] = await Promise.allSettled([
          supabase
            .from('avaliacao_nutricional')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('avaliacao_nutricional_feminino')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        ]);

        let nutricionalData = null;
        let femininoData = null;

        // Processar resultado da tabela avaliacao_nutricional
        if (nutricionalResult.status === 'fulfilled' && nutricionalResult.value.data) {
          nutricionalData = nutricionalResult.value.data;
        } else if (nutricionalResult.status === 'rejected') {
          const error = nutricionalResult.reason;
          if (error.code !== 'PGRST116') {
            console.error('Erro ao buscar avaliação nutricional geral:', error);
          }
        }

        // Processar resultado da tabela avaliacao_nutricional_feminino
        if (femininoResult.status === 'fulfilled' && femininoResult.value.data) {
          femininoData = femininoResult.value.data;
        } else if (femininoResult.status === 'rejected') {
          const error = femininoResult.reason;
          if (error.code !== 'PGRST116') {
            console.error('Erro ao buscar avaliação nutricional feminina:', error);
          }
        }

        // Combinar dados se houver
        if (nutricionalData || femininoData) {
          const combinedData = {
            ...nutricionalData,
            ...femininoData,
            tipo_avaliacao: 'feminino'
          };
          setFormData(combinedData);
        } else {
          setFormData(null);
        }
      }
    } catch (err: any) {
      console.error('Erro ao carregar formulário:', err);
      setError(err.message || 'Erro ao carregar dados do formulário. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const formatTime = (time: string | undefined) => {
    if (!time) return 'Não informado';
    return time.slice(0, 5);
  };

  const formatArray = (arr: string[] | undefined) => {
    if (!arr || arr.length === 0) return 'Nenhum';
    return arr.join(', ');
  };

  const renderField = (label: string, value: any, isEmpty: boolean = false) => {
    const displayValue = isEmpty ? 'Não preenchido' : (value || 'Não informado');
    
    return (
      <div className="flex flex-col space-y-1">
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <span className={`text-sm ${isEmpty || !value ? 'text-gray-400 italic' : 'text-gray-900'}`}>
          {displayValue}
        </span>
      </div>
    );
  };

  const renderBooleanField = (label: string, value: boolean | undefined) => {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{label}:</span>
        <span className={`text-sm font-medium ${value === true ? 'text-green-600' : value === false ? 'text-red-600' : 'text-gray-400'}`}>
          {value === true ? 'Sim' : value === false ? 'Não' : 'Não informado'}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Formulário Nutricional Completo</h2>
                <p className="text-amber-100">Avaliação {tipoAvaliacao === 'masculino' ? 'Masculina' : 'Feminina'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-red-700 font-medium">Erro ao carregar formulário</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                  <p className="text-red-600 text-sm">
                    User ID: {userId} | Tipo: {tipoAvaliacao}
                  </p>
                  <button 
                    onClick={loadFormularioData}
                    className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </div>
            </div>
          ) : !formData ? (
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="text-amber-700 font-medium">Nenhum formulário encontrado para este usuário.</p>
                  <p className="text-amber-600 text-sm mt-1">
                    Tipo de avaliação: {tipoAvaliacao} | User ID: {userId}
                  </p>
                  <p className="text-amber-600 text-sm">
                    O cliente ainda não preencheu o formulário nutricional.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Seção 1: Dados Pessoais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-600" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Data de Nascimento', formatDate(formData.data_nascimento))}
                  {renderField('Idade', formData.idade ? `${formData.idade} anos` : null)}
                  {renderField('Estado Civil', formData.estado_civil)}
                  {renderBooleanField('Tem Filhos', formData.tem_filhos)}
                  {formData.tem_filhos && renderField('Quantidade de Filhos', formData.quantidade_filhos)}
                  {renderField('Objetivo', formData.objetivo)}
                </div>
              </div>

              {/* Seção 2: Medidas e Composição */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  Medidas e Composição Corporal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Peso Atual', formData.peso ? `${formData.peso} kg` : null)}
                  {renderField('Altura', formData.altura ? `${formData.altura} cm` : null)}
                  {renderField('Peso Habitual', formData.peso_habitual ? `${formData.peso_habitual} kg` : null)}
                  {renderField('Variação de Peso (6 meses)', formData.variacao_peso_6meses)}
                  {tipoAvaliacao === 'feminino' && (
                    <>
                      {renderField('Perda de Peso Recente', formData.perda_peso_recente)}
                      {renderField('Ganho de Peso Recente', formData.ganho_peso_recente)}
                      {renderField('Percepção Corporal', formData.percepcao_corporal)}
                    </>
                  )}
                </div>
              </div>

              {/* Seção 3: Histórico de Saúde */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  Histórico de Saúde
                </h3>
                <div className="space-y-4">
                  <div>
                    {renderBooleanField('Tem Doenças Crônicas', formData.tem_doencas_cronicas)}
                    {formData.tem_doencas_cronicas && (
                      <div className="mt-2 ml-4">
                        {renderField('Doenças Crônicas', formatArray(formData.doencas_cronicas))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    {renderBooleanField('Tem Cirurgias Anteriores', formData.tem_cirurgias)}
                    {formData.tem_cirurgias && (
                      <div className="mt-2 ml-4">
                        {renderField('Cirurgias', formatArray(formData.cirurgias_anteriores))}
                      </div>
                    )}
                  </div>

                  <div>
                    {renderBooleanField('Usa Medicamentos', formData.usa_medicamentos)}
                    {formData.usa_medicamentos && (
                      <div className="mt-2 ml-4">
                        {renderField('Medicamentos', formatArray(formData.medicamentos))}
                      </div>
                    )}
                  </div>

                  <div>
                    {renderBooleanField('Tem Alergias/Intolerâncias', formData.tem_alergias)}
                    {formData.tem_alergias && (
                      <div className="mt-2 ml-4">
                        {renderField('Intolerâncias Alimentares', formatArray(formData.intolerancia_alimentar))}
                      </div>
                    )}
                  </div>

                  <div>
                    {renderBooleanField('Histórico Familiar de Doenças', formData.tem_historico_familiar)}
                    {formData.tem_historico_familiar && (
                      <div className="mt-2 ml-4">
                        {renderField('Doenças na Família', formatArray(formData.historico_familiar_doencas))}
                      </div>
                    )}
                  </div>

                  {renderField('Nível de Ansiedade', formData.nivel_ansiedade ? `${formData.nivel_ansiedade}/10` : null)}

                  {tipoAvaliacao === 'feminino' && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-3">Saúde Feminina</h4>
                      {renderField('Doenças Ginecológicas', formatArray(formData.doencas_ginecologicas))}
                      {renderBooleanField('Faz Acompanhamento Periódico', formData.faz_acompanhamento_periodico)}
                      {renderField('Suspeita de Doença', formData.suspeita_doenca)}
                      {renderField('Doenças Repetitivas', formData.doencas_repetitivas)}
                      {renderField('Histórico Familiar Ginecológico', formatArray(formData.historico_familiar_ginecologico))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 4: Estilo de Vida */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-600" />
                  Estilo de Vida
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Nível de Atividade Física', formData.nivel_atividade)}
                  {renderField('Horas de Sono', formData.horas_sono ? `${formData.horas_sono} horas` : null)}
                  {renderField('Horário de Acordar', formatTime(formData.horario_acordar))}
                  {renderField('Horário de Dormir', formatTime(formData.horario_dormir))}
                  {renderBooleanField('Consome Álcool', formData.consumo_alcool)}
                  {formData.consumo_alcool && renderField('Frequência de Álcool', formData.frequencia_alcool)}
                  {renderBooleanField('Fumante', formData.fumante)}
                  {formData.fumante && renderField('Cigarros por Dia', formData.cigarros_por_dia)}
                  {renderField('Horas de Trabalho', formData.horas_trabalho ? `${formData.horas_trabalho} horas` : null)}
                </div>
                
                <div className="mt-4">
                  {renderBooleanField('Usa Suplementos', formData.usa_suplementos)}
                  {formData.usa_suplementos && (
                    <div className="mt-2">
                      {renderField('Suplementação', formatArray(formData.suplementacao))}
                    </div>
                  )}
                </div>
              </div>

              {/* Seção 5: Sistema Digestivo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-amber-600" />
                  Sistema Digestivo
                </h3>
                <div className="space-y-4">
                  {renderBooleanField('Intestino Regular', formData.intestino_regular)}
                  {renderBooleanField('Intestino Funciona Diariamente', formData.intestino_diario)}
                  {renderField('Frequência Intestinal', formData.frequencia_intestino)}
                  
                  <div>
                    {renderBooleanField('Tem Problemas Digestivos', formData.tem_problemas_digestivos)}
                    {formData.tem_problemas_digestivos && (
                      <div className="mt-2 ml-4">
                        {renderField('Problemas Digestivos', formatArray(formData.problemas_digestivos))}
                      </div>
                    )}
                  </div>

                  {renderBooleanField('Urina Normal', formData.urina_normal)}
                  {!formData.urina_normal && renderField('Características da Urina', formatArray(formData.urina_caracteristicas))}
                </div>
              </div>

              {/* Seção 6: Hábitos Alimentares */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Apple className="w-5 h-5 text-amber-600" />
                  Hábitos Alimentares
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Consumo de Água', formData.consumo_agua ? `${formData.consumo_agua} L` : null)}
                    {renderField('Quantidade de Refeições', formData.qtd_refeicoes)}
                    {renderBooleanField('Já Fez Dieta', formData.ja_fez_dieta)}
                    {renderBooleanField('Consome Refrigerante', formData.consumo_refrigerante)}
                    {formData.consumo_refrigerante && renderField('Frequência de Refrigerante', formData.frequencia_refrigerante)}
                    {renderBooleanField('Come na Frente da TV', formData.come_frente_tv)}
                  </div>

                  {formData.ja_fez_dieta && (
                    <div>
                      {renderField('Dificuldades em Dietas', formatArray(formData.dificuldades_dieta))}
                    </div>
                  )}

                  <div>
                    {renderField('Alimentos Preferidos', formatArray(formData.alimentos_preferidos || formData.preferencia_alimentar))}
                  </div>

                  <div>
                    {renderField('Alimentos com Aversão', formatArray(formData.alimentos_aversao || formData.aversao_alimentar))}
                  </div>

                  <div>
                    {renderField('Alimentação no Fim de Semana', formData.alimentacao_fim_semana)}
                  </div>

                  {formData.diario_alimentar && (
                    <div>
                      <span className="text-sm font-medium text-gray-600">Diário Alimentar:</span>
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.diario_alimentar}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicador de campos não preenchidos */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Campos em destaque</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Os campos marcados como "Não informado" ou "Não preenchido" indicam que o cliente não forneceu essas informações no formulário.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
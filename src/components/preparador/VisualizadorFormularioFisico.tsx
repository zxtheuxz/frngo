import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, User, FileText, Activity, Target, AlertCircle, CheckCircle, Loader2, Dumbbell, Heart, Calendar, Clock, FileCheck } from 'lucide-react';

interface FormularioFisicoData {
  // Dados básicos
  id?: string;
  user_id?: string;
  sexo?: string;
  idade?: string;
  
  // Objetivos e experiência
  objetivo?: string;
  tempo_inativo?: string;
  experiencia_musculacao?: string;
  disponibilidade_semanal?: string;
  nivel_experiencia?: string;
  
  // Saúde
  tem_laudo_medico?: boolean;
  laudo_medico_url?: string;
  doenca_pre_existente?: string;
  doenca_impossibilita?: boolean;
  sente_dores?: boolean;
  tem_lesao?: boolean;
  usa_medicamentos?: boolean;
  tem_receita_medica?: boolean;
  medicamento_documento_url?: string;
  
  // Timestamps
  created_at?: string;
}

interface VisualizadorFormularioFisicoProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VisualizadorFormularioFisico({ 
  userId, 
  isOpen, 
  onClose 
}: VisualizadorFormularioFisicoProps) {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormularioFisicoData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      loadFormularioData();
    }
  }, [isOpen, userId]);

  const loadFormularioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('avaliacao_fisica')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setFormData(data || null);
    } catch (err) {
      console.error('Erro ao carregar formulário físico:', err);
      setError('Erro ao carregar dados do formulário');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Não informado';
    return new Date(date).toLocaleDateString('pt-BR');
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Dumbbell className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Formulário de Avaliação Física Completo</h2>
                <p className="text-purple-100">Todos os dados fornecidos pelo cliente</p>
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
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          ) : !formData ? (
            <div className="p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-purple-600" />
                <p className="text-purple-700">Nenhum formulário de avaliação física encontrado para este usuário.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Seção 1: Dados Pessoais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Sexo', formData.sexo)}
                  {renderField('Idade', formData.idade)}
                </div>
              </div>

              {/* Seção 2: Objetivos e Experiência */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-600" />
                  Objetivos e Experiência
                </h3>
                <div className="space-y-4">
                  {renderField('Objetivo Principal', formData.objetivo)}
                  {renderField('Tempo Inativo', formData.tempo_inativo)}
                  {renderField('Experiência em Musculação', formData.experiencia_musculacao)}
                  {renderField('Nível de Experiência', formData.nivel_experiencia)}
                </div>
              </div>

              {/* Seção 3: Disponibilidade */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  Disponibilidade para Treino
                </h3>
                <div>
                  {renderField('Disponibilidade Semanal', formData.disponibilidade_semanal)}
                </div>
              </div>

              {/* Seção 4: Saúde e Limitações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-purple-600" />
                  Condições de Saúde
                </h3>
                <div className="space-y-4">
                  {/* Doenças */}
                  <div>
                    {renderField('Doença Pré-existente', formData.doenca_pre_existente || 'Nenhuma')}
                    {formData.doenca_pre_existente && (
                      <div className="mt-2">
                        {renderBooleanField('Doença Impossibilita Exercícios', formData.doenca_impossibilita)}
                      </div>
                    )}
                  </div>

                  {/* Dores e Lesões */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderBooleanField('Sente Dores', formData.sente_dores)}
                    {renderBooleanField('Tem Lesão', formData.tem_lesao)}
                  </div>

                  {/* Medicamentos */}
                  <div>
                    {renderBooleanField('Usa Medicamentos', formData.usa_medicamentos)}
                    {formData.usa_medicamentos && (
                      <div className="mt-2">
                        {renderBooleanField('Tem Receita Médica', formData.tem_receita_medica)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Seção 5: Documentos Médicos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  Documentos Médicos
                </h3>
                <div className="space-y-4">
                  <div>
                    {renderBooleanField('Tem Laudo Médico', formData.tem_laudo_medico)}
                    {formData.tem_laudo_medico && formData.laudo_medico_url && (
                      <div className="mt-2">
                        <a 
                          href={formData.laudo_medico_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          Ver Laudo Médico
                        </a>
                      </div>
                    )}
                  </div>

                  {formData.usa_medicamentos && formData.medicamento_documento_url && (
                    <div>
                      <a 
                        href={formData.medicamento_documento_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
                      >
                        <FileText className="w-4 h-4" />
                        Ver Documento de Medicamentos
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Indicador de campos não preenchidos */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-purple-800">Campos em destaque</p>
                    <p className="text-sm text-purple-700 mt-1">
                      Os campos marcados como "Não informado" ou "Não preenchido" indicam que o cliente não forneceu essas informações no formulário.
                    </p>
                  </div>
                </div>
              </div>

              {/* Data de preenchimento */}
              <div className="text-center text-sm text-gray-500">
                Formulário preenchido em: {formatDate(formData.created_at)}
                {formData.updated_at && formData.updated_at !== formData.created_at && (
                  <span className="block">Última atualização: {formatDate(formData.updated_at)}</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
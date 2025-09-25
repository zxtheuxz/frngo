import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Eye, Undo2, Copy, Check, ChefHat, Salad, FileStack, Search, Apple, Utensils } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Mapeamento de IDs para nomes descritivos
const TIPO_DIETA_MAP: Record<number, string> = {
  1: 'Emagrecimento',
  2: 'Ganho de Massa Muscular'
};

const VALOR_CALORICO_MAP: Record<number, string> = {
  1: '1200 kcal',
  2: '1300 kcal',
  3: '1400 kcal',
  4: '1500 kcal',
  5: '1600 kcal',
  6: '1700 kcal',
  7: '1800 kcal',
  8: '1900 kcal',
  9: '2000 kcal',
  10: '2200 kcal',
  11: '2300 kcal',
  12: '2400 kcal',
  13: '2500 kcal',
  14: '2600 kcal',
  15: '2700 kcal',
  16: '2800 kcal',
  17: '2900 kcal',
  18: '3000 kcal',
  19: '3100 kcal',
  20: '4200 kcal'
};

interface AvaliacaoNutricional {
  id: string;
  avaliacao_id: string;
  user_id: string;
  tipo_avaliacao: 'masculino' | 'feminino';
  status: string;
  resultado_original: string;
  resultado_editado?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  usuario: {
    id: string;
    nome_completo: string;
    email: string;
    telefone?: string;
    data_nascimento?: string;
  };
}

interface EditorResultadoNutricionalProps {
  avaliacao: AvaliacaoNutricional;
  isOpen: boolean;
  onClose: () => void;
  onSave: (avaliacaoId: string, novoResultado: string) => Promise<void>;
}

export function EditorResultadoNutricional({ 
  avaliacao, 
  isOpen, 
  onClose, 
  onSave 
}: EditorResultadoNutricionalProps) {
  const [conteudo, setConteudo] = useState('');
  const [conteudoOriginal, setConteudoOriginal] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [fullPreviewTemplate, setFullPreviewTemplate] = useState<any>(null);
  const [previewGender, setPreviewGender] = useState<'masculino' | 'feminino'>('masculino');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  useEffect(() => {
    if (avaliacao) {
      loadResultadoNutricional();
      loadTemplates();
    }
  }, [avaliacao]);

  const loadResultadoNutricional = async () => {
    try {
      setLoading(true);
      // Buscar o resultado_nutricional da tabela perfis
      const { data, error } = await supabase
        .from('perfis')
        .select('resultado_nutricional')
        .eq('user_id', avaliacao.user_id)
        .single();

      if (error) {
        console.error('Erro ao buscar resultado nutricional:', error);
        return;
      }

      const resultado = data.resultado_nutricional || '';
      setConteudo(resultado);
      setConteudoOriginal(resultado);
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('templates_dietas')
        .select('*')
        .order('tipo_id', { ascending: true })
        .order('valor_calorico_id', { ascending: true });

      if (error) {
        console.error('Erro ao carregar templates:', error);
        return;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Salvar o resultado_nutricional na tabela perfis com data de edição
      const { error: perfilError } = await supabase
        .from('perfis')
        .update({ 
          resultado_nutricional: conteudo,
          resultado_nutricional_editado_em: new Date().toISOString()
        })
        .eq('user_id', avaliacao.user_id);

      if (perfilError) {
        console.error('Erro ao salvar resultado nutricional:', perfilError);
        alert('Erro ao salvar o resultado. Tente novamente.');
        return;
      }

      console.log('Resultado nutricional salvo com sucesso na tabela perfis');
      
      // Chamar a função original para atualizar o status se necessário
      await onSave(avaliacao.id, conteudo);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(conteudo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyTemplateContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetToOriginal = async () => {
    // Recarregar o resultado original da tabela perfis
    await loadResultadoNutricional();
  };

  const applyTemplate = (template: any) => {
    setConteudo(template.conteudo);
    setShowTemplateSelector(false);
    setSearchTemplate('');
  };

  const insertTemplate = (template: string) => {
    const textarea = document.getElementById('editor-textarea-nutricional') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = conteudo.substring(0, start) + template + conteudo.substring(end);
      setConteudo(newContent);
      
      // Reposicionar cursor
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + template.length, start + template.length);
      }, 0);
    }
  };

  const getTipoIcon = () => {
    return avaliacao.tipo_avaliacao === 'masculino' ? 
      <ChefHat className="w-5 h-5" /> : 
      <Salad className="w-5 h-5" />;
  };

  const getTipoColor = () => {
    return avaliacao.tipo_avaliacao === 'masculino' ? 'from-blue-600 to-indigo-700' : 'from-pink-600 to-rose-700';
  };

  const filteredTemplates = templates.filter(template => {
    const tipo = TIPO_DIETA_MAP[template.tipo_id] || `Tipo ${template.tipo_id}`;
    const valorCalorico = VALOR_CALORICO_MAP[template.valor_calorico_id] || `${template.valor_calorico_id} kcal`;
    const searchText = `${tipo} ${valorCalorico}`.toLowerCase();
    return searchText.includes(searchTemplate.toLowerCase());
  });

  const openFullPreview = (template: any) => {
    setFullPreviewTemplate(template);
    setShowFullPreview(true);
  };

  const closeFullPreview = () => {
    setShowFullPreview(false);
    setFullPreviewTemplate(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-r ${getTipoColor()} rounded-xl flex items-center justify-center text-white`}>
              {getTipoIcon()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Editor de Resultado Nutricional</h2>
              <p className="text-sm text-gray-600 mt-1">
                Cliente: <span className="font-medium">{avaliacao.usuario.nome_completo}</span> - 
                <span className="ml-1 capitalize">{avaliacao.tipo_avaliacao}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                  showPreview 
                    ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Editar' : 'Visualizar'}
              </button>
              
              <div className="h-6 w-px bg-gray-300 mx-1" />
              
              <button
                onClick={resetToOriginal}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Undo2 className="w-4 h-4" />
                Restaurar Original
              </button>
              
              <button
                onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <FileStack className="w-4 h-4" />
                Usar Template
              </button>
              
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {conteudo.length} caracteres
              </span>
            </div>
          </div>

          {/* Templates rápidos específicos para nutrição */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Templates:</span>
            <button
              onClick={() => insertTemplate('\n\n**ORIENTAÇÕES NUTRICIONAIS:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Orientações
            </button>
            <button
              onClick={() => insertTemplate('\n\n**SUPLEMENTAÇÃO RECOMENDADA:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Suplementação
            </button>
            <button
              onClick={() => insertTemplate('\n\n**RESTRIÇÕES ALIMENTARES:**\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Restrições
            </button>
            <button
              onClick={() => insertTemplate('\n\n**HIDRATAÇÃO:**\n- Consumir pelo menos 35ml/kg de peso corporal por dia\n- ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Hidratação
            </button>
            <button
              onClick={() => insertTemplate('\n\n**CRONOGRAMA DE REFEIÇÕES:**\n- **Café da manhã:** \n- **Lanche:** \n- **Almoço:** \n- **Lanche:** \n- **Jantar:** \n- **Ceia:** ')}
              className="px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
            >
              Cronograma
            </button>
            <button
              onClick={() => insertTemplate('\n\n**IMPORTANTE:** ')}
              className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Importante
            </button>
          </div>

          {/* Template Selector Modal */}
          {showTemplateSelector && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-lg">
                        <FileStack className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Templates de Dieta</h3>
                        <p className="text-sm text-gray-600">Escolha um template para aplicar</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowTemplateSelector(false);
                        setSearchTemplate('');
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="mt-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar por tipo ou valor calórico..."
                        value={searchTemplate}
                        onChange={(e) => setSearchTemplate(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Templates Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Grupo: Emagrecimento */}
                  {filteredTemplates.filter(t => t.tipo_id === 1).length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Apple className="w-5 h-5 text-green-600" />
                        Emagrecimento
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates
                          .filter(template => template.tipo_id === 1)
                          .map((template) => {
                            const valorCalorico = VALOR_CALORICO_MAP[template.valor_calorico_id] || `${template.valor_calorico_id} kcal`;
                            
                            return (
                              <div
                                key={template.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-md transition-all bg-white"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="text-base font-semibold text-gray-900">
                                      {valorCalorico}
                                    </h5>
                                    <p className="text-sm text-gray-600">Plano para emagrecimento</p>
                                  </div>
                                  <div className="text-2xl">🥗</div>
                                </div>
                                
                                <div className="space-y-2">
                                  <button
                                    onClick={() => applyTemplate(template)}
                                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                  >
                                    Aplicar Template
                                  </button>
                                  
                                  {/* Preview Toggle */}
                                  <button
                                    onClick={() => openFullPreview(template)}
                                    className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Preview
                                  </button>
                                </div>
                                
                                {/* Preview Content */}
                                {selectedTemplate?.id === template.id && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 line-clamp-4">
                                      {template.conteudo.substring(0, 300)}...
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}

                  {/* Grupo: Ganho de Massa Muscular */}
                  {filteredTemplates.filter(t => t.tipo_id === 2).length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Utensils className="w-5 h-5 text-orange-600" />
                        Ganho de Massa Muscular
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTemplates
                          .filter(template => template.tipo_id === 2)
                          .map((template) => {
                            const valorCalorico = VALOR_CALORICO_MAP[template.valor_calorico_id] || `${template.valor_calorico_id} kcal`;
                            
                            return (
                              <div
                                key={template.id}
                                className="border border-gray-200 rounded-lg p-4 hover:border-amber-300 hover:shadow-md transition-all bg-white"
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h5 className="text-base font-semibold text-gray-900">
                                      {valorCalorico}
                                    </h5>
                                    <p className="text-sm text-gray-600">Plano para hipertrofia</p>
                                  </div>
                                  <div className="text-2xl">💪</div>
                                </div>
                                
                                <div className="space-y-2">
                                  <button
                                    onClick={() => applyTemplate(template)}
                                    className="w-full px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                                  >
                                    Aplicar Template
                                  </button>
                                  
                                  {/* Preview Toggle */}
                                  <button
                                    onClick={() => openFullPreview(template)}
                                    className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Ver Preview
                                  </button>
                                </div>
                                
                                {/* Preview Content */}
                                {selectedTemplate?.id === template.id && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-600 line-clamp-4">
                                      {template.conteudo.substring(0, 300)}...
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                  
                  {filteredTemplates.length === 0 && (
                    <div className="text-center py-12">
                      <FileStack className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Nenhum template encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-600"></div>
            </div>
          ) : showPreview ? (
            <div className="h-full overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: conteudo
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>
          ) : (
            <textarea
              id="editor-textarea-nutricional"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="w-full h-full p-6 resize-none focus:outline-none font-mono text-sm text-gray-800"
              placeholder="Digite ou edite o resultado da avaliação nutricional..."
              style={{ minHeight: '400px' }}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {avaliacao.resultado_editado && (
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Última edição: {new Date(avaliacao.updated_at).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || conteudo === conteudoOriginal}
                className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Preview Completo */}
      {showFullPreview && fullPreviewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
            {/* Header do Modal */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {TIPO_DIETA_MAP[fullPreviewTemplate.tipo_id]} - {VALOR_CALORICO_MAP[fullPreviewTemplate.valor_calorico_id]}
                  </h3>
                  <p className="text-sm text-gray-600">Preview completo do template nutricional</p>
                </div>
              </div>
              <button
                onClick={closeFullPreview}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Conteúdo do Template */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none">
                <div 
                  className="whitespace-pre-wrap text-gray-800 leading-relaxed"
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  dangerouslySetInnerHTML={{
                    __html: fullPreviewTemplate.conteudo
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
                      .replace(/^(#{1,6})\s+(.*$)/gm, (match, hashes, title) => {
                        const level = hashes.length;
                        const classes = [
                          'text-2xl font-bold text-gray-900 mt-6 mb-3',
                          'text-xl font-bold text-gray-900 mt-5 mb-2',
                          'text-lg font-semibold text-gray-800 mt-4 mb-2',
                          'text-base font-semibold text-gray-800 mt-3 mb-2',
                          'text-sm font-semibold text-gray-700 mt-2 mb-1',
                          'text-sm font-medium text-gray-700 mt-2 mb-1'
                        ];
                        return `<h${level} class="${classes[level-1] || classes[5]}">${title}</h${level}>`;
                      })
                      .replace(/\n\n/g, '<p class="mb-4"></p>')
                      .replace(/\n/g, '<br>')
                  }}
                />
              </div>
            </div>

            {/* Footer com Ações */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {fullPreviewTemplate.conteudo?.length || 0} caracteres
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => copyTemplateContent(fullPreviewTemplate.conteudo)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado!' : 'Copiar Conteúdo'}
                  </button>
                  <button
                    onClick={() => {
                      applyTemplate(fullPreviewTemplate);
                      closeFullPreview();
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                  >
                    <FileStack className="w-4 h-4" />
                    Aplicar Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
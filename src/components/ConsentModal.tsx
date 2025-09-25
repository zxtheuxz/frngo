import React, { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, CheckCircle, ScrollText } from 'lucide-react';
import { TermType } from '../lib/termsService';
import { useTheme } from '../contexts/ThemeContext';

interface ConsentModalProps {
  isOpen: boolean;
  termType: TermType;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onClose: () => void;
}

const TERMS_CONTENT = {
  AVALIACAO_FISICA_NUTRICIONAL: `# TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
## Avaliação Física e Nutricional

### 1. AVALIAÇÃO FÍSICA

Na avaliação física, serão realizadas medições de massa corporal, altura e outras medidas físicas conforme necessário. Suas informações serão utilizadas para avaliação de sua condição física geral e planejamento de atividades adequadas.

**Procedimentos:** Será necessário fornecer informações sobre seu histórico de atividades físicas, condições de saúde, limitações e objetivos para uma avaliação completa e segura.

### 2. AVALIAÇÃO NUTRICIONAL

A avaliação nutricional incluirá análise de seus hábitos alimentares, necessidades nutricionais individuais, histórico de saúde relacionado à alimentação e elaboração de orientações personalizadas. Poderão ser solicitadas informações sobre rotina alimentar, preferências, restrições e objetivos nutricionais.

**Procedimentos:** Será necessário fornecer informações detalhadas sobre sua alimentação atual, histórico de saúde, medicamentos em uso e estilo de vida para uma avaliação completa e precisa.

---

## CONSENTIMENTOS E GARANTIAS

**USO DAS INFORMAÇÕES:** Todos os dados coletados (informações físicas e nutricionais) serão utilizados para:
- Elaboração de avaliações e orientações personalizadas
- Acompanhamento da evolução e comparação de resultados ao longo do tempo
- Melhoria da qualidade dos serviços prestados

**PRIVACIDADE E CONFIDENCIALIDADE:** 
- Seu nome ou qualquer informação que possa identificá-lo jamais será divulgado
- Todas as informações serão mantidas em sigilo profissional
- O acesso aos dados fica restrito ao profissional responsável

**SEGURANÇA DOS DADOS:**
- Suas informações serão armazenadas de forma segura
- O acesso aos dados é restrito e controlado
- Todas as informações são tratadas com máximo sigilo profissional

**FINALIDADE:** Os resultados obtidos serão fundamentais para:
- Planejamento alimentar adequado às suas necessidades
- Prescrição de exercícios compatíveis com seu perfil
- Monitoramento de condições de saúde, estética e desempenho
- Estabelecimento de metas realistas e seguras

---

## DIREITOS DO CLIENTE

- Você pode desistir de qualquer um dos procedimentos a qualquer momento, mesmo após aceitar este termo
- Tem direito a esclarecimentos sobre qualquer procedimento antes de sua realização
- Pode solicitar a exclusão de seus dados a qualquer momento
- Tem acesso aos seus resultados e informações coletadas

Se você tiver alguma dúvida antes de decidir, sinta-se à vontade para esclarecê-la.

---

## CONSENTIMENTO DIGITAL

**CONCORDO** com os procedimentos de:

☐ **Avaliação Física**
Aceito realizar avaliação física e fornecer informações necessárias

☐ **Avaliação Nutricional**  
Aceito participar da avaliação nutricional e fornecer informações necessárias

---

**DECLARAÇÃO FINAL:**
Ao clicar em "ACEITO", declaro que:
- Fui devidamente informado(a) sobre todos os procedimentos
- Li e compreendi integralmente este termo de consentimento
- Estou ciente sobre possíveis desconfortos
- Sei que posso desistir ou revogar meu consentimento a qualquer momento
- Concordo voluntariamente com os procedimentos selecionados`,

  ENVIO_FOTOS: `# TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO
## Avaliação Antropométrica e Envio de Imagens

### AVALIAÇÃO ANTROPOMÉTRICA VIA FOTOGRAFIAS

Na avaliação antropométrica, serão realizadas medições de perímetros corporais, cálculos de composição corporal e outras medidas através da análise de fotografias corporais. Suas informações serão utilizadas para cálculos de composição corporal (percentual de gordura, massa muscular e outros componentes) e avaliação de sua condição física geral.

### ENVIO E ANÁLISE DE IMAGENS

O envio de fotografias corporais é essencial para realizar as medições antropométricas e para acompanhamento visual da evolução física. As imagens serão utilizadas para fins de análise profissional, comparação de resultados, acompanhamento do progresso e **divulgação educativa**.

**Procedimentos:** As fotos devem ser enviadas conforme orientações específicas (ângulos, iluminação, vestimentas) para permitir as medições antropométricas precisas. É recomendado o uso de roupas justas ou trajes de banho para melhor visualização e análise corporal.

---

## USO DAS SUAS IMAGENS

**ANÁLISE PROFISSIONAL:**
- **Medições antropométricas** realizadas através das fotografias
- **Cálculos de composição corporal** (percentual de gordura, massa muscular)
- Acompanhamento da sua evolução física
- Comparação de resultados "antes e depois"
- Orientações personalizadas baseadas no progresso visual
- Ajustes no planejamento de treino e alimentação

**DIVULGAÇÃO EDUCATIVA:**
Suas fotos de "antes e depois" poderão ser utilizadas em:
- **Lives educativas** sobre transformação corporal
- **Aulas online** demonstrando resultados reais
- **Material didático** e educativo sobre evolução física
- **Apresentações** para fins de ensino e motivação
- **Conteúdos nas redes sociais** com propósito educativo

---

## GARANTIAS DE PRIVACIDADE

**PROTEÇÃO DA SUA IDENTIDADE:**
- ✅ Seu **rosto nunca será mostrado** em qualquer divulgação
- ✅ Seu **nome jamais será revelado** ou associado às imagens
- ✅ Nenhuma **informação pessoal** será divulgada
- ✅ Apenas o **corpo será mostrado** (do pescoço para baixo)
- ✅ **Anonimato total** preservado em todas as divulgações

**SEGURANÇA DOS DADOS:**
- Suas imagens são armazenadas de forma segura e criptografada
- Acesso restrito apenas ao profissional responsável
- Possibilidade de solicitar remoção das imagens a qualquer momento
- Uso exclusivo para os fins descritos neste termo

---

## SEUS DIREITOS

- **Desistir** do envio de fotos a qualquer momento
- **Revogar** a autorização de uso das imagens já enviadas
- **Solicitar exclusão** de todas as suas fotos do sistema
- **Escolher** quais tipos de divulgação autoriza
- **Receber esclarecimentos** sobre o uso das imagens

---

## BENEFÍCIOS PARA VOCÊ

- Acompanhamento visual preciso da sua evolução
- Motivação através dos resultados obtidos
- Contribuição para educação de outras pessoas
- Inspiração para quem busca transformação similar
- Registro profissional do seu progresso

---

## CONSENTIMENTO DIGITAL

**AUTORIZO** o uso das minhas imagens para:

☐ **Avaliação Antropométrica e Análise do Progresso**
Aceito enviar fotos para medições corporais e acompanhamento da minha evolução

☐ **Divulgação Educativa Anônima**
Autorizo o uso das minhas fotos "antes e depois" em:
- Lives e aulas educativas
- Material didático e motivacional  
- Conteúdos nas redes sociais
- Apresentações educacionais

*Sempre preservando minha identidade e sem mostrar meu rosto*

---

**DECLARAÇÃO FINAL:**
Ao clicar em "ACEITO", declaro que:
- Compreendo totalmente o uso que será feito das minhas imagens
- Autorizo voluntariamente a divulgação conforme selecionado
- Estou ciente das garantias de privacidade oferecidas
- Sei que posso revogar esta autorização a qualquer momento
- Concordo com os benefícios educativos da divulgação das imagens`
};

export function ConsentModal({ isOpen, termType, onAccept, onReject, onClose }: ConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  // Reset terms accepted state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTermsAccepted(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen, loading, onClose]);

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept();
    } catch (error) {
      console.error('Erro ao aceitar termo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject();
    } catch (error) {
      console.error('Erro ao rejeitar termo:', error);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  const termTitle = termType === 'AVALIACAO_FISICA_NUTRICIONAL' 
    ? 'Termo de Consentimento - Avaliação Física e Nutricional'
    : 'Termo de Consentimento - Envio de Fotos';

  const termContent = TERMS_CONTENT[termType];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 md:p-8">
      <div className={`relative w-full max-w-4xl h-[90vh] sm:h-[85vh] md:h-[85vh] rounded-2xl shadow-2xl flex flex-col ${
        isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b flex-shrink-0 ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              termType === 'AVALIACAO_FISICA_NUTRICIONAL' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
            }`}>
              {termType === 'AVALIACAO_FISICA_NUTRICIONAL' ? (
                <FileText className="h-6 w-6" />
              ) : (
                <ScrollText className="h-6 w-6" />
              )}
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {termTitle}
              </h2>
              <p className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Leia atentamente antes de continuar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div 
          className={`flex-1 overflow-y-auto p-4 sm:p-6 prose prose-xs sm:prose-sm max-w-none ${
            isDarkMode ? 'prose-invert' : ''
          }`}
        >
          <div className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
            {termContent.split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return (
                  <h1 key={index} className={`text-2xl font-bold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {line.replace('# ', '')}
                  </h1>
                );
              } else if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className={`text-xl font-semibold mt-8 mb-4 ${
                    termType === 'AVALIACAO_FISICA_NUTRICIONAL' 
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {line.replace('## ', '')}
                  </h2>
                );
              } else if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className={`text-lg font-semibold mt-6 mb-3 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {line.replace('### ', '')}
                  </h3>
                );
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return (
                  <p key={index} className={`font-semibold mt-4 mb-2 ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    {line.replace(/\*\*/g, '')}
                  </p>
                );
              } else if (line.startsWith('- ')) {
                return (
                  <li key={index} className="ml-4 mb-2">
                    {line.replace('- ', '')}
                  </li>
                );
              } else if (line.startsWith('☐ ')) {
                return (
                  <div key={index} className={`flex items-start space-x-2 my-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'
                  }`}>
                    <CheckCircle className={`h-5 w-5 mt-0.5 ${
                      termType === 'AVALIACAO_FISICA_NUTRICIONAL' 
                        ? 'text-blue-500'
                        : 'text-orange-500'
                    }`} />
                    <span className="font-medium">{line.replace('☐ ', '')}</span>
                  </div>
                );
              } else if (line.startsWith('✅ ')) {
                return (
                  <div key={index} className={`flex items-start space-x-2 my-2 p-2 rounded ${
                    isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                  }`}>
                    <span className="text-green-500">✅</span>
                    <span className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                      {line.replace('✅ ', '')}
                    </span>
                  </div>
                );
              } else if (line.trim() === '---') {
                return <hr key={index} className={`my-6 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`} />;
              } else if (line.trim() === '') {
                return <div key={index} className="h-4" />;
              } else {
                return (
                  <p key={index} className="mb-3 leading-relaxed">
                    {line}
                  </p>
                );
              }
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 sm:p-6 border-t flex-shrink-0 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          {/* Checkbox de confirmação */}
          <div className="mb-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className={`mt-1 h-5 w-5 rounded border-2 focus:ring-2 focus:ring-offset-2 ${
                  termType === 'AVALIACAO_FISICA_NUTRICIONAL'
                    ? 'text-blue-600 border-blue-300 focus:ring-blue-500'
                    : 'text-orange-600 border-orange-300 focus:ring-orange-500'
                } ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
              <span className={`text-sm font-medium leading-5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Li e compreendi completamente este termo de consentimento e concordo voluntariamente com os procedimentos descritos.
              </span>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={handleReject}
              disabled={loading}
              className={`flex-1 px-6 py-4 sm:py-3 rounded-xl font-semibold text-lg sm:text-base transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              {loading ? 'Processando...' : 'NÃO ACEITO'}
            </button>
            <button
              onClick={handleAccept}
              disabled={loading || !termsAccepted}
              className={`flex-1 px-6 py-4 sm:py-3 rounded-xl font-semibold text-lg sm:text-base transition-all duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed ${
                termType === 'AVALIACAO_FISICA_NUTRICIONAL' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {loading ? 'Processando...' : 'ACEITO OS TERMOS'}
            </button>
          </div>
          
          <p className={`text-xs text-center mt-3 ${
            isDarkMode ? 'text-gray-500' : 'text-gray-500'
          }`}>
            Data: {new Date().toLocaleDateString('pt-BR')} | 
            IP registrado automaticamente para fins de segurança
          </p>
        </div>
      </div>
    </div>
  );
}
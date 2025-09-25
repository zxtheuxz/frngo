import React from 'react';
import { ResultadoAnalise } from '../../utils/calculosComposicaoCorporal';
import CardIndicador from './CardIndicador';

interface GridIndicadoresProps {
  dados: ResultadoAnalise;
  className?: string;
}

const GridIndicadores: React.FC<GridIndicadoresProps> = ({ dados, className = '' }) => {
  
  // Converter status para o formato do CardIndicador
  const converterStatus = (faixa: string) => {
    const conversao: Record<string, string> = {
      'BAIXO_RISCO': 'baixo_risco',
      'ATENCAO': 'atencao', 
      'MODERADO': 'moderado',
      'ALTO_RISCO': 'alto_risco',
      'ADEQUADO': 'adequado',
      'INADEQUADO': 'inadequado'
    };
    return conversao[faixa] || 'adequado';
  };

  // Determinar status baseado no valor do percentual de gordura
  const statusPercentualGordura = () => {
    const valor = dados.composicao.percentualGordura;
    if (valor <= 11.1) return 'atencao';
    if (valor <= 18.2) return 'baixo_risco';
    if (valor <= 21.9) return 'moderado';
    return 'alto_risco';
  };

  return (
    <div className={`${className}`}>
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
        Resumo dos Indicadores
      </h2>
      
      {/* Grid 2x3 dos cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Percentual de gordura */}
        <CardIndicador
          titulo="Percentual de gordura"
          valor={dados.composicao.percentualGordura}
          unidade="%"
          status={statusPercentualGordura()}
          descricao={
            dados.composicao.percentualGordura <= 11.1 ? 'Atenção' :
            dados.composicao.percentualGordura <= 18.2 ? 'Baixo risco' :
            dados.composicao.percentualGordura <= 21.9 ? 'Moderado' : 'Alto risco'
          }
        />

        {/* Card 2: Índice de massa magra */}
        <CardIndicador
          titulo="Índice de massa magra"
          valor={dados.indices.indiceMassaMagra.valor}
          unidade="kg/m²"
          status={converterStatus(dados.indices.indiceMassaMagra.faixa)}
          descricao={dados.indices.indiceMassaMagra.descricao}
        />

        {/* Card 3: Razão cintura/quadril */}
        <CardIndicador
          titulo="Razão cintura/quadril"
          valor={dados.indices.razaoCinturaQuadril.valor}
          unidade=""
          status={converterStatus(dados.indices.razaoCinturaQuadril.faixa)}
          descricao={dados.indices.razaoCinturaQuadril.descricao}
        />

        {/* Card 4: Índice de massa gorda */}
        <CardIndicador
          titulo="Índice de massa gorda"
          valor={dados.indices.indiceMassaGorda.valor}
          unidade="kg/m²"
          status={converterStatus(dados.indices.indiceMassaGorda.faixa)}
          descricao={dados.indices.indiceMassaGorda.descricao}
        />

        {/* Card 5: Razão cintura/estatura */}
        <CardIndicador
          titulo="Razão cintura/estatura"
          valor={dados.indices.razaoCinturaEstatura.valor}
          unidade=""
          status={converterStatus(dados.indices.razaoCinturaEstatura.faixa)}
          descricao={dados.indices.razaoCinturaEstatura.descricao}
        />

        {/* Card 6: Índice de conicidade */}
        <CardIndicador
          titulo="Índice de conicidade"
          valor={dados.indices.indiceConicidade.valor}
          unidade=""
          status={converterStatus(dados.indices.indiceConicidade.faixa)}
          descricao={dados.indices.indiceConicidade.descricao}
        />
      </div>

      {/* Nota explicativa */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
          Os indicadores são apresentados com base em classificações científicas padronizadas. 
          Valores em <span className="text-green-600 font-medium">verde</span> indicam condição adequada, 
          em <span className="text-yellow-600 font-medium">amarelo</span> atenção moderada, 
          e em <span className="text-red-600 font-medium">vermelho</span> necessidade de acompanhamento.
        </p>
      </div>
    </div>
  );
};

export default GridIndicadores;
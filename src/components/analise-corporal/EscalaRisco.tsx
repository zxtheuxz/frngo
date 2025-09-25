import React from 'react';

interface FaixaRisco {
  label: string;
  valor?: number;
  cor: string;
  inicio: number;
  fim: number;
}

interface EscalaRiscoProps {
  titulo: string;
  valorAtual: number;
  unidade?: string;
  faixas: FaixaRisco[];
  mostrarValorAtual?: boolean;
  resultadoTexto?: string;
  altura?: 'pequena' | 'media' | 'grande';
}

const EscalaRisco: React.FC<EscalaRiscoProps> = ({
  titulo,
  valorAtual,
  unidade = '',
  faixas,
  mostrarValorAtual = true,
  resultadoTexto,
  altura = 'media'
}) => {
  const alturaClasses = {
    pequena: 'h-6',
    media: 'h-8',
    grande: 'h-12'
  };

  const valorMinimo = faixas.length > 0 ? faixas[0].inicio : 0;
  const valorMaximo = faixas.length > 0 ? faixas[faixas.length - 1].fim : 100;
  const amplitudeTotal = valorMaximo - valorMinimo;

  const calcularPosicaoPercentual = (valor: number): number => {
    if (amplitudeTotal <= 0) return 0;
    const posicao = ((valor - valorMinimo) / amplitudeTotal) * 100;
    return Math.max(0, Math.min(100, posicao));
  };

  const posicaoIndicador = calcularPosicaoPercentual(valorAtual);

  const faixaAtual = faixas.find(faixa => valorAtual >= faixa.inicio && valorAtual <= faixa.fim);

  const obterCorClassificacao = (texto?: string): string => {
    if (!texto) return faixaAtual?.cor || '#6B7280';
    const textoLower = texto.toLowerCase();
    if (textoLower.includes('adequado') || textoLower.includes('baixo risco') || textoLower.includes('atenção')) return '#22c55e';
    if (textoLower.includes('moderado')) return '#eab308';
    if (textoLower.includes('alto risco') || textoLower.includes('inadequado') || textoLower.includes('alto') || textoLower.includes('baixo')) return '#ef4444';
    return faixaAtual?.cor || '#6B7280';
  };

  const corPrincipal = obterCorClassificacao(resultadoTexto);

  return (
    <div className="w-full">
      {/* Título e Resultado */}
      <div className="flex items-baseline justify-between mb-1">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
          {titulo}
        </h4>
        {resultadoTexto && (
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            corPrincipal === '#22c55e' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
            corPrincipal === '#eab308' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {resultadoTexto}
          </span>
        )}
      </div>

      {/* Corpo da Escala */}
      <div className="relative">
        {/* Barra de Fundo com Gradiente */}
        <div className={`w-full ${alturaClasses[altura]} rounded-full relative overflow-hidden shadow-inner`}>
          <div
            className="w-full h-full"
            style={{
                background: `linear-gradient(to right, ${faixas.map(f => `${f.cor} ${calcularPosicaoPercentual(f.inicio)}%, ${f.cor} ${calcularPosicaoPercentual(f.fim)}%`).join(', ')})`
            }}
          />
          
          {/* Rótulos de Texto (Corrigido) */}
          <div className="absolute inset-0">
            {faixas.map((faixa, index) => {
              const pontoMedio = (faixa.inicio + faixa.fim) / 2;
              const posicaoPercentual = calcularPosicaoPercentual(pontoMedio);
              if (posicaoPercentual < 5 || posicaoPercentual > 95) return null; // Opcional: esconde rótulos muito nas pontas
              return (
                <div key={index} className="absolute top-0 bottom-0 flex items-center" style={{ left: `${posicaoPercentual}%`, transform: 'translateX(-50%)' }}>
                  <span className="text-xs font-semibold text-white" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>
                    {faixa.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ****************************************************** */}
          {/* ** INÍCIO DO CÓDIGO DO INDICADOR QUE VOCÊ PEDIU ** */}
          {/* ****************************************************** */}
          {mostrarValorAtual && (
            <div
              className="absolute top-0 bottom-0 flex items-center z-10"
              style={{ left: `${posicaoIndicador}%`, transform: 'translateX(-50%)' }}
              title={`Seu resultado: ${valorAtual.toFixed(1)}`}
            >
              {/* Linha preta vertical */}
              <div className="w-0.5 h-full bg-black bg-opacity-70 shadow-lg" />
              
              {/* Triângulo inferior apontando para cima (indicador principal) */}
              <div className="absolute -bottom-2">
                <div 
                  style={{ 
                    width: 0, height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderBottom: '6px solid black',
                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))'
                  }}
                />
              </div>
            </div>
          )}
          {/* ****************************************************** */}
          {/* ** FIM DO CÓDIGO DO INDICADOR ** */}
          {/* ****************************************************** */}
        </div>

        {/* Escala Numérica */}
        <div className="relative mt-2.5 h-4">
            {Array.from(new Set(faixas.flatMap(f => [f.inicio, f.fim])))
            .map((valor) => (
                <div
                key={valor}
                className="absolute text-[10px] text-gray-600 dark:text-gray-400"
                style={{
                    left: `${calcularPosicaoPercentual(valor)}%`,
                    transform: 'translateX(-50%)',
                }}
                >
                {valor.toFixed(1).replace('.0', '')}
                </div>
            ))}
            
             {/* Valor Atual posicionado abaixo do triângulo */}
             <div className="absolute text-xs font-bold text-gray-900 dark:text-white"
                style={{
                    top: '12px',
                    left: `${posicaoIndicador}%`,
                    transform: 'translateX(-50%)'
                }}>
                {valorAtual.toFixed(1)} {unidade}
             </div>
        </div>
      </div>
    </div>
  );
};

export default EscalaRisco;
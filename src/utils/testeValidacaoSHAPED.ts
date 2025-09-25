/**
 * Testes de validação com dados reais do SHAPED
 * Este arquivo testa se nossas correções estão alinhadas com o concorrente
 */

import { analisarComposicaoCorporal, MedidasCorporais, PerfilUsuario } from './calculosComposicaoCorporal';

// Dados do teste comparativo SHAPED vs Site (atualizado com novos resultados)
const PERFIL_TESTE: PerfilUsuario = {
  altura: 1.71, // metros
  peso: 85, // kg
  idade: 28,
  sexo: 'M'
};

// Medidas esperadas após conversão linear→circunferência
const MEDIDAS_TESTE: MedidasCorporais = {
  bracos: 35.1, // Esperado SHAPED
  antebracos: 30.4, // Esperado SHAPED
  cintura: 88.0, // Esperado SHAPED
  quadril: 101.0, // Esperado SHAPED
  coxas: 59.3, // Esperado SHAPED
  panturrilhas: 39.9 // Esperado SHAPED
};

// Valores esperados do SHAPED (atualizados)
const VALORES_SHAPED = {
  imc: 29.0,
  percentualGordura: 20.8, // Valor da nova comparação
  massaMagra: 67.3, // Valor da nova comparação
  massaGorda: 17.7, // Valor da nova comparação
  tmb: 1980, // Valor da nova comparação
  razaoCinturaQuadril: 0.87, // Valor da nova comparação
  razaoCinturaEstatura: 0.51, // Valor da nova comparação
  indiceConicidade: 1.15, // Valor da nova comparação
  shapedScore: 65 // Valor da nova comparação
};

/**
 * Executa teste de validação final e retorna comparativo
 */
export const executarTesteValidacao = () => {
  console.log('🎯 TESTE FINAL DE PRECISÃO - Alinhamento Total com SHAPED\n');
  console.log('📊 Perfil: Homem, 28 anos, 1,71m, 85kg\n');
  
  try {
    const resultado = analisarComposicaoCorporal(MEDIDAS_TESTE, PERFIL_TESTE);
    
    console.log('=== COMPARATIVO FINAL: SHAPED vs NOSSO SITE ===\n');
    
    // IMC
    const diffIMC = Math.abs(resultado.composicao.imc - VALORES_SHAPED.imc);
    console.log(`IMC: SHAPED=${VALORES_SHAPED.imc} | NOSSO=${resultado.composicao.imc} | DIFF=${diffIMC.toFixed(1)}`);
    
    // Percentual de Gordura
    const diffGordura = Math.abs(resultado.composicao.percentualGordura - VALORES_SHAPED.percentualGordura);
    console.log(`% Gordura: SHAPED=${VALORES_SHAPED.percentualGordura}% | NOSSO=${resultado.composicao.percentualGordura}% | DIFF=${diffGordura.toFixed(1)}%`);
    
    // Massa Magra
    const diffMassaMagra = Math.abs(resultado.composicao.massaMagra - VALORES_SHAPED.massaMagra);
    console.log(`Massa Magra: SHAPED=${VALORES_SHAPED.massaMagra}kg | NOSSO=${resultado.composicao.massaMagra}kg | DIFF=${diffMassaMagra.toFixed(1)}kg`);
    
    // Massa Gorda
    const diffMassaGorda = Math.abs(resultado.composicao.massaGorda - VALORES_SHAPED.massaGorda);
    console.log(`Massa Gorda: SHAPED=${VALORES_SHAPED.massaGorda}kg | NOSSO=${resultado.composicao.massaGorda}kg | DIFF=${diffMassaGorda.toFixed(1)}kg`);
    
    // TMB
    const diffTMB = Math.abs(resultado.composicao.tmb - VALORES_SHAPED.tmb);
    console.log(`TMB: SHAPED=${VALORES_SHAPED.tmb}kcal | NOSSO=${resultado.composicao.tmb}kcal | DIFF=${diffTMB.toFixed(0)}kcal`);
    
    // Razão Cintura/Quadril
    const diffRCQ = Math.abs(resultado.indices.razaoCinturaQuadril.valor - VALORES_SHAPED.razaoCinturaQuadril);
    console.log(`RCQ: SHAPED=${VALORES_SHAPED.razaoCinturaQuadril} | NOSSO=${resultado.indices.razaoCinturaQuadril.valor.toFixed(3)} | DIFF=${diffRCQ.toFixed(3)}`);
    
    // Razão Cintura/Estatura
    const diffRCE = Math.abs(resultado.indices.razaoCinturaEstatura.valor - VALORES_SHAPED.razaoCinturaEstatura);
    console.log(`RCE: SHAPED=${VALORES_SHAPED.razaoCinturaEstatura} | NOSSO=${resultado.indices.razaoCinturaEstatura.valor.toFixed(3)} | DIFF=${diffRCE.toFixed(3)}`);
    
    // Índice de Conicidade
    const diffConicidade = Math.abs(resultado.indices.indiceConicidade.valor - VALORES_SHAPED.indiceConicidade);
    console.log(`Conicidade: SHAPED=${VALORES_SHAPED.indiceConicidade} | NOSSO=${resultado.indices.indiceConicidade.valor.toFixed(3)} | DIFF=${diffConicidade.toFixed(3)}`);
    
    // Shaped Score
    const diffScore = Math.abs(resultado.indices.indiceGrimaldi - VALORES_SHAPED.shapedScore);
    console.log(`Score: SHAPED=${VALORES_SHAPED.shapedScore}/100 | NOSSO=${resultado.indices.indiceGrimaldi}/100 | DIFF=${diffScore.toFixed(0)} pontos`);
    
    console.log('\n=== ANÁLISE DOS RESULTADOS (PÓS-RECALIBRAÇÃO) ===');
    
    // Avaliar melhorias com novos critérios
    const melhorias = [];
    if (diffGordura <= 3) melhorias.push('✅ Percentual de gordura excelente (diff ≤ 3%)');
    if (diffTMB <= 100) melhorias.push('✅ TMB quase perfeito (diff ≤ 100kcal)');
    if (diffConicidade <= 0.1) melhorias.push('✅ Índice de conicidade corrigido (diff ≤ 0.1)');
    if (diffScore <= 5) melhorias.push('✅ Score muito próximo do SHAPED (diff ≤ 5 pontos)');
    
    // Avaliar medidas antropométricas
    const diffCinturaPercent = Math.abs((resultado.medidas.cintura - 88) / 88) * 100;
    const diffQuadrilPercent = Math.abs((resultado.medidas.quadril - 101) / 101) * 100;
    const diffBracosPercent = Math.abs((resultado.medidas.bracos - 35.1) / 35.1) * 100;
    
    if (diffCinturaPercent <= 5) melhorias.push('✅ Cintura calibrada perfeitamente (diff ≤ 5%)');
    if (diffQuadrilPercent <= 5) melhorias.push('✅ Quadril calibrado perfeitamente (diff ≤ 5%)');
    if (diffBracosPercent <= 5) melhorias.push('✅ Braços calibrados perfeitamente (diff ≤ 5%)');
    
    const problemas = [];
    if (diffGordura > 3) problemas.push('❌ Percentual de gordura ainda muito diferente');
    if (diffTMB > 100) problemas.push('❌ TMB ainda diferente');
    if (diffConicidade > 0.1) problemas.push('❌ Índice de conicidade ainda incorreto');
    if (diffScore > 5) problemas.push('❌ Score ainda diferente');
    if (diffCinturaPercent > 5) problemas.push('❌ Cintura ainda fora da faixa (> 5% diff)');
    if (diffQuadrilPercent > 5) problemas.push('❌ Quadril ainda fora da faixa (> 5% diff)');
    
    melhorias.forEach(m => console.log(m));
    problemas.forEach(p => console.log(p));
    
    return {
      resultado,
      diferencas: {
        imc: diffIMC,
        percentualGordura: diffGordura,
        massaMagra: diffMassaMagra,
        massaGorda: diffMassaGorda,
        tmb: diffTMB,
        razaoCinturaQuadril: diffRCQ,
        razaoCinturaEstatura: diffRCE,
        indiceConicidade: diffConicidade,
        shapedScore: diffScore
      },
      melhorias: melhorias.length,
      problemas: problemas.length
    };
    
  } catch (error) {
    console.error('❌ Erro durante teste de validação:', error);
    throw error;
  }
};

/**
 * Função para uso em console do navegador
 */
export const testarAlinhamentoSHAPED = () => {
  return executarTesteValidacao();
};
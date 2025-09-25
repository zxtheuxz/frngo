import { ComposicaoCorporal, PerfilUsuario, MedidasCorporais } from './calculosComposicaoCorporal';

export interface IndicadoresMetabolicos {
  taxaMetabolicaAtiva: {
    sedentario: number;
    levementeAtivo: number;
    moderadamenteAtivo: number;
    muitoAtivo: number;
    extremamenteAtivo: number;
  };
  necessidadesCaloricas: {
    perdaPeso: { moderada: number; agressiva: number };
    manutencao: number;
    ganhoPeso: { moderado: number; agressivo: number };
  };
  idadeMetabolica: number;
  eficienciaMetabolica: number;
}

export interface IndicadoresPerformance {
  potencialDesenvolvimentoMuscular: {
    potencialKg: number;
    percentualAdicional: number;
    massaMagraMaxima: number;
  };
  indiceQualidadeMuscular: number;
  simetriaCorporal: {
    membrosSuperiores: number;
    membrosInferiores: number;
    global: number;
  };
  proporcoesIdeaisScore: number;
}

export interface IndicadoresLongevidade {
  indiceEnvelhecimentoSaudavel: number;
  reservaMetabolica: number;
  riscoSarcopenia: 'BAIXO' | 'MODERADO' | 'ALTO';
  velocidadeEnvelhecimento: 'LENTA' | 'NORMAL' | 'ACELERADA';
}

export interface IndicadoresComportamentais {
  facilidadePerdaPeso: 'MUITO_FACIL' | 'FACIL' | 'MODERADA' | 'DIFICIL';
  riscoEfeitoSanfona: 'BAIXO' | 'MODERADO' | 'ALTO';
  tipoMetabolico: 'EFICIENTE' | 'NORMAL' | 'LENTO' | 'ADAPTATIVO';
}

/**
 * Calcula Taxa Metabólica Ativa (TMBA) para diferentes níveis de atividade
 */
export function calcularTaxaMetabolicaAtiva(tmb: number): IndicadoresMetabolicos['taxaMetabolicaAtiva'] {
  return {
    sedentario: Math.round(tmb * 1.2),
    levementeAtivo: Math.round(tmb * 1.375),
    moderadamenteAtivo: Math.round(tmb * 1.55),
    muitoAtivo: Math.round(tmb * 1.725),
    extremamenteAtivo: Math.round(tmb * 1.9)
  };
}

/**
 * Calcula necessidades calóricas para diferentes objetivos
 */
export function calcularNecessidadesCaloricas(tmba: number): IndicadoresMetabolicos['necessidadesCaloricas'] {
  return {
    perdaPeso: {
      moderada: Math.round(tmba - 500), // Déficit de 500 kcal/dia
      agressiva: Math.round(tmba - 750) // Déficit de 750 kcal/dia
    },
    manutencao: tmba,
    ganhoPeso: {
      moderado: Math.round(tmba + 300), // Surplus de 300 kcal/dia
      agressivo: Math.round(tmba + 500) // Surplus de 500 kcal/dia
    }
  };
}

/**
 * Calcula idade metabólica baseada no TMB
 */
export function calcularIdadeMetabolica(
  tmb: number, 
  idade: number, 
  sexo: 'M' | 'F', 
  peso: number
): number {
  // TMB médio esperado para a idade
  const tmbMedioPorIdade = sexo === 'M' 
    ? 1800 - (idade - 25) * 10 // Homens perdem ~10 kcal/ano após 25
    : 1400 - (idade - 25) * 8; // Mulheres perdem ~8 kcal/ano após 25
  
  // Ajustar pelo peso
  const tmbAjustadoPeso = tmbMedioPorIdade * (peso / (sexo === 'M' ? 75 : 65));
  
  // Calcular diferença percentual
  const diferencaPercentual = (tmb - tmbAjustadoPeso) / tmbAjustadoPeso;
  
  // Converter para anos (cada 1% = ~0.5 anos)
  const ajusteAnos = diferencaPercentual * 50;
  
  const idadeMetabolica = Math.round(idade - ajusteAnos);
  
  // Limitar entre 18 e 80 anos
  return Math.max(18, Math.min(80, idadeMetabolica));
}

/**
 * Calcula eficiência metabólica (TMB por kg de massa magra)
 */
export function calcularEficienciaMetabolica(tmb: number, massaMagra: number): number {
  return Math.round((tmb / massaMagra) * 10) / 10;
}

/**
 * Calcula potencial de desenvolvimento muscular
 */
export function calcularPotencialMuscular(
  perfil: PerfilUsuario,
  massaMagra: number
): IndicadoresPerformance['potencialDesenvolvimentoMuscular'] {
  const { altura, sexo, idade } = perfil;
  
  // Fórmula de Casey Butt para potencial muscular máximo natural
  // Simplificada para uso prático
  const fatorIdade = Math.max(0.7, 1 - (idade - 25) * 0.01);
  const fatorSexo = sexo === 'M' ? 1 : 0.75;
  
  // Massa magra máxima teórica
  const massaMagraMaxima = (altura * 100 - 100) * 0.95 * fatorIdade * fatorSexo;
  
  // Potencial adicional
  const potencialKg = Math.max(0, massaMagraMaxima - massaMagra);
  const percentualAdicional = (potencialKg / massaMagra) * 100;
  
  return {
    potencialKg: Math.round(potencialKg * 10) / 10,
    percentualAdicional: Math.round(percentualAdicional),
    massaMagraMaxima: Math.round(massaMagraMaxima * 10) / 10
  };
}

/**
 * Calcula índice de qualidade muscular
 */
export function calcularIndiceQualidadeMuscular(
  massaMagra: number,
  medidas: MedidasCorporais
): number {
  // Volume muscular estimado baseado nas circunferências
  const volumeEstimado = (
    medidas.bracos * 2 +
    medidas.antebracos * 1.5 +
    medidas.coxas * 3 +
    medidas.panturrilhas * 2
  ) / 10;
  
  // IQM = massa magra / volume estimado
  const iqm = massaMagra / volumeEstimado;
  
  return Math.round(iqm * 100) / 100;
}

/**
 * Calcula simetria corporal
 */
export function calcularSimetriaCorporal(medidas: MedidasCorporais): IndicadoresPerformance['simetriaCorporal'] {
  // Assumindo que as medidas são médias entre os lados
  // Simulando pequenas diferenças naturais (0-5%)
  const diferencaMembrosSuperiores = 2; // 2% de diferença típica
  const diferencaMembrosInferiores = 3; // 3% de diferença típica
  
  const simetriaSuperiores = 100 - diferencaMembrosSuperiores;
  const simetriaInferiores = 100 - diferencaMembrosInferiores;
  const simetriaGlobal = (simetriaSuperiores + simetriaInferiores) / 2;
  
  return {
    membrosSuperiores: simetriaSuperiores,
    membrosInferiores: simetriaInferiores,
    global: Math.round(simetriaGlobal)
  };
}

/**
 * Calcula score de proporções ideais
 */
export function calcularProporcoesIdeaisScore(
  medidas: MedidasCorporais,
  perfil: PerfilUsuario
): number {
  const { sexo } = perfil;
  
  // Proporções ideais clássicas (baseadas em estudos de estética)
  const ideais = sexo === 'M' ? {
    bracoCintura: 0.5, // Braço = 50% da cintura
    cinturaQuadril: 0.85, // C/Q ideal masculino
    coxaCintura: 0.75, // Coxa = 75% da cintura
    panturrilhaBraco: 1.0 // Panturrilha = braço
  } : {
    bracoCintura: 0.4, // Braço = 40% da cintura
    cinturaQuadril: 0.7, // C/Q ideal feminino
    coxaCintura: 0.8, // Coxa = 80% da cintura
    panturrilhaBraco: 0.95 // Panturrilha ligeiramente menor
  };
  
  // Calcular proporções reais
  const proporcoes = {
    bracoCintura: medidas.bracos / medidas.cintura,
    cinturaQuadril: medidas.cintura / medidas.quadril,
    coxaCintura: medidas.coxas / medidas.cintura,
    panturrilhaBraco: medidas.panturrilhas / medidas.bracos
  };
  
  // Calcular desvios
  let score = 100;
  Object.keys(ideais).forEach(key => {
    const ideal = ideais[key as keyof typeof ideais];
    const real = proporcoes[key as keyof typeof proporcoes];
    const desvio = Math.abs(ideal - real) / ideal * 100;
    score -= desvio * 0.25; // Cada desvio de 1% reduz 0.25 pontos
  });
  
  return Math.max(0, Math.round(score));
}

/**
 * Calcula índice de envelhecimento saudável
 */
export function calcularIndiceEnvelhecimentoSaudavel(
  composicao: ComposicaoCorporal,
  perfil: PerfilUsuario
): number {
  const { idade } = perfil;
  
  // Fatores que influenciam envelhecimento saudável
  const fatorMassaMagra = Math.min(100, (composicao.massaMagra / (perfil.peso * 0.7)) * 100);
  const fatorGordura = Math.max(0, 100 - Math.abs(composicao.percentualGordura - 20) * 2);
  const fatorTMB = Math.min(100, (composicao.tmb / 1500) * 100);
  
  // Média ponderada
  const indice = (fatorMassaMagra * 0.4 + fatorGordura * 0.3 + fatorTMB * 0.3);
  
  return Math.round(indice);
}

/**
 * Calcula reserva metabólica
 */
export function calcularReservaMetabolica(
  tmb: number,
  perfil: PerfilUsuario
): number {
  // TMB máximo teórico para o peso
  const tmbMaximoTeorico = perfil.peso * 30; // ~30 kcal/kg é alto
  
  // Reserva = capacidade de aumento
  const reserva = ((tmbMaximoTeorico - tmb) / tmb) * 100;
  
  return Math.max(0, Math.round(reserva));
}

/**
 * Avalia risco de sarcopenia
 */
export function avaliarRiscoSarcopenia(
  massaMagra: number,
  perfil: PerfilUsuario
): IndicadoresLongevidade['riscoSarcopenia'] {
  const { altura, idade, sexo } = perfil;
  
  // Índice de massa magra
  const imm = massaMagra / Math.pow(altura, 2);
  
  // Limiares ajustados por idade e sexo
  const limiarBaixo = sexo === 'M' 
    ? 17.5 - (Math.max(0, idade - 50) * 0.1)
    : 15.0 - (Math.max(0, idade - 50) * 0.08);
  
  const limiarModerado = limiarBaixo + 2;
  
  if (imm >= limiarModerado) return 'BAIXO';
  if (imm >= limiarBaixo) return 'MODERADO';
  return 'ALTO';
}

/**
 * Avalia velocidade de envelhecimento
 */
export function avaliarVelocidadeEnvelhecimento(
  indiceEnvelhecimento: number,
  idade: number
): IndicadoresLongevidade['velocidadeEnvelhecimento'] {
  // Ajustar expectativa por idade
  const expectativaPorIdade = Math.max(50, 100 - (idade - 30) * 0.5);
  
  const razao = indiceEnvelhecimento / expectativaPorIdade;
  
  if (razao >= 1.1) return 'LENTA';
  if (razao >= 0.9) return 'NORMAL';
  return 'ACELERADA';
}

/**
 * Avalia facilidade de perda de peso
 */
export function avaliarFacilidadePerdaPeso(
  composicao: ComposicaoCorporal,
  perfil: PerfilUsuario
): IndicadoresComportamentais['facilidadePerdaPeso'] {
  // Fatores que facilitam perda de peso
  const eficienciaMetabolica = composicao.tmb / perfil.peso;
  const percentualGordura = composicao.percentualGordura;
  
  // Score baseado em eficiência metabólica e gordura atual
  let score = 0;
  
  // Eficiência metabólica (quanto maior, melhor)
  if (eficienciaMetabolica >= 25) score += 50;
  else if (eficienciaMetabolica >= 22) score += 35;
  else if (eficienciaMetabolica >= 20) score += 20;
  else score += 10;
  
  // Percentual de gordura (moderado é melhor que extremos)
  if (percentualGordura >= 15 && percentualGordura <= 25) score += 50;
  else if (percentualGordura >= 10 && percentualGordura <= 30) score += 35;
  else if (percentualGordura >= 8 && percentualGordura <= 35) score += 20;
  else score += 10;
  
  if (score >= 80) return 'MUITO_FACIL';
  if (score >= 60) return 'FACIL';
  if (score >= 40) return 'MODERADA';
  return 'DIFICIL';
}

/**
 * Avalia risco de efeito sanfona
 */
export function avaliarRiscoEfeitoSanfona(
  facilidadePerda: IndicadoresComportamentais['facilidadePerdaPeso'],
  reservaMetabolica: number
): IndicadoresComportamentais['riscoEfeitoSanfona'] {
  // Combinação de facilidade de perda e reserva metabólica
  if (facilidadePerda === 'DIFICIL' && reservaMetabolica < 20) return 'ALTO';
  if (facilidadePerda === 'MODERADA' && reservaMetabolica < 30) return 'MODERADO';
  if (facilidadePerda === 'MUITO_FACIL' || reservaMetabolica > 40) return 'BAIXO';
  return 'MODERADO';
}

/**
 * Determina tipo metabólico
 */
export function determinarTipoMetabolico(
  eficienciaMetabolica: number,
  reservaMetabolica: number
): IndicadoresComportamentais['tipoMetabolico'] {
  if (eficienciaMetabolica >= 30) return 'EFICIENTE';
  if (eficienciaMetabolica >= 25 && reservaMetabolica >= 30) return 'ADAPTATIVO';
  if (eficienciaMetabolica >= 22) return 'NORMAL';
  return 'LENTO';
}

/**
 * Função principal que calcula todos os indicadores avançados
 */
export function calcularIndicadoresAvancados(
  composicao: ComposicaoCorporal,
  perfil: PerfilUsuario,
  medidas: MedidasCorporais
) {
  // Indicadores Metabólicos
  const taxaMetabolicaAtiva = calcularTaxaMetabolicaAtiva(composicao.tmb);
  const tmbaModeradamente = taxaMetabolicaAtiva.moderadamenteAtivo;
  const necessidadesCaloricas = calcularNecessidadesCaloricas(tmbaModeradamente);
  const idadeMetabolica = calcularIdadeMetabolica(composicao.tmb, perfil.idade, perfil.sexo, perfil.peso);
  const eficienciaMetabolica = calcularEficienciaMetabolica(composicao.tmb, composicao.massaMagra);
  
  // Indicadores de Performance
  const potencialDesenvolvimentoMuscular = calcularPotencialMuscular(perfil, composicao.massaMagra);
  const indiceQualidadeMuscular = calcularIndiceQualidadeMuscular(composicao.massaMagra, medidas);
  const simetriaCorporal = calcularSimetriaCorporal(medidas);
  const proporcoesIdeaisScore = calcularProporcoesIdeaisScore(medidas, perfil);
  
  // Indicadores de Longevidade
  const indiceEnvelhecimentoSaudavel = calcularIndiceEnvelhecimentoSaudavel(composicao, perfil);
  const reservaMetabolica = calcularReservaMetabolica(composicao.tmb, perfil);
  const riscoSarcopenia = avaliarRiscoSarcopenia(composicao.massaMagra, perfil);
  const velocidadeEnvelhecimento = avaliarVelocidadeEnvelhecimento(indiceEnvelhecimentoSaudavel, perfil.idade);
  
  // Indicadores Comportamentais
  const facilidadePerdaPeso = avaliarFacilidadePerdaPeso(composicao, perfil);
  const riscoEfeitoSanfona = avaliarRiscoEfeitoSanfona(facilidadePerdaPeso, reservaMetabolica);
  const tipoMetabolico = determinarTipoMetabolico(eficienciaMetabolica, reservaMetabolica);
  
  return {
    metabolicos: {
      taxaMetabolicaAtiva,
      necessidadesCaloricas,
      idadeMetabolica,
      eficienciaMetabolica
    } as IndicadoresMetabolicos,
    performance: {
      potencialDesenvolvimentoMuscular,
      indiceQualidadeMuscular,
      simetriaCorporal,
      proporcoesIdeaisScore
    } as IndicadoresPerformance,
    longevidade: {
      indiceEnvelhecimentoSaudavel,
      reservaMetabolica,
      riscoSarcopenia,
      velocidadeEnvelhecimento
    } as IndicadoresLongevidade,
    comportamentais: {
      facilidadePerdaPeso,
      riscoEfeitoSanfona,
      tipoMetabolico
    } as IndicadoresComportamentais
  };
}
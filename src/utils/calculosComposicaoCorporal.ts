import { calcularIndiceConicidade } from './calculosGrimaldi';

export interface MedidasCorporais {
  bracos: number;
  antebracos: number;
  cintura: number;
  quadril: number;
  coxas: number;
  panturrilhas: number;
}

export interface PerfilUsuario {
  altura: number; // em metros
  peso: number; // em kg
  idade: number;
  sexo: 'M' | 'F';
}

export interface ComposicaoCorporal {
  percentualGordura: number;
  massaGorda: number;
  massaMagra: number;
  tmb: number; // Taxa Metabólica Basal
  imc: number;
  aguaCorporal: number;
  aguaCorporalPercentual: number;
}

export interface ClassificacaoRisco {
  valor: number;
  faixa: 'BAIXO_RISCO' | 'ATENCAO' | 'MODERADO' | 'ALTO_RISCO' | 'ADEQUADO' | 'INADEQUADO';
  descricao: string;
}

export interface IndicesRisco {
  razaoCinturaQuadril: ClassificacaoRisco;
  razaoCinturaEstatura: ClassificacaoRisco;
  indiceConicidade: ClassificacaoRisco;
  indiceMassaMagra: ClassificacaoRisco;
  indiceMassaGorda: ClassificacaoRisco;
  cintura: ClassificacaoRisco;
  quadril: ClassificacaoRisco;
  indiceGrimaldi: number; // Índice Grimaldi de 0-100 (renomeado de shapedScore)
}

export interface ResultadoAnalise {
  composicao: ComposicaoCorporal;
  indices: IndicesRisco;
  medidas: MedidasCorporais;
  perfil: PerfilUsuario;
  indicadoresAvancados?: any; // Opcional para manter compatibilidade
}

/**
 * Classifica percentual de gordura baseado nas faixas científicas padronizadas
 */
export const classificarPercentualGordura = (percentual: number): ClassificacaoRisco => {
  if (percentual <= 11.1) {
    return {
      valor: percentual,
      faixa: 'ATENCAO',
      descricao: 'Atenção'
    };
  } else if (percentual <= 18.2) {
    return {
      valor: percentual,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (percentual <= 21.9) {
    return {
      valor: percentual,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: percentual,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica cintura baseado nas faixas científicas padronizadas (masculino apenas conforme documento)
 */
export const classificarCintura = (cintura: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Usando valores do documento de referência - masculino apenas
  const faixas = {
    baixoRisco: 94,
    moderado: 102
  };

  if (cintura <= faixas.baixoRisco) {
    return {
      valor: cintura,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (cintura <= faixas.moderado) {
    return {
      valor: cintura,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: cintura,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica quadril baseado nas faixas científicas padronizadas (masculino apenas conforme documento)
 */
export const classificarQuadril = (quadril: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Usando valores do documento de referência - masculino apenas
  const faixas = {
    atencao: 97.2,
    baixoRisco: 104.8,
    moderado: 108.6
  };

  if (quadril <= faixas.atencao) {
    return {
      valor: quadril,
      faixa: 'ATENCAO',
      descricao: 'Atenção'
    };
  } else if (quadril <= faixas.baixoRisco) {
    return {
      valor: quadril,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (quadril <= faixas.moderado) {
    return {
      valor: quadril,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: quadril,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica razão cintura/estatura baseado nas faixas padronizadas
 */
export const classificarRazaoCinturaEstatura = (razao: number): ClassificacaoRisco => {
  if (razao <= 0.5) {
    return {
      valor: razao,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo risco'
    };
  } else if (razao <= 0.55) {
    return {
      valor: razao,
      faixa: 'MODERADO',
      descricao: 'Moderado'
    };
  } else {
    return {
      valor: razao,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto risco'
    };
  }
};

/**
 * Classifica razão cintura/quadril baseado nas faixas padronizadas
 */
export const classificarRazaoCinturaQuadril = (razao: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Conforme documento: adequado ≤ 0,9 para ambos os sexos
  if (razao <= 0.9) {
    return {
      valor: razao,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: razao,
      faixa: 'INADEQUADO',
      descricao: 'Inadequado'
    };
  }
};

/**
 * Classifica índice de conicidade baseado nas faixas padronizadas
 */
export const classificarIndiceConicidade = (indice: number): ClassificacaoRisco => {
  if (indice < 1.25) {
    return {
      valor: indice,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: indice,
      faixa: 'INADEQUADO',
      descricao: 'Inadequado'
    };
  }
};

/**
 * Classifica índice de massa magra baseado nas faixas padronizadas
 */
export const classificarIndiceMassaMagra = (imm: number, sexo: 'M' | 'F'): ClassificacaoRisco => {
  // Baseado em literatura científica com diferenciação por gênero:
  // Masculino: > 17,8 kg/m² é adequado | Feminino: > 14,8 kg/m² é adequado
  // IMPORTANTE: IMM alto é BOM (mais massa magra = melhor saúde)
  
  const limite = sexo === 'M' ? 17.8 : 14.8;
  
  if (imm >= limite) {
    return {
      valor: imm,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: imm,
      faixa: 'BAIXO_RISCO', // Abaixo do ideal - pouca massa magra
      descricao: 'Baixo'
    };
  }
};

/**
 * Classifica índice de massa gorda baseado nas faixas padronizadas
 */
export const classificarIndiceMassaGorda = (img: number): ClassificacaoRisco => {
  // Conforme documento: Baixo ≤ 2,2 | Adequado 2,2 - 4,4 | Alto > 4,4 kg/m²
  if (img <= 2.2) {
    return {
      valor: img,
      faixa: 'BAIXO_RISCO',
      descricao: 'Baixo'
    };
  } else if (img <= 4.4) {
    return {
      valor: img,
      faixa: 'ADEQUADO',
      descricao: 'Adequado'
    };
  } else {
    return {
      valor: img,
      faixa: 'ALTO_RISCO',
      descricao: 'Alto'
    };
  }
};

/**
 * Calcula percentual de gordura usando Deurenberg (1991) com ajustes proprietários
 * Baseado na engenharia reversa do Shaped
 */
export const calcularPercentualGordura = (medidas: MedidasCorporais, perfil: PerfilUsuario): number => {
  const { altura, peso, idade, sexo } = perfil;
  
  // Calcular IMC
  const imc = peso / Math.pow(altura, 2);
  
  // Calcular relação cintura/quadril
  const relacaoCinturaQuadril = medidas.cintura / medidas.quadril;
  
  // Fórmula base de Deurenberg (1991)
  const sexoFator = sexo === 'M' ? 1 : 0;
  const percentualBase = (1.20 * imc) + (0.23 * idade) - (10.8 * sexoFator) - 5.4;
  
  // Aplicar ajustes proprietários baseados em sexo e relação cintura/quadril
  let fatorAjuste = 1.0;
  
  if (sexo === 'M') {
    // Homens: redução baseada em C/Q (quanto menor C/Q, maior redução)
    if (relacaoCinturaQuadril <= 0.84) {
      fatorAjuste = 0.75; // Redução de 25% para ectomorfos
    } else if (relacaoCinturaQuadril >= 0.87) {
      fatorAjuste = 0.83; // Redução de 17% para endomorfos
    } else {
      // Interpolação linear entre 0.84 e 0.87
      fatorAjuste = 0.75 + (0.08 * (relacaoCinturaQuadril - 0.84) / 0.03);
    }
  } else {
    // Mulheres: leve aumento baseado em C/Q
    if (relacaoCinturaQuadril <= 0.78) {
      fatorAjuste = 1.04; // Aumento de 4%
    } else if (relacaoCinturaQuadril <= 0.85) {
      // Interpolação linear entre 0.78 e 0.85
      fatorAjuste = 1.04 + (0.04 * (relacaoCinturaQuadril - 0.78) / 0.07);
    } else {
      fatorAjuste = 1.08; // Aumento de 8% para C/Q alto
    }
  }
  
  const percentualFinal = percentualBase * fatorAjuste;
  
  // Garantir que o resultado esteja dentro de faixas realistas
  return Math.max(3, Math.min(50, Math.round(percentualFinal * 10) / 10));
};

/**
 * Calcula a composição corporal completa
 */
export const calcularComposicaoCorporal = (
  medidas: MedidasCorporais, 
  perfil: PerfilUsuario
): ComposicaoCorporal => {
  const { altura, peso } = perfil;
  
  // Percentual de gordura
  const percentualGordura = calcularPercentualGordura(medidas, perfil);
  
  // Massas
  const massaGorda = (percentualGordura / 100) * peso;
  const massaMagra = peso - massaGorda;
  
  // TMB usando Cunningham (1980) - alinhado com SHAPED
  // TMB = 500 + (22 × Massa Magra em kg)
  const tmb = 500 + (22 * massaMagra);
  
  // IMC
  const imc = peso / Math.pow(altura, 2);
  
  // Água corporal (72,3% da massa magra em mamíferos)
  const aguaCorporal = massaMagra * 0.723;
  const aguaCorporalPercentual = (aguaCorporal / peso) * 100;
  
  return {
    percentualGordura: Number(percentualGordura.toFixed(1)),
    massaGorda: Number(massaGorda.toFixed(1)),
    massaMagra: Number(massaMagra.toFixed(1)),
    tmb: Number(tmb.toFixed(0)),
    imc: Number(imc.toFixed(1)),
    aguaCorporal: Number(aguaCorporal.toFixed(1)),
    aguaCorporalPercentual: Number(aguaCorporalPercentual.toFixed(1))
  };
};

/**
 * Calcula Índice Grimaldi (Shaped Score) baseado em todos os indicadores (0-100)
 * Reformulado para ser MUITO mais rigoroso e realista
 */
export const calcularShapedScore = (indices: Omit<IndicesRisco, 'indiceGrimaldi'>): number => {
  let pontuacao = 0;
  let indicadoresRuins = 0;
  let indicadoresBons = 0;
  const totalIndicadores = 6;

  // Cada indicador vale até ~16.67 pontos base
  const pontosPorIndicador = 100 / totalIndicadores;

  // Função para pontuar cada indicador de forma MUITO mais rigorosa
  const pontuar = (faixa: string): number => {
    switch (faixa) {
      case 'ADEQUADO':
      case 'BAIXO_RISCO':
        indicadoresBons++;
        return pontosPorIndicador; // Pontos completos apenas para indicadores bons
      case 'MODERADO':
      case 'ATENCAO':
        indicadoresRuins++;
        return pontosPorIndicador * 0.25; // MUITO reduzido: de 0.45 para 0.25
      case 'ALTO_RISCO':
      case 'INADEQUADO':
        indicadoresRuins++;
        return pontosPorIndicador * 0.05; // MUITO reduzido: de 0.20 para 0.05
      default:
        indicadoresRuins++;
        return 0; // Zero pontos para casos extremos
    }
  };

  // Aplicar pontuação rigorosa para cada indicador
  pontuacao += pontuar(indices.indiceMassaGorda.faixa);
  pontuacao += pontuar(indices.indiceMassaMagra.faixa);
  pontuacao += pontuar(indices.razaoCinturaQuadril.faixa);
  pontuacao += pontuar(indices.razaoCinturaEstatura.faixa);
  pontuacao += pontuar(indices.indiceConicidade.faixa);
  pontuacao += pontuar(indices.cintura.faixa);

  // Penalizações SEVERAS por múltiplos indicadores ruins
  if (indicadoresRuins >= 2) {
    pontuacao *= 0.75; // -25% se 2+ indicadores ruins
  }
  if (indicadoresRuins >= 3) {
    pontuacao *= 0.65; // -35% adicional se 3+ indicadores ruins (total -52%)
  }
  if (indicadoresRuins >= 4) {
    pontuacao *= 0.55; // -45% adicional se 4+ indicadores ruins (total -71%)
  }
  if (indicadoresRuins >= 5) {
    pontuacao *= 0.40; // -60% adicional se 5+ indicadores ruins (total -84%)
  }

  // Bônus MUITO reduzido - baseado apenas em indicadores bons
  let bonusBase = 0;
  if (indicadoresBons >= 5) {
    bonusBase = 8; // Bônus pequeno apenas se quase todos forem bons
  } else if (indicadoresBons >= 4) {
    bonusBase = 5;
  } else if (indicadoresBons >= 3) {
    bonusBase = 2;
  }
  // Sem bônus se menos de 3 indicadores bons
  
  pontuacao += bonusBase;

  // Curva de distribuição MUITO mais restritiva
  // Valores acima de 75 são extremamente difíceis de alcançar
  if (pontuacao > 75) {
    pontuacao = 75 + (pontuacao - 75) * 0.15; // Compressão muito maior
  }
  if (pontuacao > 85) {
    pontuacao = 85 + (pontuacao - 85) * 0.05; // Quase impossível passar de 85
  }

  return Math.round(Math.max(15, Math.min(100, pontuacao))); // Mínimo de 15, máximo de 100
};

/**
 * Calcula índices de risco cardiometabólico (igual ao concorrente)
 */
export const calcularIndicesRisco = (
  medidas: MedidasCorporais, 
  perfil: PerfilUsuario,
  composicao: ComposicaoCorporal
): IndicesRisco => {
  const { altura, sexo } = perfil;
  const alturaCm = altura * 100;
  
  // Cálculos de índices e classificações
  const razaoCinturaQuadril = medidas.cintura / medidas.quadril;
  const razaoCinturaEstatura = medidas.cintura / alturaCm;
  const indiceConicidade = calcularIndiceConicidade(medidas.cintura, perfil.peso, altura);
  const indiceMassaMagra = composicao.massaMagra / Math.pow(altura, 2);
  const indiceMassaGorda = composicao.massaGorda / Math.pow(altura, 2);

  // Classificações baseadas nas faixas científicas (igual ao concorrente)
  const indices: Omit<IndicesRisco, 'indiceGrimaldi'> = {
    razaoCinturaQuadril: classificarRazaoCinturaQuadril(razaoCinturaQuadril, sexo),
    razaoCinturaEstatura: classificarRazaoCinturaEstatura(razaoCinturaEstatura),
    indiceConicidade: classificarIndiceConicidade(indiceConicidade),
    indiceMassaMagra: classificarIndiceMassaMagra(indiceMassaMagra, sexo),
    indiceMassaGorda: classificarIndiceMassaGorda(indiceMassaGorda),
    cintura: classificarCintura(medidas.cintura, sexo),
    quadril: classificarQuadril(medidas.quadril, sexo)
  };

  // Calcular Shaped Score
  const indiceGrimaldi = calcularShapedScore(indices);

  return {
    ...indices,
    indiceGrimaldi
  };
};


/**
 * Função principal que realiza toda a análise corporal
 */
export const analisarComposicaoCorporal = (
  medidas: MedidasCorporais,
  perfil: PerfilUsuario,
  incluirIndicadoresAvancados: boolean = false
): ResultadoAnalise => {
  
  // Validar dados de entrada
  if (!medidas || !perfil) {
    throw new Error('Dados insuficientes para análise');
  }
  
  if (perfil.altura <= 0 || perfil.peso <= 0 || perfil.idade <= 0) {
    throw new Error('Dados do perfil inválidos');
  }
  
  // Verificar se todas as 6 medidas estão disponíveis (igual ao concorrente)
  const medidasEssenciais = ['bracos', 'antebracos', 'cintura', 'quadril', 'coxas', 'panturrilhas'];
  for (const medida of medidasEssenciais) {
    if (!medidas[medida as keyof MedidasCorporais] || medidas[medida as keyof MedidasCorporais] <= 0) {
      throw new Error(`Medida essencial ausente: ${medida}`);
    }
  }
  
  try {
    // Calcular composição corporal
    const composicao = calcularComposicaoCorporal(medidas, perfil);
    
    // Calcular índices de risco
    const indices = calcularIndicesRisco(medidas, perfil, composicao);
    
    const resultado: ResultadoAnalise = {
      composicao,
      indices,
      medidas,
      perfil
    };
    
    // Adicionar indicadores avançados se solicitado
    if (incluirIndicadoresAvancados) {
      // Importação dinâmica para evitar carregar se não for necessário
      import('./indicadoresAvancados').then(module => {
        resultado.indicadoresAvancados = module.calcularIndicadoresAvancados(composicao, perfil, medidas);
      }).catch(error => {
        console.error('Erro ao carregar indicadores avançados:', error);
      });
    }
    
    return resultado;
    
  } catch (error) {
    console.error('Erro durante análise corporal:', error);
    throw new Error('Erro durante o cálculo da composição corporal');
  }
};

/**
 * Gera interpretações textuais dos resultados (igual ao concorrente)
 */
export const interpretarResultados = (resultado: ResultadoAnalise): {
  imc: string;
  percentualGordura: string;
  massaMagra: string;
  indiceGrimaldi: string;
} => {
  const { composicao, indices, perfil } = resultado;
  
  // Interpretação do IMC
  let imcInterpretacao: string;
  if (composicao.imc < 18.5) imcInterpretacao = 'Baixo peso';
  else if (composicao.imc < 25) imcInterpretacao = 'Eutrofia';
  else if (composicao.imc < 30) imcInterpretacao = 'Sobrepeso';
  else imcInterpretacao = 'Obesidade';
  
  // Interpretação do percentual de gordura baseado nas faixas científicas corretas
  let gorduraInterpretacao: string;
  if (composicao.percentualGordura <= 11.1) {
    gorduraInterpretacao = 'Atenção';
  } else if (composicao.percentualGordura <= 18.2) {
    gorduraInterpretacao = 'Baixo risco';
  } else if (composicao.percentualGordura <= 21.9) {
    gorduraInterpretacao = 'Moderado';
  } else {
    gorduraInterpretacao = 'Alto risco';
  }
  
  // Interpretação da massa magra
  const massaMagraInterpretacao = indices.indiceMassaMagra.descricao;
  
  // Interpretação MUITO mais rigorosa do Índice Grimaldi
  let indiceGrimaldiInterpretacao: string;
  if (indices.indiceGrimaldi >= 80) indiceGrimaldiInterpretacao = 'Excepcional'; // Apenas atletas de elite (1-2%)
  else if (indices.indiceGrimaldi >= 70) indiceGrimaldiInterpretacao = 'Excelente'; // Pessoas em ótima forma (5-8%)
  else if (indices.indiceGrimaldi >= 60) indiceGrimaldiInterpretacao = 'Bom'; // Boa forma física (15%)
  else if (indices.indiceGrimaldi >= 45) indiceGrimaldiInterpretacao = 'Regular'; // Média populacional (40%)
  else if (indices.indiceGrimaldi >= 30) indiceGrimaldiInterpretacao = 'Abaixo da média'; // (25%)
  else indiceGrimaldiInterpretacao = 'Necessita atenção urgente'; // (7-10%)
  
  return {
    imc: imcInterpretacao,
    percentualGordura: gorduraInterpretacao,
    massaMagra: massaMagraInterpretacao,
    indiceGrimaldi: indiceGrimaldiInterpretacao
  };
};

/**
 * Obtém valores de referência para a tabela de indicadores (igual ao concorrente)
 */
export const obterValoresReferencia = (sexo: 'M' | 'F') => {
  return {
    indiceMassaGorda: '< 4,4 kg/m²',
    indiceMassaMagra: sexo === 'M' ? '> 17,8 kg/m²' : '> 14,8 kg/m²',
    razaoCinturaEstatura: '< 0,5',
    razaoCinturaQuadril: sexo === 'M' ? '< 0,9' : '< 0,8',
    indiceConicidade: '< 1,25'
  };
};
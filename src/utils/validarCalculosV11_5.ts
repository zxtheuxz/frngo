// Validação dos cálculos MediaPipe v11.5
// Teste com dados do Alan (Ectomorfo - IMC 22.8)

interface TestCase {
  nome: string;
  altura: number; // metros
  peso: number; // kg
  sexo: 'M' | 'F';
  medidasManuais: {
    cintura: number;
    quadril: number;
    bracos: number;
    antebracos: number;
    coxas: number;
    panturrilhas: number;
  };
  medidasEsperadas: {
    cintura: number;
    quadril: number;
    bracos: number;
    antebracos: number;
    coxas: number;
    panturrilhas: number;
  };
}

// Proporções base
const PROPORCOES_ANTROPOMETRICAS = {
  homem: { 
    cintura: 0.503,
    quadril: 0.556,
    bracos: 0.187,
    antebracos: 0.169,
    coxas: 0.326,
    panturrilhas: 0.218
  }
};

// Fatores de correção v11.5
const FATORES_CORRECAO_MEDIAPIPE = {
  ectomorfo: {
    cintura: 0.92,
    quadril: 0.90,
    bracos: 0.96,
    antebracos: 0.99,
    coxas: 0.96,
    panturrilhas: 0.93
  }
};

export function validarCalculosEctomorfo() {
  const alan: TestCase = {
    nome: 'Alan',
    altura: 1.78,
    peso: 72,
    sexo: 'M',
    medidasManuais: {
      cintura: 82.5,
      quadril: 90.0,
      bracos: 31.0,
      antebracos: 26.7,
      coxas: 54.0,
      panturrilhas: 35.5
    },
    medidasEsperadas: {
      cintura: 82.3,   // Alvo: próximo de 82.5
      quadril: 89.9,   // Alvo: próximo de 90.0
      bracos: 32.0,    // Alvo: próximo de 31.0
      antebracos: 29.6, // Alvo: próximo de 26.7
      coxas: 56.0,     // Alvo: próximo de 54.0
      panturrilhas: 36.1 // Alvo: próximo de 35.5
    }
  };

  const imc = alan.peso / (alan.altura * alan.altura);
  console.log(`\n🧪 VALIDAÇÃO MediaPipe v11.5 - ${alan.nome}`);
  console.log(`IMC: ${imc.toFixed(1)} (Ectomorfo)`);
  console.log(`\n📐 Cálculos:`);

  const resultados: any = {};
  
  Object.keys(PROPORCOES_ANTROPOMETRICAS.homem).forEach(key => {
    const tipo = key as keyof typeof PROPORCOES_ANTROPOMETRICAS.homem;
    
    // Cálculo v11.5 para ectomorfos
    const proporcaoBase = PROPORCOES_ANTROPOMETRICAS.homem[tipo];
    const medidaBase = alan.altura * 100 * proporcaoBase;
    const fatorCorrecao = FATORES_CORRECAO_MEDIAPIPE.ectomorfo[tipo];
    const medidaFinal = medidaBase * fatorCorrecao;
    
    resultados[tipo] = medidaFinal;
    
    const erroManual = Math.abs(medidaFinal - alan.medidasManuais[tipo]);
    const erroPercentual = (erroManual / alan.medidasManuais[tipo]) * 100;
    
    console.log(`\n${tipo.toUpperCase()}:`);
    console.log(`  Base: ${alan.altura}m × 100 × ${proporcaoBase} = ${medidaBase.toFixed(1)}cm`);
    console.log(`  Correção: ${medidaBase.toFixed(1)} × ${fatorCorrecao} = ${medidaFinal.toFixed(1)}cm`);
    console.log(`  Manual: ${alan.medidasManuais[tipo]}cm | Erro: ${erroManual.toFixed(1)}cm (${erroPercentual.toFixed(1)}%)`);
    console.log(`  ${erroPercentual < 5 ? '✅' : '⚠️'} ${erroPercentual < 5 ? 'Excelente!' : 'Acima de 5%'}`);
  });

  // Resumo
  const erroMedio = Object.keys(resultados).reduce((acc, key) => {
    const tipo = key as keyof typeof alan.medidasManuais;
    return acc + Math.abs(resultados[tipo] - alan.medidasManuais[tipo]);
  }, 0) / Object.keys(resultados).length;

  console.log(`\n📊 RESUMO:`);
  console.log(`Erro médio: ${erroMedio.toFixed(1)}cm`);
  console.log(`${erroMedio < 3 ? '🏆 SUCESSO!' : '⚠️ Precisa melhorar'}`);
  
  return resultados;
}

// Executar validação
validarCalculosEctomorfo();
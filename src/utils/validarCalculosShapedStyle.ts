import { analisarComposicaoCorporal, MedidasCorporais, PerfilUsuario } from './calculosComposicaoCorporal';

interface PerfilTeste {
  nome: string;
  perfil: PerfilUsuario;
  medidas: MedidasCorporais;
  esperado: {
    percentualGordura: number;
    tmb: number;
    massaMagra: number;
    indiceGrimaldi: number;
  };
}

const perfisDeValidacao: PerfilTeste[] = [
  {
    nome: 'Alan (Ectomorfo)',
    perfil: {
      altura: 1.79,
      peso: 73,
      idade: 28,
      sexo: 'M'
    },
    medidas: {
      bracos: 29.5,
      antebracos: 26.5,
      cintura: 78,
      quadril: 93,
      coxas: 51,
      panturrilhas: 35
    },
    esperado: {
      percentualGordura: 13.1,
      tmb: 1896,
      massaMagra: 63.5,
      indiceGrimaldi: 85
    }
  },
  {
    nome: 'Matheus (Endomorfo)',
    perfil: {
      altura: 1.71,
      peso: 85,
      idade: 28,
      sexo: 'M'
    },
    medidas: {
      bracos: 33,
      antebracos: 29,
      cintura: 89,
      quadril: 102,
      coxas: 58,
      panturrilhas: 39
    },
    esperado: {
      percentualGordura: 20.8,
      tmb: 1980,
      massaMagra: 67.3,
      indiceGrimaldi: 72
    }
  },
  {
    nome: 'Katheryne (Eutrófica)',
    perfil: {
      altura: 1.65,
      peso: 65,
      idade: 33,
      sexo: 'F'
    },
    medidas: {
      bracos: 28,
      antebracos: 24,
      cintura: 72,
      quadril: 92,
      coxas: 55,
      panturrilhas: 36
    },
    esperado: {
      percentualGordura: 32.1,
      tmb: 1470,
      massaMagra: 44.1,
      indiceGrimaldi: 78
    }
  }
];

export function validarCalculosComShapedStyle() {
  console.log('🔬 VALIDAÇÃO DOS CÁLCULOS vs SHAPED\n');
  console.log('═'.repeat(80));
  
  const resultados: any[] = [];
  
  perfisDeValidacao.forEach(perfilTeste => {
    console.log(`\n📊 ${perfilTeste.nome}`);
    console.log('-'.repeat(40));
    
    try {
      const resultado = analisarComposicaoCorporal(perfilTeste.medidas, perfilTeste.perfil);
      
      // Comparar valores
      const comparacoes = {
        percentualGordura: {
          calculado: resultado.composicao.percentualGordura,
          esperado: perfilTeste.esperado.percentualGordura,
          diferenca: Math.abs(resultado.composicao.percentualGordura - perfilTeste.esperado.percentualGordura)
        },
        tmb: {
          calculado: resultado.composicao.tmb,
          esperado: perfilTeste.esperado.tmb,
          diferenca: Math.abs(resultado.composicao.tmb - perfilTeste.esperado.tmb)
        },
        massaMagra: {
          calculado: resultado.composicao.massaMagra,
          esperado: perfilTeste.esperado.massaMagra,
          diferenca: Math.abs(resultado.composicao.massaMagra - perfilTeste.esperado.massaMagra)
        },
        indiceGrimaldi: {
          calculado: resultado.indices.indiceGrimaldi,
          esperado: perfilTeste.esperado.indiceGrimaldi,
          diferenca: Math.abs(resultado.indices.indiceGrimaldi - perfilTeste.esperado.indiceGrimaldi)
        }
      };
      
      // Exibir resultados
      console.log(`\n% Gordura: ${comparacoes.percentualGordura.calculado}% (esperado: ${comparacoes.percentualGordura.esperado}%) - Δ ${comparacoes.percentualGordura.diferenca.toFixed(1)}%`);
      console.log(`TMB: ${comparacoes.tmb.calculado} kcal (esperado: ${comparacoes.tmb.esperado} kcal) - Δ ${comparacoes.tmb.diferenca.toFixed(0)} kcal`);
      console.log(`Massa Magra: ${comparacoes.massaMagra.calculado} kg (esperado: ${comparacoes.massaMagra.esperado} kg) - Δ ${comparacoes.massaMagra.diferenca.toFixed(1)} kg`);
      console.log(`Índice Grimaldi: ${comparacoes.indiceGrimaldi.calculado}/100 (esperado: ${comparacoes.indiceGrimaldi.esperado}/100) - Δ ${comparacoes.indiceGrimaldi.diferenca}`);
      
      // Status
      const statusGordura = comparacoes.percentualGordura.diferenca <= 1 ? '✅' : '❌';
      const statusTMB = comparacoes.tmb.diferenca <= 10 ? '✅' : '❌';
      const statusMassaMagra = comparacoes.massaMagra.diferenca <= 1 ? '✅' : '❌';
      const statusGrimaldi = comparacoes.indiceGrimaldi.diferenca <= 5 ? '✅' : '❌';
      
      console.log(`\nStatus: ${statusGordura} Gordura | ${statusTMB} TMB | ${statusMassaMagra} Massa Magra | ${statusGrimaldi} Índice`);
      
      // Detalhes adicionais
      console.log(`\nDetalhes calculados:`);
      console.log(`- IMC: ${resultado.composicao.imc} kg/m²`);
      console.log(`- Massa Gorda: ${resultado.composicao.massaGorda} kg`);
      console.log(`- Água Corporal: ${resultado.composicao.aguaCorporal}L (${resultado.composicao.aguaCorporalPercentual}%)`);
      console.log(`- C/Q Ratio: ${(perfilTeste.medidas.cintura / perfilTeste.medidas.quadril).toFixed(2)}`);
      
      resultados.push({
        nome: perfilTeste.nome,
        comparacoes,
        todosOk: statusGordura === '✅' && statusTMB === '✅' && statusMassaMagra === '✅' && statusGrimaldi === '✅'
      });
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${perfilTeste.nome}:`, error);
    }
  });
  
  // Resumo final
  console.log('\n\n📈 RESUMO FINAL');
  console.log('═'.repeat(80));
  
  const todosPassaram = resultados.every(r => r.todosOk);
  
  if (todosPassaram) {
    console.log('✅ TODOS OS PERFIS PASSARAM NA VALIDAÇÃO!');
    console.log('🎯 Sistema alinhado com padrão Shaped');
  } else {
    console.log('⚠️  Alguns perfis precisam de ajustes:');
    resultados.forEach(r => {
      if (!r.todosOk) {
        console.log(`- ${r.nome}: Verificar cálculos`);
      }
    });
  }
  
  // Médias de diferença
  const mediasDiferenca = {
    percentualGordura: resultados.reduce((acc, r) => acc + r.comparacoes.percentualGordura.diferenca, 0) / resultados.length,
    tmb: resultados.reduce((acc, r) => acc + r.comparacoes.tmb.diferenca, 0) / resultados.length,
    massaMagra: resultados.reduce((acc, r) => acc + r.comparacoes.massaMagra.diferenca, 0) / resultados.length,
    indiceGrimaldi: resultados.reduce((acc, r) => acc + r.comparacoes.indiceGrimaldi.diferenca, 0) / resultados.length
  };
  
  console.log('\n📊 Médias de diferença:');
  console.log(`- % Gordura: ${mediasDiferenca.percentualGordura.toFixed(1)}%`);
  console.log(`- TMB: ${mediasDiferenca.tmb.toFixed(0)} kcal`);
  console.log(`- Massa Magra: ${mediasDiferenca.massaMagra.toFixed(1)} kg`);
  console.log(`- Índice Grimaldi: ${mediasDiferenca.indiceGrimaldi.toFixed(0)} pontos`);
  
  return resultados;
}

// Para executar no console do navegador:
// import('./validarCalculosShapedStyle').then(m => m.validarCalculosComShapedStyle())
// Definição dos métodos de treino
export type MetodoTreino = {
  nome: string;
  descricao: string;
};

// Mapeamento dos métodos de treino
export const metodosTreino: Record<string, MetodoTreino> = {
  "DROP-SET": {
    nome: "DROP-SET",
    descricao: "CONSISTE EM REALIZAR UMA SEQUÊNCIA DE SÉRIES SEGUIDAS SEM INTERVALO, APENAS BAIXANDO A CARGA, GERALMENTE É UTILIZADO APENAS NA ÚLTIMA SÉRIE, ENTÃO NO SEU TREINO ESTARÁ ASSIM  POR EXEMPLO: 3 X 12/10/8+8+8 ENTÃO QUANDO CHEGAR A SÉRIE 8+8+8 VOCÊ IRÁ REALIZAR 8 REPETIÇÕES, BAIXAR A CARGA, REALIZAR MAIS 8 REPETIÇÕES, BAIXAR A CARGA, E REALIZAR MAIS 8 REPETIÇÕES E ACABOU."
  },
  "REST-PAUSE": {
    nome: "REST-PAUSE",
    descricao: "CONSISTE EM REALIZAR UMA SÉRIE A MAIS DEPOIS DE UMA PAUSA DE 15 SEGUNDOS, GERALMENTE É FEITO NA ÚLTIMA SÉRIE OU NAS DUAS ÚLTIMAS, ENTÃO NO SEU TREINO VAI APARECER ASSIM, EXEMPLO: 3 X 12/10/8+4 ENTÃO VOCÊ IRÁ REALIZAR 8 REPETIÇÕES, DAR UMA PAUSA DE 15 SEGUNDOS, E REALIZAR MAIS 4 REPETIÇÕES, VALE LEMBRAR QUE SE VOCÊ CONSEGUIR REALIZAR MAIS DE 4 REPETIÇÕES NO FINAL, VOCÊ DEVE AUMENTAR A CARGA."
  },
  "BI-SET": {
    nome: "BI-SET",
    descricao: "CONSISTE EM REALIZAR DOIS EXERCÍCIOS SEGUIDOS, SEM PAUSA ENTRE ELES, VOCÊ IRÁ REALIZAR UM EXERCÍCIO E LOGO EM SEGUIDA O OUTRO EXERCÍCIO, E SÓ DEPOIS VOCÊ VAI DESCANSAR. ENTÃO NO SEU TREINO VAI APARECER ASSIM, EXEMPLO: CADEIRA EXTENSORA + LEG PRESS HORIZONTAL CRUCIFIXO MÁQUINA + SUPINO RETO MÁQUINA"
  },
  "PICO DE CONTRAÇÃO": {
    nome: "PICO DE CONTRAÇÃO",
    descricao: "CONSISTE EM REALIZAR UMA PAUSA NO INÍCIO OU FINAL DO MOVIMENTO, CONTRAINDO O MÚSCULO PELO TEMPO DETERMINADO NA SÉRIE, QUE GERALMENTE É DE 2 SEGUNDOS, E ESSA PAUSA COM CONTRAÇÃO É FEITA EM TODAS AS REPETIÇÕES."
  },
  "ISOMETRIA": {
    nome: "ISOMETRIA",
    descricao: "CONSISTE EM FAZER UMA PAUSA NA EXECUÇÃO, E MANTER ESSA POSIÇÃO POR UM TEMPO DETERMINADO, EM ALGUMA FASE DO MOVIMENTO QUE PODE SER NO INICIO OU NO FINAL DO MOVIMENTO. ENTÃO PODE APARECER ASSIM NO SEU TREINO, EXEMPLO: FAÇA UMA PAUSA EMBAIXO POR 2 SEGUNDOS."
  },
  "PAUSA": {
    nome: "PAUSA",
    descricao: "CONSISTE EM FAZER UMA PAUSA NA EXECUÇÃO, E MANTER ESSA POSIÇÃO POR UM TEMPO DETERMINADO, EM ALGUMA FASE DO MOVIMENTO QUE PODE SER NO INICIO OU NO FINAL DO MOVIMENTO. ENTÃO PODE APARECER ASSIM NO SEU TREINO, EXEMPLO: FAÇA UMA PAUSA EMBAIXO POR 2 SEGUNDOS."
  }
  };

// Função para extrair o nome do método de treino de um texto
export const extrairMetodoTreino = (texto: string): string | null => {
  // Lista dos métodos para procurar no texto
  const metodos = Object.keys(metodosTreino);
  
  // Procura por um método no texto (entre parênteses com "MÉTODO" antes)
  const regexMetodo = /\(MÉTODO\s+([^)]+)\)/i;
  const matchMetodo = texto.match(regexMetodo);
  
  if (matchMetodo && matchMetodo[1]) {
    const metodoEncontrado = matchMetodo[1].trim();
    
    // Verificar se o método encontrado está na nossa lista de métodos
    for (const metodo of metodos) {
      if (metodoEncontrado.toUpperCase().includes(metodo)) {
        return metodo;
      }
    }
  }
  
  return null;
};

// Função para encontrar o método de treino a partir do nome do exercício
export const encontrarMetodoTreino = (nomeExercicio: string): MetodoTreino | null => {
  const metodo = extrairMetodoTreino(nomeExercicio);
  
  if (metodo && metodosTreino[metodo]) {
    return metodosTreino[metodo];
  }
  
  return null;
};

// Função para formatar o método de treino para o PDF
export const formatarMetodoPDF = (nomeExercicio: string): { metodoNome: string, descricao: string } | null => {
  const metodo = extrairMetodoTreino(nomeExercicio);
  
  if (metodo && metodosTreino[metodo]) {
    // Versão mais compacta da descrição para o PDF
    // Remover frases como "ENTÃO NO SEU TREINO ESTARÁ ASSIM POR EXEMPLO:"
    let descricao = metodosTreino[metodo].descricao;
    
    // Limpar e formatar a descrição para ficar mais compacta
    descricao = descricao
      .replace(/ENTÃO NO SEU TREINO(.*?)EXEMPLO:?/gi, '')
      .replace(/ENTÃO NO SEU TREINO VAI APARECER ASSIM(.*?):/gi, '')
      .replace(/ENTÃO PODE APARECER ASSIM NO SEU TREINO(.*?):/gi, '')
      .replace(/ENTÃO QUANDO CHEGAR A SÉRIE/gi, 'NA SÉRIE')
      .replace(/VOCÊ IRÁ/gi, 'DEVE-SE')
      .replace(/VALE LEMBRAR QUE/gi, 'NOTA:')
      .trim();
    
    return {
      metodoNome: metodosTreino[metodo].nome,
      descricao: descricao
    };
  }
  
  return null;
}; 
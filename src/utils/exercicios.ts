// Mapeamento de exercícios para seus respectivos links de vídeo
export const exerciciosVideos: Record<string, string> = {};

// Extrair o nome do exercício a partir do texto de um parágrafo
export const extrairNomeExercicio = (paragrafo: string): string => {
  if (!paragrafo || !paragrafo.trim()) return '';
  
  // Verificar se o parágrafo começa com número seguido de traço (padrão de exercício)
  const contemNumeroExercicio = /^\d+\s*[-–—]\s*/.test(paragrafo);
  if (!contemNumeroExercicio) return '';
  
  // Regex mais precisa para extrair o nome do exercício, buscando pelo padrão de repetições
  const regexNomeExercicio = /^\d+\s*[-–—]\s*([^0-9]+?)(?:\s+\d+\s*X|$)/i;
  const match = paragrafo.match(regexNomeExercicio);
  
  let nomeExercicio = '';
  if (match && match[1]) {
    nomeExercicio = match[1].trim();
  } else {
    // Fallback para o método anterior caso a regex não funcione
    nomeExercicio = paragrafo.replace(/^\d+\s*[-–—]\s*/, '').trim();
    
    // Remover todo o texto após o padrão de repetições, caso exista
    // Isso captura padrões como "X 10", "X 12/10/8", "X 15 (CADA LADO)" etc.
    const padraoRepeticoes = /\s+\d+\s*X\s*\d+.*$/i;
    if (padraoRepeticoes.test(nomeExercicio)) {
      nomeExercicio = nomeExercicio.replace(padraoRepeticoes, '').trim();
    } else if (nomeExercicio.includes(' X ')) {
      // Último caso: se ainda houver um 'X' isolado, corta tudo depois dele
      nomeExercicio = nomeExercicio.split(/\s+X\s+/)[0].trim();
    }
  }
  
  // Limpeza adicional: remover instruções entre parênteses e após palavras-chave que indicam variações
  nomeExercicio = nomeExercicio
    .replace(/\([^)]*\)/g, '')                // Remove qualquer texto entre parênteses
    .replace(/\s+OU\s+.*$/i, '')              // Remove texto após "OU"
    .replace(/\s+COM\s+.*$/i, '')             // Opcional: remove texto após "COM" se necessário
    .replace(/\s+MÉTODO\s+.*$/i, '')          // Remove texto após "MÉTODO"
    .replace(/\s+ISOMETRIA\s+.*$/i, '')       // Remove texto após "ISOMETRIA"
    .replace(/\s+CADA\s+LADO\s*$/i, '')       // Remove "CADA LADO" no final
    .replace(/\s{2,}/g, ' ')                  // Normaliza espaços múltiplos
    .trim();
  
  return nomeExercicio;
};

// Função para encontrar o vídeo associado a um exercício
export const encontrarVideoDoExercicio = (textoExercicio: string, origem?: 'WEB' | 'PDF' | 'APP'): string | null => {
  console.log(`[encontrarVideoDoExercicio] Buscando vídeo para: "${textoExercicio}"`);
  
  if (!textoExercicio) {
    console.log('[encontrarVideoDoExercicio] Texto vazio, retornando null');
    return null;
  }

  // Verificar cache local para esta sessão
  const cacheKey = `video_${textoExercicio.trim()}`;
  const cachedResult = sessionStorage.getItem(cacheKey);
  if (cachedResult) {
    console.log(`[encontrarVideoDoExercicio] Retornando do cache: ${cachedResult}`);
    return cachedResult === "null" ? null : cachedResult;
  }

  // Normalizar o texto para comparação
  const normalizarTextoCompleto = (texto: string): string => {
    console.log(`[encontrarVideoDoExercicio] Normalizando texto: "${texto}"`);
    return texto
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-–—]/g, ' ')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };
  
  // Extrair apenas o nome essencial do exercício
  const extrairNomeEssencial = (texto: string): string => {
    // Remover informações de séries e repetições: "3x15" ou "4x12/10/8"
    let limpo = texto.replace(/\d+\s*[xX]\s*[\d\/]+(?:\s*a\s*\d+)?/g, '');
    
    // Remover parênteses e seu conteúdo
    limpo = limpo.replace(/\([^)]*\)/g, '');
    
    // Remover números no início (geralmente são números de ordem)
    limpo = limpo.replace(/^\s*\d+\s*[-–—]?\s*/, '');
    
    // Normalizar e retornar
    return normalizarTextoCompleto(limpo);
  };

  // Processar o texto do exercício
  const textoNormalizado = normalizarTextoCompleto(textoExercicio);
  const nomeEssencial = extrairNomeEssencial(textoExercicio);
  
  console.log(`[encontrarVideoDoExercicio] Texto normalizado: "${textoNormalizado}"`);
  console.log(`[encontrarVideoDoExercicio] Nome essencial: "${nomeEssencial}"`);
  
  // Lista de vídeos disponíveis (adicionar aqui novos exercícios)
  const videosExercicios: Record<string, string> = {
    "CRUCIFIXO MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "PANTURRILHA VERTICAL MÁQUINA 4 X 15/12/10/8": "",
    "REMADA BAIXA SENTADA ABERTA C/ BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=xlSCLS4UgBA",
    "BANCO SCOOTT MÁQUINA   3 X 15/12/10": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "SUPINO INCLINADO MÁQUINA 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "LEG PRESS 45     3 X 15/12/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/HALTER  3 X 10": "https://www.youtube.com/watch?v=M6klWQd1Nrs",
    "EXTENSÃO DE QUADRIL C/ PERNA ESTICADA NO CABO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=NuC_xIFPpqs",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X 12/12/10/10": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "PUXADA ABERTA P/FRENTE C/ BARRA RETA 3X 10": "https://www.youtube.com/watch?v=6_Y1w6wzJzI",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA 3 X 12": "https://www.youtube.com/watch?v=xer-xfrcgO8",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "STIFF NA BARRA  3 X 12": "",
    "SUPINO INCLINADO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 15/12/10 (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "SUPINO INCLINADO NA BARRA LONGA 3 X 15/12/10": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 30SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "SUPINO RETO NA BARRA LONGA   3 X 10": "https://www.youtube.com/watch?v=K5Gr_tzcvy8",
    "ROSCA BÍCEPS ALTERNADA C/HALTER + TRÍCEPS FRANCES SIMULTANEO C/HALTER 3 X 10+10 (MÉTODO BI-SET)": "",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTERES  3 X 10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "CADEIRA EXTENSORA   3 X 12": "",
    "SUPINO RETO C/BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=K5Gr_tzcvy8",
    "SUPINO INCLINADO NA MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=oBNqW9hy7O4",
    "ABDUÇÃO DE OMBROS COM HALTERES 3 X 10": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA  3 X 10 (CADA LADO)": "",
    "FLEXÃO DE OMBROS ALTERNADA COM HALTERES  3 X 10": "https://www.youtube.com/watch?v=amOk6hSUjGo",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "PANTURRILHA VERTICAL NA MÁQUINA 3 X 12": "",
    "HIPEREXTENSÃO DE TRONCO NO SOLO    3 X 12": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "ELEVAÇÃO PÉLVICA 4 X 12 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "PANTURRILHA VERTICAL NA MÁQUINA    3 X 12": "",
    "AGACHAMENTO NO BANCO C/ANILHA   3 X 10": "",
    "SUPINO RETO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=18T4pt1ENzA",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "CADEIRA ABDUTORA     3 X 12": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "STIFF NA BARRA 3 X 12/12/10/10": "",
    "TRÍCEPS NO PULLEY C/ BARRA    3 X 10": "https://www.youtube.com/watch?v=XK_XD-2kXq8",
    "ELEVAÇÃO PÉLVICA NO SOLO (PESO CORPORAL)    3 X 12": "https://www.youtube.com/watch?v=QFww0pQxy8A",
    "CADEIRA EXTENSORA 3 X 12/12/10+10+10 (MÉTODO DROP-SET)": "",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/ HALTER    3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "CRUCIFIXO INVERSO SENTADO C/ HALTERES   3 X 12": "https://www.youtube.com/watch?v=IAz2nP5nNU0",
    "LEG PRESS HORIZONTAL 4 X 12/12/10/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "REMADA MÁQUINA (PEG.ABERTA) 3 X 10": "https://www.youtube.com/watch?v=GIMMkVqz1aQ",
    "REMADA ABERTA MÁQUINA + CRUCIFIXO INVERSO EM PÉ C/HALTERES 4 X 10+10": "",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "PUXADA ABERTA NA BARRA RETA   3 X 15/12/10": "",
    "AGACHAMENTO NO SMITH 4 X 12/10/10/8": "",
    "ROSCA BÍCEPS DIRETO C/BARRA W + TRÍCEPS FRANCES C/HALTER 3 X 10+10 (MÉTODO": "",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "CADEIRA ABDUTORA 3 X 15/12/10": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "EXTENSÃO DE QUADRIL NO CABO (TRONCO DEITADO) C/PERNA ESTICADA 3 X 12/10/8": "https://www.youtube.com/watch?v=NuC_xIFPpqs",
    "ABDUÇÃO DE OMBROS INCLINADO C/HALTER 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=dwA6ncX1ZBE",
    "SUPINO RETO C/ HALTERES   3 X 15/12/10": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "TRICEPS CORDA 3 X 12/10/8": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "PUXADA SUPINADA NA BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=oBVw5EPpqDk",
    "CADEIRA ABDUTORA EM PÉ C/STEP 3 X 15": "",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 80SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "CADEIRA ABDUTORA    3 X 15/12/10": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "PUXADA ABERTA NA BARRA RETA 3 X 15/12/10": "",
    "TRÍCEPS CORDA    3 X 10": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "PANTURRILHA VERTICAL MÁQUINA  4 X 15/12/10/8": "",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL) 3 X 10 (CADA LADO)": "",
    "CADEIRA FLEXORA  3 X 15/12/10": "",
    "PUXADA ABERTA NA BARRA RETA  3 X 15/12/10": "",
    "LEG PRESS 45 4 X 12/12/10/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "TRICEPS FRANCES UNILATERAL C/ HALTERES    3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "PULLOVER NO CABO C/ BARRA RETA OU CORDA 3 X 12/10/8": "",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE   3 X 12": "",
    "LEG PRESS 45      3 X 10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "AGACHAMENTO MÁQUINA   3 X 12": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 50 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 20 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "FLEXÃO DE BRAÇOS DE JOELHOS NO SOLO  3 X 6": "https://www.youtube.com/watch?v=D6Ink0DD2wk",
    "LEG PRESS 45 3 X 15/12/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "PUXADA FECHADA NO TRIÂNGULO   3 X 10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "LEG PRESS 45   3 X 12": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "LEVANTAMENTO TERRA SUMÔ C/BARRA LONGA 4 X 12/12/10/10": "",
    "SUPINO INCLINADO NA BARRA LONGA    3 X 15/12/10": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 20 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "AGACHAMENTO MÁQUINA  3 X 12": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)    3 X 20 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "PUXADA ABERTA C/ BARRA RETA   3 X 10": "",
    "STIFF NA BARRA 3 X 12/10/8": "",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "EXTENSÃO DE QUADRIL C/JOELLHO DOBRADO C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=i3RVsPcMx6c",
    "DESENVOLVIMENTO DE OMBROS C/HALTER 3 X 12/10/8": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "CRUCIFIXO MÁQUINA    3 X 15/12/10": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "ROSCA BÍCEPS SIMULTÂNEO NO BANCO INCLINADO C/HALTER + TRÍCEPS TESTA DEITADO": "",
    "ABDUÇÃO DE OMBROS SENTADO C/ HALTER 3 X12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=M6klWQd1Nrs",
    "CRUCIFIXO MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "FLEXÃO DE OMBROS ALTERNADA C/HALTER 3 X 10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA)   3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "EXTENSÃO DE QUADRIL NO CABO COM PERNA ESTICADA 3 X 15/12/10": "https://www.youtube.com/watch?v=uNYRrcgazq0",
    "AGACHAMENTO NO BANCO (PESO CORPORAL)    3 X 12": "",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 70SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "ABDUÇÃO DE OMBROS C/ HALTERES 3 X 8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "LEG PRESS 45  3 X 15/12/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "CADEIRA FLEXORA 4 X 12/10/8/6+6+6 (MÉTODO DROP-SET)": "",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=HHrqIjcud8Q",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12/10/10": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "PANTURRILHA VERTICAL NO STEP UNILATERAL C/HALTER 3 X 12 (CADA LADO)": "",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL)  3 X 10 (CADA LADO)": "",
    "CADEIRA EXTENSORA 3 X 12": "",
    "REMADA ABERTA NA MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "ROSCA BÍCEPS DIRETA NO BANCO INCLINADO C/HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=_d_Krw8UsG4",
    "ROSCA BÍCEPS DIRETA C/BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA) 3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "PUXADA ABERTA P/ FRENTE NA BARRA RETA 3 X 15/12/10": "https://www.youtube.com/watch?v=6_Y1w6wzJzI",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 15/12/10": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)     3 X 20 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES   3 X 15/12/10  (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "PUXADA FECHADA C/TRIÂNGULO 3 X 12/10/8": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "ROSCA BÍCEPS DIRETA NA BARRA W    3 X 10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "PUXADA P/FRENTE ABERTA NA BARRA H 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL   3 X 15/12/10": "",
    "EXTENSAO DE QUADRIL NO CABO (TRONCO DEITADO) C/JOELHO ESTICADO 3 X 12": "",
    "TRÍCEPS FRANCES SIMULTÂNEO C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "ROSCA BÍCEPS NO BANCO INCLINADO + TRÍCEPS CORDA 3 X 10+10": "",
    "STIFF NA BARRA 4 X 12/12/10/10": "",
    "ROSCA BÍCEPS C/ HALTERES + TRÍCEPS TESTA C/ BARRA W 3 X 10+10 (MÉTODO BI-SET)": "",
    "ROSCA BÍCEPS C/ROTAÇÃO + TRÍCEPS TESTA C/HALTER 3 X 10+10": "",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "SUPINO RETO C/HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "MESA FLEXORA 4 X 15/12/10/8+8+8 (MÉTODO DROP-SET)": "",
    "AGACHAMENTO MÁQUINA 4 X 12/10/8": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA)  3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "CADEIRA ABDUTORA 3 X 12": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL  3 X 12/10/8": "",
    "ABDUÇÃO DE OMBROS C/ HALTER 3 X 8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "AGACHAMENTO LIVRE NA BARRA LONGA 3 X 15/12/10": "",
    "CRUCIFIXO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "STIFF NA BARRA 3 X 12": "",
    "TRÍCEPS FRANCES SIMULTÂNEO C/ HALTER   3 X 10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "AFUNDO UNILATERAL (PESO CORPORAL)   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=D2X9AK5vpY4",
    "TRÍCEPS TESTA C/ BARRA W OU RETA  3 X 10": "https://www.youtube.com/watch?v=303nfEvX4Hk",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO 3 X 12/10/10": "https://www.youtube.com/watch?v=dwA6ncX1ZBE",
    "REMADA CURVADA C/BARRA RETA 3 X 12/10/10": "https://www.youtube.com/watch?v=DCcPPo6Es0U",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 30 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "EXTENSÃO DE QUADRIL CHUTANDO NO CABO 3 X 12/10/8": "https://www.youtube.com/watch?v=pTeLIFXl6OY",
    "AGACHAMENTO LIVRE NA BARRA LONGA    3 X 12": "",
    "PUXADA FECHADA NO TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "CRUCIFIXO MÁQUINA + FLEXÃO DE BRAÇOS 3 X 12+12 (MÉTODO BI-SET)": "",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)    3 X 40 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 40 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "STIFF NA BARRA   3 X 10": "",
    "ROSCA BÍCEPS C/ROTAÇÃO + TRÍCEPS TESTA C/HALTER 3 X 10+10 (MÉTODO BI-SET)": "",
    "SUPINO INCLINADO C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "FLEXÃO DE OMBROS (PEG.SUPINADA) NA POLIA BAIXA 3 X 12/10/10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "BANCO SCOOTT MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "REMADA BAIXA SENTADO C/TRIÂNGULO   3 X 10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "BANCO SCOTT MÁQUINA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "LEG PRESS 45    3 X 12": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "CROSSOVER 3 X 12/10/8": "https://www.youtube.com/watch?v=Te6lga3E10o",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 12/10/8": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "PUXADA ABERTA NA BARRA    3 X 10": "",
    "ABDUÇÃO DE OMBROS C/ HALTERES    3 X 6": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES   3 X 15/12/10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "AGACHAMENTO SUMÔ C/ KETTEBELL OU HALTERES   3 X 12": "",
    "PANTURRILHA VERTICAL NA MÁQUINA   4 X 15/12/12/10": "",
    "BANCO SCOTT MÁQUINA  3 X 10": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "PUXADA ARTICULADA ABERTA 3 X 12/10/8": "https://www.youtube.com/watch?v=m3lJFyfL7UM",
    "ABDUÇÃODE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=nWvJiwPMElw",
    "AGACHAMENTO NO BANCO (PESO CORPORAL) 3 X 12": "",
    "REMADA BAIXA SENTADA C/TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "ABDUÇÃO DE OMBROS COM HALTERES 3 X 8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "ABDUÇÃO DE QUADRIL C/ CANELEIRA DEITADO DE LADO NO SOLO 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "TRÍCEPS FRÂNCES UNILATERAL C/ HALTERES  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER  3 X 10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "HACK MACHINE 3 X 15/12/10": "https://www.youtube.com/watch?v=frpKOJ4XNwc",
    "AFUNDO UNILATERAL (PESO CORPORAL)   3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=D2X9AK5vpY4",
    "CADEIRA FLEXORA 4 X 12/12/10/10": "",
    "CADEIRA EXTENSORA     3 X 12": "",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 30 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "CRUCIFIXO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "SUPINO INCLINADO NO SMITH 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "SUPINO RETO MÁQUINA    3 X 10": "https://www.youtube.com/watch?v=18T4pt1ENzA",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 60SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "ROSCA BÍCEPS DIRETA NA BARRA W  3 X 15/12/10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)   3 X 60 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "CADEIRA EXTENSORA 3 X 15/12/10": "",
    "PULLDOWN NO CABO C/BARRA RETA OU CORDA 3 X 12/10/8": "https://www.youtube.com/watch?v=fMKXfiUcE5k",
    "MESA FLEXORA    3 X 15/12/10": "",
    "EXERCÍCIO OSTRA C/ MINIBAND NO SOLO (DEITADO DE LADO) 3 X 12 (CADA LADO)": "",
    "CADEIRA EXTENSORA  3 X 12/10/8": "",
    "CRUCIFIXO MÁQUINA + SUPINO RETO MÁQUINA 3 X 12+10 (MÉTODO BI-SET)": "",
    "CRUCIFIXO INVERSO NO BANCO INCLINADO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=yD3j00pe1lo",
    "FLEXÃO DE OMBROS ALTERNADA COM HALTERES 3 X 10": "https://www.youtube.com/watch?v=amOk6hSUjGo",
    "MOBILIDADE DE COLUNA TORÁCICA    3 X 10": "",
    "LEG PRESS 45 3 X 12/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)    3 X 20 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL 4 X 12/10/10/8": "",
    "SUPINO INCLINADO NA BARRA LONGA 3 X 10": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "CADEIRA FLEXORA 4 X 15/12/10/10": "",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO C/HALTER 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=dwA6ncX1ZBE",
    "ABDUÇÃO DE OMBROS C/ TRONCO INCLINADO": "https://www.youtube.com/watch?v=nWvJiwPMElw",
    "ABDUÇÃODE OMBROS C/TRONCO INCLINADO UNILATERAL   3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=nWvJiwPMElw",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO  3 X 12/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "CADEIRA EXTENSORA 8+8+8 (MÉTODO DROP-SET)": "",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 40 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG.ABERTA) 3 X 12/10/8": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "PANTURRILHA VERTICAL NA MÁQUINA 4 X 15/12/12/10": "",
    "ABDUÇÃO DE OMBROS COM HALTERES  3 X 8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "SUPINO INCLINADO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "SUPINO RETO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 60 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "AGACHAMENTO SUMÔ C/ KETTEBELL OU HALTERES    3 X 10": "",
    "FLEXORA VERTICAL OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "AGACHAMENTO NO SMITH 3 X 12/10/8": "",
    "PUXADA P/FRENTE ARTICULADA 3 X 12/10/8+8+8 (MÉTODO DROP-SET)": "",
    "PANTURRILHA VERTICAL LIVRE (PESO CORPORAL)    3 X 15": "",
    "STIFF NA BARRA 3 X 12/10/10": "",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA 3 X 12/10/8": "https://www.youtube.com/watch?v=uNYRrcgazq0",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADA NO SOLO   3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "EXTENSÃO DE QUADRIL NO CABO EM PÉ 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=Lv3AkVxfDZs",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADO DE LADO NO SOLO  3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "CADEIRA EXTENSORA   3 X 15/12/10": "",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA   3 X 10  (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "ABDUÇÃO DE QUADRIL DEITADO DE LADO C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO    3 X 10": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "EXTENSÃO DE QUADRIL C/ JOELHO DOBRADO NA CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=i3RVsPcMx6c",
    "CADEIRA ABDUTORA   3 X 12": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "SUPINO RETO NA BARRA LONGA 3 X 10": "https://www.youtube.com/watch?v=K5Gr_tzcvy8",
    "REMADA BAIXA SENTADO C/TRIÂNGULO  3 X 15/12/10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "TRICEPS FRANCÊS UNILATERAL C/ HALTER    3 X 10": "https://www.youtube.com/watch?v=yLw2QUuilDU",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 15/12/10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "REMADA ABERTA NA MÁQUINA    3 X 10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X 12/10/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE 3 X 12": "",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO   3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "CADEIRA FLEXORA 3 X 10": "",
    "PUXADA SUPINADA NA BARRA RETA     3 X 10": "https://www.youtube.com/watch?v=oBVw5EPpqDk",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/ HALTER     3 X 10": "https://www.youtube.com/watch?v=_rn_iSVFK0k",
    "CRUCIFIXO MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "BANCO SCOTT MÁQUINA + TRÍCEPS NA BARRA W 3 X 10+10 (MÉTODO BI-SET)": "",
    "CADEIRA FLEXORA 3 X 12": "",
    "ROSCA BÍCEPS DIRETA NA BARRA W   3 X 15/12/10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "CADEIRA FLEXORA 3X 15/12/10": "",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA  3 X 12/10/8": "https://www.youtube.com/watch?v=uNYRrcgazq0",
    "TRÍCEPS FRANCES SIMULTÂNEO C/HALTER 3 X 10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "LEG HORIZONTAL 3 X 12/12/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "SUPINO RETO C/ HALTERES    3 X 10": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "CADEIRA FLEXORA    3 X 10": "",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "MESA FLEXORA 3 X 15/12/10": "",
    "REMADA NO BANCO C/CORDA DEITADO 3 X 12": "",
    "SUPINO INCLINADO MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=oBNqW9hy7O4",
    "REMADA SERROTE C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=7UIZIdbt2k0",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 20SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "AGACHAMENTO MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "DESENVOLVIMENTO DE OMBROS SENTADO C/HALTER   3 X 10": "https://www.youtube.com/watch?v=_rn_iSVFK0k",
    "AGACHAMENTO BÚLGARO (PESO CORPORAL) 3 X 12 (CADA LADO)": "",
    "ROSCA BÍCEPS NO BANCO INCLINADO + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES     3 X 10": "https://www.youtube.com/watch?v=HHrqIjcud8Q",
    "CADEIRA EXTENSORA 4 X 12/10/8/6+6+6 (MÉTODO DRO-PSET)": "",
    "ELEVAÇÃO PÉLVICA MÁQUINA   3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "HACK MACHINE 4 X 12/10/10/8": "https://www.youtube.com/watch?v=frpKOJ4XNwc",
    "CADEIRA ABDUTORA 4 X 12": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "CADEIRA FLEXORA     3 X 12": "",
    "REMADA BAIXA SENTADA ABERTA C/ BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=xlSCLS4UgBA",
    "ABDUÇÃO DE OMBROS C/ HALTER 3 X12/10/8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 40 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "BANCO SCOTT MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "PUXADA FECHADA NO TRIÂNGULO   3 X 15/12/10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "ROSCA BÍCEPS DIRETA NA BARRA W 3 X 10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "TRÍCEPS NO PULLEY C/ BARRA RETA    3 X 10": "https://www.youtube.com/watch?v=XK_XD-2kXq8",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 20 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "RECÚO NO STEP C/HALTERES 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=znVEuP1eWeA",
    "REMADA ABERTA NA MÁQUINA    3 X 12": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "ABDUÇÃO DE OMBROS C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "PULLDOWN NO CABO C/BARRA RETA OU CORDA 3 X 10 (MÉTODO PICO DE CONTRAÇÃO)": "https://www.youtube.com/watch?v=fMKXfiUcE5k",
    "PUXADA ABERTA P/ FRENTE NA BARRA RETA    3 X 15/12/10": "https://www.youtube.com/watch?v=6_Y1w6wzJzI",
    "CRUCIFIXO INVERSO NA MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTER 3 X 12": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "MESA FLEXORA 4 X 15/12/10/10": "",
    "LEG PRESS 45 4 X 12/10/10/8+4 (MÉTODO REST-PAUSE)": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)       3 X 60 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "REMADA ABERTA NA MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "SUPINO INCLINADO C/ HALTERES     3 X 10": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "HIPEREXTENSÃO DE TRONCO NO SOLO 3 X 12": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "RDL C/HALTER E APOIO NO STEP 4 X 10 (CADA LADO)": "",
    "TRICEPS C/ BARRA W 3 X 10": "https://www.youtube.com/watch?v=z_hyDJTAOAI",
    "BANCO SCOTT MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=kPeen4ULL_Q",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA   3 X 10  (CADA LADO)": "",
    "CADEIRA FLEXORA 4 X 12/10/10/8": "",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 10 (CADA": "",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL 3 X 10": "",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA DOBRADA 3 X 15": "https://www.youtube.com/watch?v=i3RVsPcMx6c",
    "AGACHAMENTO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "TRICEPS NA BARRA RETA 3 X 12/10/8": "https://www.youtube.com/watch?v=XK_XD-2kXq8",
    "REMADA MÁQUINA (PEG. ABERTA) 3 X 10": "https://www.youtube.com/watch?v=GIMMkVqz1aQ",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "CADEIRA EXTENSORA 4 X 15/12/10/8+8+8 (MÉTODO DROP-SET)": "",
    "ABDUÇÃO DE OMBROS C/HALTER 3 X 12/10/8+8+8 (MÉTODO DROP-SET)": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "ELEVAÇÃO PÉLVICA 4 X 12 (MÉTODO PICO DE CONTRAÇÃO)": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "AGACHAMENTO LIVRE NA BARRA LONGA   3 X 12": "",
    "SUPINO RETO MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=18T4pt1ENzA",
    "AGACHAMENTO LIVRE NA BARRA LONGA 4 X 15/12/10/10": "",
    "REMADA BAIXA SENTADO C/TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO  3 X 15/12/10": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "SUPINO RETO MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=18T4pt1ENzA",
    "PANTURRILHA VERTICAL NA MÁQUINA  4 X 15/12/12/10": "",
    "ROSCA BÍCEPS DIRETA NA BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "STIFF NA BARRA 4 X 12/10/10/8": "",
    "HIPEREXTENSÃO DE TRONCO NO SOLO  3 X 12": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "ABDUÇÃO DE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 10": "https://www.youtube.com/watch?v=nWvJiwPMElw",
    "PUXADA SUPINADA NA BARRA LONGA 3 X 15/12/10": "",
    "SUPINO RETO C/ HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "CRUCIFIXO INVERTIDO NA MÁQUINA 3 X 10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "CRUCIFIXO INVERSO SENTADO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=IAz2nP5nNU0",
    "CADEIRA FLEXORA 3 X 12/10/10": "",
    "MESA FLEXORA  3 X 15/12/10": "",
    "SUPINO INCLINADO NA BARRA LONGA   3 X 10": "https://www.youtube.com/watch?v=09aqYKINtrw",
    "CADEIRA FLEXORA 3 X 12/10/8": "",
    "PUXADA UNILATERAL NO CROSS SENTADO NO STEP 3 X 12/10/10": "",
    "DESENVOLVIMENTO DE OMBROS EM PÉ C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "TRÍCEPS TESTA NA BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=303nfEvX4Hk",
    "ROSCA BÍCEPS DIRETA NA BARRA W   3 X 10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "FLEXORA VERTICAL UNILATERAL OU FLEXÃO DE JOELHOS UNILATERAL C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "AGACHAMENTO MÁQUINA 4 X 15/12/10/10": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "CADEIRA FLEXORA 3 X 15/12/10": "",
    "CADEIRA ABDUTORA C/ TRONCO A FRENTE 3 X 15": "",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL 3 X 15/12/10": "",
    "PUXADA ABERTA P/FRENTE BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=6_Y1w6wzJzI",
    "CADEIRA FLEXORA 3 X15/12/10": "",
    "CADEIRA FLEXORA    3 X 12": "",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12/10/8": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "REMADA SENTADO ABERTA C/ BARRA RETA   3 X 10": "",
    "SUPINO RETO NA BARRA LONGA     3 X 10": "https://www.youtube.com/watch?v=K5Gr_tzcvy8",
    "REMADA BAIXA SENTADO C/TRIÂNGULO 3 X 15/12/10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "TRICEPS C/ CORDA  3 X 10": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "AGACHAMENTO SUMÔ C/HALTERES OU KETTEBELL 3 X 12/10/8": "",
    "ABDUÇÃO DE QUADRIL C/CANELEIRA DEITADA NO SOLO  3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=S29QH9y7Nz0",
    "REMADA SERROTE UNILATERAL C/ HALTER 3 X 12/10/8": "https://www.youtube.com/watch?v=7UIZIdbt2k0",
    "CRUCIFIXO MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=NmjumdFCL90",
    "PANTURRILHA VERTICAL NA MÁQUINA   3 X 12": "",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTERES 3 X 12": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "TRÍCEPS CORDA 3 X 10": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "TRÍCEPS FRÂNCES SIMULTÂNEO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=cQbK8sgMDdY",
    "ROSCA BICEPS DIRETA C/BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=T0zw1uf13TI",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 10 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "MOBILIDADE DE COLUNA TORÁCICA     3 X 10": "",
    "ROSCA BÍCEPS C/ HALTERES + TRÍCEPS TESTA C/ BARRA W 3 X 10+10": "",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS COM PERNA ESTENDIDA C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=xer-xfrcgO8",
    "EXTENSÃO DE QUADRIL C/ CANELEIRA COM A PERNA ESTICADA    3 X 12  (CADA LADO)": "https://www.youtube.com/watch?v=xer-xfrcgO8",
    "PANTURRILHA VERTICAL LIVRE (PESO CORPORAL)   3 X 15": "",
    "CADEIRA EXTENSORA 3 X 12/12/10": "",
    "CADEIRA EXTENSORA    3 X 15/12/10": "",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER 3 X 12": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12 (CADA LADO)": "",
    "SUPINO INCLINADO C/ HALTERES 4 X 12/10/10/8": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "HIPEREXTENSÃO DE TRONCO NO SOLO   3 X 60 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "EXTENSÃO DE QUADRIL C/ JOELHO ESTICADO NA CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=xer-xfrcgO8",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA EM PÉ 4 X 12/10/10/8 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO MOVIMENTO QUANDO O JOELHO ESTIVER EM 90GRAUS DE FLEXÃO": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 40SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA) 3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEG. ABERTA) 3 X 12/10/8": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "ABDUÇÃO DE OMBROS UNILATERAL C/ TRONCO INCLINADO C/ HALTERES  3 X 10": "",
    "FLEXORA VERTICAL OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12/10/8": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "ROSCA BÍCEPS ALTERNADO C/ ROTAÇÃO C/ HALTER + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "",
    "STIFF NA BARRA 3 X 15/12/10": "",
    "MESA FLEXORA   3 X 15/12/10": "",
    "LEG PRESS 45    3 X 10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA) 3 X 30 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "FLEXÃO DE BRAÇOS DE JOELHOS NO SOLO 3 X 8": "https://www.youtube.com/watch?v=D6Ink0DD2wk",
    "LEG PRESS 45 3 X 12/10/8": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "ELEVAÇÃO PÉLVICA MÁQUINA 3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA  3 X 15": "https://www.youtube.com/watch?v=xer-xfrcgO8",
    "TRÍCEPS NO PULLEY C/ BARRA  RETA    3 X 10": "https://www.youtube.com/watch?v=XK_XD-2kXq8",
    "REMADA MÁQUINA (PEGADA ABERTA) 3 X 10": "https://www.youtube.com/watch?v=GIMMkVqz1aQ",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X 12": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "MOBILIDADE DE FLEXORES DE QUADRIL E POSTERIORES DE COXA 3 X 10 (CADA LADO)": "",
    "DESENVOLVIMENTO DE OMBROS MÁQUINA (PEGADA ABERTA)   3 X 10": "https://www.youtube.com/watch?v=V9P4DYp6RHA",
    "MOBILIDADE DA COLUNA TORÁCICA 3 X 10": "",
    "MOBILIDADE DE COLUNA TORÁCICA   3 X 10": "",
    "PANTURRILHA VERTICAL MÁQUINA 3 X 12/10/8": "",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 4 X12/10/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "MOBILIDADE DE COLUNA TORÁCICA  3 X 10": "",
    "CADEIRA EXTENSORA 3 X 12/10/8": "",
    "ROSCA BÍCEPS SIMULTÂNEO C/ ROTAÇÃO + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "",
    "BANCO SCOTT + TRÍCEPS CORDA 3 X 10+10 (MÉTODO BI-SET)": "",
    "HIPEREXTENSÃO DE TRONCO NO SOLO (ISOMETRIA)   3 X 20 SEG": "https://www.youtube.com/watch?v=OQk3i5BXuok",
    "STIFF NA BARRA   3 X 12": "",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES 3 X 10": "https://www.youtube.com/watch?v=HHrqIjcud8Q",
    "ROSCA BÍCEPS ALTERNADA C/ HALTERES    3 X 10": "https://www.youtube.com/watch?v=HHrqIjcud8Q",
    "ABDUÇÃO DE OMBROS C/TRONCO INCLINADO UNILATERAL 3 X 15/12/10": "https://www.youtube.com/watch?v=nWvJiwPMElw",
    "CROSSOVER 3 X 12/12/10 (MÉTODO PICO DE CONTRAÇÃO) NA FASE FINAL DO": "https://www.youtube.com/watch?v=Te6lga3E10o",
    "LEG PRESS 45 3 X 12": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO C/ HALTER  3 X 10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 40 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "MESA FLEXORA 8+8+8 (MÉTODO DROP-SET)": "",
    "PUXADA SUPINADA NA BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=oBVw5EPpqDk",
    "CADEIRA EXTENSORA 4 X 15/12/10/8": "",
    "REMADA SERROTE UNILATERAL C/HALTER 3 X 10": "https://www.youtube.com/watch?v=7UIZIdbt2k0",
    "ROSCA BÍCEPS DIRETA NO CROSS C/ BARRA W 3 X 15/12/10": "https://www.youtube.com/watch?v=7szEPtvsgnE",
    "FLEXORA VERTICAL MÁQUINA OU FLEXÃO DE JOELHOS C/CANELEIRA  3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "FLEXORA VERTICAL NA MÁQUINA OU FLEXÃO DE JOELHOS C/ CANELEIRA 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=eSMMtwbQADI",
    "MOBILIDADE DE COLUNA TORÁCICA 3 X 10": "",
    "SUPINO RETO C/ HALTERES  3 X 12/10/8": "https://www.youtube.com/watch?v=JNQu6s-p32M",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/ HALTER   3 X 10": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "MESA FLEXORA   3 X 12": "",
    "LEG HORIZONTAL 4 X 12/12/10/10": "https://www.youtube.com/watch?v=zOa99g8DpGg",
    "CRUCIFIXO INVERSO MÁQUINA 3 X12/10/8": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "SUPINO INCLINADO C/ HALTERES   3 X 10": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "CRUCIFIXO INVERSO MÁQUINA OU CRUCIFIXO INVERSO EM PÉ C/HALTERES 3 X 12/10/8": "https://www.youtube.com/watch?v=Em77dcUYqUQ",
    "LEVANTAMENTO TERRA SUMÔ C/BARRA LONGA 3 X 12/10/10": "",
    "HACK MACHINE   3 X 15/12/10": "https://www.youtube.com/watch?v=frpKOJ4XNwc",
    "CROSSOVER MÁQUINA 3 X 12/10/8": "https://www.youtube.com/watch?v=Te6lga3E10o",
    "REMADA ABERTA MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "PUXADA SUPINADA NA BARRA RETA 3 X 15/12/10": "https://www.youtube.com/watch?v=oBVw5EPpqDk",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 70 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "AFUNDO UNILATERAL (PESO CORPORAL) 3 X 12 (CADA LADO)": "https://www.youtube.com/watch?v=D2X9AK5vpY4",
    "ELEVAÇÃO PÉLVICA NA MÁQUINA OU ELEVAÇÃO PÉLVICA C/ BARRA NO BANCO 3 X12/10/8": "https://www.youtube.com/watch?v=Ew8gkikzVQ0",
    "TRICEPS CORDA 4 X 12/10/10/8": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "EXERCÍCIO OSTRA C/ MINIBAND NO SOLO (DEITADO DE LADO)  3 X 12 (CADA LADO)": "",
    "FLEXÃO DE OMBROS ALTERNADO C/ HALTER 3 X 10": "https://www.youtube.com/watch?v=YslHlalBYNs",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)  3 X 40 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA) 3 X 50SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "REMADA ABERTA NA MÁQUINA 3 X 15/12/10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "REMADA ABERTA NA MÁQUINA    3 X 15/12/10": "https://www.youtube.com/watch?v=tXXWpzgOxE0",
    "EXTENSÃO DE QUADRIL NO CABO C/PERNA ESTICADA 3 X 15/12/10": "https://www.youtube.com/watch?v=uNYRrcgazq0",
    "CADEIRA FLEXORA   3 X 15/12/10": "",
    "ABDUÇÃO DE OMBROS NO BANCO INCLINADO C/HALTERES 3 X 10": "https://www.youtube.com/watch?v=dwA6ncX1ZBE",
    "SUPINO RETO C/ BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=K5Gr_tzcvy8",
    "SUPINO INCLINADO C/ HALTERES 3 X 15/12/10": "https://www.youtube.com/watch?v=1ifWwyzt4uU",
    "ABDUÇÃO DE OMBROS C/ HALTER   3 X 8": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "AGACHAMENTO NO BANCO (PESO CORPORAL)    3 X 10": "",
    "PUXADA FECHADA NO TRIÂNGULO 3 X 12/10/10": "https://www.youtube.com/watch?v=5dPl7UcxATE",
    "CADEIRA ABDUTORA    3 X 12": "https://www.youtube.com/watch?v=vEF9MDOT3tk",
    "REMADA BAIXA SENTADO ABERTA C/ BARRA LONGA 3 X 12/10/8": "https://www.youtube.com/watch?v=xlSCLS4UgBA",
    "HIPEREXTENSÃO DE TRONCO NO BANCO ROMANO 3 X 12": "https://www.youtube.com/watch?v=ppftGvn8-Ig",
    "AGACHAMENTO BÚLGARO C/HALTERES 3 X 10 (CADA LADO)": "",
    "TRÍCEPS CORDA   3 X 10": "https://www.youtube.com/watch?v=DHFsz5iVs94",
    "CADEIRA FLEXORA    3 X 15/12/10": "",
    "REMADA BAIXA SENTADA C/TRIÂNGULO    3 X 10": "https://www.youtube.com/watch?v=eS4iQcEiL5E",
    "REMADA BAIXA SENTADO ABERTA C/ BARRA LONGA 3 X 12/10/10/8": "https://www.youtube.com/watch?v=xlSCLS4UgBA",
    "TRÍCEPS NO PULLEY C/ BARRA RETA 3 X 10": "https://www.youtube.com/watch?v=XK_XD-2kXq8",
    "ABDUÇÃO DE OMBROS C/HALTER 3 X 15/12/10": "https://www.youtube.com/watch?v=PPw-2ySBaY4",
    "PRANCHA ABDOMINAL NO SOLO (ISOMETRIA)  3 X 60 SEG": "https://www.youtube.com/watch?v=mDNkebh_GuA",
    "TRÍCEPS TESTA C/HALTERES SIMULTÂNEO 3 X 12": "https://www.youtube.com/watch?v=EAM8kO-lvMs",
    "AGACHAMENTO MÁQUINA  3 X 12/10/8": "https://www.youtube.com/watch?v=X6gwK2mcRaU",
    "TRÍCEPS NO PULLEY C/ BARRA RETA  3 X 10": "",
    "SUPINO RETO MÁQUINA   3 X 10": "https://www.youtube.com/watch?v=18T4pt1ENzA",
    "AGACHAMENTO SUMÔ C/ HALTERES OU KETTEBELL    3 X 15/12/10": "",
    "EXTENSÃO DE QUADRIL DE 4 APOIOS C/ CANELEIRA E PERNA ESTICADA 3 X 15": "https://www.youtube.com/watch?v=xer-xfrcgO8",

    // Baixa Confiança adicionados
    "STIFF NA BARRA (INTERPRETATIVO)": "https://www.youtube.com/watch?v=sBnAeaDNUQU",
    "PRANCHA ABDOMINAL (INTERPRETATIVO)": "https://www.youtube.com/watch?v=wrb1FMH2tIY",
    "ENCOLHIMENTO DE OMBROS (INTERPRETATIVO)": "https://www.youtube.com/watch?v=cJRVVxmytaM",
    "FACE PULL (INTERPRETATIVO)": "https://www.youtube.com/watch?v=HSoHeSjvIdY",
    "ROSCA BÍCEPS MARTELO (INTERPRETATIVO)": "https://www.youtube.com/watch?v=pkSbKcsVmQk",
    "TRÍCEPS TESTA NO CABO (INTERPRETATIVO)": "https://www.youtube.com/watch?v=n-3sY2gNZjI",

};
  
  // Tentar encontrar correspondência exata no texto normalizado
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioNormalizado = normalizarTextoCompleto(exercicio);
    if (textoNormalizado === exercicioNormalizado) {
      console.log(`[encontrarVideoDoExercicio] Correspondência exata encontrada para: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Tentar encontrar correspondência com base no nome essencial
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioEssencial = extrairNomeEssencial(exercicio);
    if (nomeEssencial === exercicioEssencial) {
      console.log(`[encontrarVideoDoExercicio] Correspondência pelo nome essencial: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Verificar se o nome essencial está contido em algum dos exercícios
  for (const [exercicio, url] of Object.entries(videosExercicios)) {
    const exercicioEssencial = extrairNomeEssencial(exercicio);
    if (exercicioEssencial.includes(nomeEssencial) || nomeEssencial.includes(exercicioEssencial)) {
      console.log(`[encontrarVideoDoExercicio] Correspondência parcial: "${exercicio}"`);
      sessionStorage.setItem(cacheKey, url);
      return url;
    }
  }
  
  // Busca por palavras-chave principais
  const palavrasChave = nomeEssencial.split(' ').filter(p => p.length > 3);
  if (palavrasChave.length > 0) {
    for (const [exercicio, url] of Object.entries(videosExercicios)) {
      const exercicioEssencial = extrairNomeEssencial(exercicio);
      const palavrasExercicio = exercicioEssencial.split(' ');
      
      // Se pelo menos 2 palavras-chave coincidem, considere uma correspondência
      const palavrasCoincidentes = palavrasChave.filter(p => 
        palavrasExercicio.some(pe => pe.includes(p) || p.includes(pe))
      );
      
      if (palavrasCoincidentes.length >= Math.min(2, palavrasChave.length)) {
        console.log(`[encontrarVideoDoExercicio] Correspondência por palavras-chave: "${exercicio}"`);
        sessionStorage.setItem(cacheKey, url);
        return url;
      }
    }
  }
  
  console.log(`[encontrarVideoDoExercicio] Nenhum vídeo encontrado para: "${textoExercicio}"`);
  sessionStorage.setItem(cacheKey, "null");
  return null;
}; 
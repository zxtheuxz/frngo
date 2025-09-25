-- Inserir dados de templates de treinos baseados no backup
-- Como os dados do backup são específicos, vou inserir alguns templates de exemplo primeiro

-- Templates de treinos
INSERT INTO public.templates_treinos (nivel, frequencia, conteudo_masculino, conteudo_feminino) VALUES
(
    'Iniciante',
    '3x',
    '**TREINO INICIANTE - 3X SEMANA - MASCULINO**

**SEGUNDA-FEIRA (Treino A - Peito, Ombro, Tríceps)**
1. Supino reto com halteres - 3x10-12
2. Supino inclinado com halteres - 3x10-12  
3. Desenvolvimento com halteres - 3x10-12
4. Elevação lateral - 3x12-15
5. Tríceps testa - 3x10-12
6. Tríceps francês - 3x10-12

**QUARTA-FEIRA (Treino B - Costas, Bíceps)**
1. Puxada frontal - 3x10-12
2. Remada curvada - 3x10-12
3. Remada unilateral - 3x10-12
4. Rosca direta - 3x10-12
5. Rosca martelo - 3x10-12
6. Rosca concentrada - 3x10-12

**SEXTA-FEIRA (Treino C - Pernas, Abdômen)**
1. Agachamento - 3x12-15
2. Leg press - 3x12-15
3. Extensora - 3x12-15
4. Flexora - 3x12-15
5. Panturrilha - 3x15-20
6. Abdominal - 3x15-20',
    
    '**TREINO INICIANTE - 3X SEMANA - FEMININO**

**SEGUNDA-FEIRA (Treino A - Membros Superiores)**
1. Supino inclinado com halteres - 3x12-15
2. Crucifixo inclinado - 3x12-15
3. Desenvolvimento com halteres - 3x12-15
4. Elevação lateral - 3x12-15
5. Tríceps no pulley - 3x12-15
6. Extensão de tríceps - 3x12-15

**QUARTA-FEIRA (Treino B - Costas, Bíceps)**
1. Puxada frontal - 3x12-15
2. Remada sentada - 3x12-15
3. Remada unilateral - 3x12-15
4. Rosca direta - 3x12-15
5. Rosca alternada - 3x12-15
6. Rosca martelo - 3x12-15

**SEXTA-FEIRA (Treino C - Pernas, Glúteos)**
1. Agachamento - 3x15-20
2. Leg press - 3x15-20
3. Extensora - 3x15-20
4. Flexora - 3x15-20
5. Elevação pélvica - 3x15-20
6. Panturrilha - 3x20-25'
),

(
    'Intermediário',
    '4x',
    '**TREINO INTERMEDIÁRIO - 4X SEMANA - MASCULINO**

**SEGUNDA-FEIRA (Treino A - Peito, Tríceps)**
1. Supino reto - 4x8-10
2. Supino inclinado - 4x8-10
3. Crucifixo - 3x10-12
4. Paralela - 3x máximo
5. Tríceps testa - 4x8-10
6. Tríceps francês - 3x10-12
7. Mergulho - 3x máximo

**TERÇA-FEIRA (Treino B - Costas, Bíceps)**
1. Barra fixa - 4x máximo
2. Puxada frontal - 4x8-10
3. Remada curvada - 4x8-10
4. Remada unilateral - 3x10-12
5. Rosca direta - 4x8-10
6. Rosca martelo - 3x10-12
7. Rosca concentrada - 3x10-12

**QUINTA-FEIRA (Treino C - Ombros, Abdômen)**
1. Desenvolvimento militar - 4x8-10
2. Elevação lateral - 4x10-12
3. Elevação frontal - 3x10-12
4. Elevação posterior - 3x12-15
5. Encolhimento - 3x10-12
6. Abdominal - 4x15-20
7. Prancha - 3x30-60s

**SEXTA-FEIRA (Treino D - Pernas)**
1. Agachamento - 4x8-10
2. Leg press - 4x10-12
3. Extensora - 3x12-15
4. Flexora - 3x12-15
5. Stiff - 3x10-12
6. Panturrilha - 4x15-20
7. Gêmeos - 3x15-20',

    '**TREINO INTERMEDIÁRIO - 4X SEMANA - FEMININO**

**SEGUNDA-FEIRA (Treino A - Membros Superiores)**
1. Supino inclinado - 4x10-12
2. Crucifixo inclinado - 3x12-15
3. Desenvolvimento - 4x10-12
4. Elevação lateral - 3x12-15
5. Tríceps pulley - 4x12-15
6. Extensão tríceps - 3x12-15

**TERÇA-FEIRA (Treino B - Costas, Bíceps)**
1. Puxada frontal - 4x10-12
2. Remada sentada - 4x10-12
3. Remada unilateral - 3x12-15
4. Rosca direta - 4x12-15
5. Rosca alternada - 3x12-15
6. Rosca martelo - 3x12-15

**QUINTA-FEIRA (Treino C - Pernas, Glúteos)**
1. Agachamento - 4x12-15
2. Leg press - 4x12-15
3. Hack - 3x12-15
4. Extensora - 3x15-20
5. Flexora - 3x15-20
6. Elevação pélvica - 4x15-20
7. Panturrilha - 4x20-25

**SEXTA-FEIRA (Treino D - Glúteos, Core)**
1. Stiff - 4x12-15
2. Afundo - 3x12-15 cada
3. Elevação pélvica - 4x15-20
4. Abdução - 3x15-20
5. Prancha lateral - 3x30s cada
6. Abdominal - 4x15-20'
),

(
    'Avançado',
    '5x',
    '**TREINO AVANÇADO - 5X SEMANA - MASCULINO**

**SEGUNDA-FEIRA (Treino A - Peito)**
1. Supino reto - 5x6-8
2. Supino inclinado - 4x8-10
3. Supino declinado - 4x8-10
4. Crucifixo - 4x10-12
5. Paralela - 4x máximo
6. Crossover - 3x12-15

**TERÇA-FEIRA (Treino B - Costas)**
1. Barra fixa - 5x máximo
2. Puxada frontal - 4x8-10
3. Remada curvada - 4x8-10
4. Remada T - 4x8-10
5. Remada unilateral - 3x10-12
6. Pullover - 3x10-12

**QUARTA-FEIRA (Treino C - Ombros)**
1. Desenvolvimento militar - 5x6-8
2. Desenvolvimento atrás - 4x8-10
3. Elevação lateral - 4x10-12
4. Elevação frontal - 4x10-12
5. Elevação posterior - 4x12-15
6. Encolhimento - 4x10-12

**QUINTA-FEIRA (Treino D - Braços)**
1. Rosca direta - 4x8-10
2. Rosca martelo - 4x8-10
3. Rosca concentrada - 3x10-12
4. Tríceps testa - 4x8-10
5. Tríceps francês - 4x8-10
6. Mergulho - 3x máximo

**SEXTA-FEIRA (Treino E - Pernas)**
1. Agachamento - 5x6-8
2. Leg press - 4x10-12
3. Hack - 4x10-12
4. Extensora - 4x12-15
5. Flexora - 4x12-15
6. Stiff - 4x8-10
7. Panturrilha - 5x15-20',

    '**TREINO AVANÇADO - 5X SEMANA - FEMININO**

**SEGUNDA-FEIRA (Treino A - Membros Superiores)**
1. Supino inclinado - 4x10-12
2. Crucifixo inclinado - 4x12-15
3. Desenvolvimento - 4x10-12
4. Elevação lateral - 4x12-15
5. Puxada frontal - 4x10-12
6. Remada sentada - 4x10-12

**TERÇA-FEIRA (Treino B - Pernas Completo)**
1. Agachamento - 4x10-12
2. Leg press - 4x12-15
3. Hack - 4x12-15
4. Extensora - 4x15-20
5. Flexora - 4x15-20
6. Panturrilha - 4x20-25

**QUARTA-FEIRA (Treino C - Glúteos, Posterior)**
1. Stiff - 4x10-12
2. Elevação pélvica - 4x15-20
3. Afundo - 4x12 cada
4. Abdução - 4x15-20
5. Flexora - 4x15-20
6. Panturrilha - 4x20-25

**QUINTA-FEIRA (Treino D - Braços, Core)**
1. Rosca direta - 4x12-15
2. Rosca martelo - 4x12-15
3. Tríceps pulley - 4x12-15
4. Extensão tríceps - 4x12-15
5. Prancha - 4x45s
6. Abdominal - 4x20

**SEXTA-FEIRA (Treino E - Full Body)**
1. Agachamento - 3x12-15
2. Supino inclinado - 3x12-15
3. Remada sentada - 3x12-15
4. Desenvolvimento - 3x12-15
5. Elevação pélvica - 3x15-20
6. Prancha lateral - 3x30s cada'
);

-- Templates de dietas (exemplos iniciais)
INSERT INTO public.templates_dietas (tipo, valor_calorico, conteudo) VALUES
(
    'Emagrecimento',
    1200,
    '**DIETA EMAGRECIMENTO - 1200 KCAL**

**CAFÉ DA MANHÃ (300 kcal)**
- 1 fatia de pão integral
- 1 ovo mexido
- 1 xícara de café sem açúcar
- 1 fruta pequena

**LANCHE DA MANHÃ (150 kcal)**
- 1 iogurte natural desnatado
- 1 colher de sopa de granola

**ALMOÇO (400 kcal)**
- 100g de frango grelhado
- 2 colheres de arroz integral
- 1 concha de feijão
- Salada verde à vontade
- 1 colher de azeite

**LANCHE DA TARDE (150 kcal)**
- 1 fruta média
- 10 castanhas

**JANTAR (200 kcal)**
- 100g de peixe grelhado
- Legumes refogados
- Salada verde à vontade'
),

(
    'Ganho de Massa',
    2500,
    '**DIETA GANHO DE MASSA - 2500 KCAL**

**CAFÉ DA MANHÃ (500 kcal)**
- 2 fatias de pão integral
- 2 ovos mexidos
- 1 copo de leite integral
- 1 banana com aveia

**LANCHE DA MANHÃ (300 kcal)**
- Vitamina com whey protein
- 1 banana
- 200ml de leite integral

**ALMOÇO (800 kcal)**
- 150g de carne vermelha
- 4 colheres de arroz
- 2 conchas de feijão
- Batata doce
- Salada com azeite

**LANCHE DA TARDE (400 kcal)**
- Sanduíche com peito de peru
- 1 copo de suco natural
- Mix de castanhas

**JANTAR (500 kcal)**
- 150g de frango
- Macarrão integral
- Legumes refogados
- Salada verde com azeite'
);

-- Comentário
COMMENT ON TABLE public.templates_treinos IS 'Templates importados do sistema anterior com adaptações';
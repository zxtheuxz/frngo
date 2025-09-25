-- Criar tabelas para templates de treinos e dietas

-- Tabela para templates de treinos físicos
CREATE TABLE IF NOT EXISTS public.templates_treinos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nivel VARCHAR(50) NOT NULL,
    frequencia VARCHAR(50) NOT NULL,
    conteudo_masculino TEXT NOT NULL,
    conteudo_feminino TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice único para evitar duplicatas
    UNIQUE(nivel, frequencia)
);

-- Tabela para templates de dietas nutricionais
CREATE TABLE IF NOT EXISTS public.templates_dietas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    valor_calorico INTEGER NOT NULL,
    conteudo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Índice único para evitar duplicatas
    UNIQUE(tipo, valor_calorico)
);

-- Comentários nas tabelas
COMMENT ON TABLE public.templates_treinos IS 'Templates pré-definidos de treinos físicos organizados por nível e frequência';
COMMENT ON TABLE public.templates_dietas IS 'Templates pré-definidos de dietas nutricionais organizados por tipo e valor calórico';

-- Comentários nas colunas
COMMENT ON COLUMN public.templates_treinos.nivel IS 'Nível do treino (ex: Iniciante, Intermediário, Avançado)';
COMMENT ON COLUMN public.templates_treinos.frequencia IS 'Frequência semanal do treino (ex: 3x, 4x, 5x)';
COMMENT ON COLUMN public.templates_treinos.conteudo_masculino IS 'Conteúdo do treino para o sexo masculino';
COMMENT ON COLUMN public.templates_treinos.conteudo_feminino IS 'Conteúdo do treino para o sexo feminino';

COMMENT ON COLUMN public.templates_dietas.tipo IS 'Tipo da dieta (ex: Emagrecimento, Ganho de Massa)';
COMMENT ON COLUMN public.templates_dietas.valor_calorico IS 'Valor calórico da dieta em kcal';
COMMENT ON COLUMN public.templates_dietas.conteudo IS 'Conteúdo detalhado da dieta';

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.templates_treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates_dietas ENABLE ROW LEVEL SECURITY;

-- Política para preparadores e admins lerem os templates
CREATE POLICY "Preparadores podem ler templates de treinos"
ON public.templates_treinos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('preparador', 'admin')
  )
);

CREATE POLICY "Preparadores podem ler templates de dietas"
ON public.templates_dietas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('preparador', 'admin', 'nutricionista')
  )
);

-- Índices para melhorar performance
CREATE INDEX idx_templates_treinos_nivel ON public.templates_treinos(nivel);
CREATE INDEX idx_templates_treinos_frequencia ON public.templates_treinos(frequencia);
CREATE INDEX idx_templates_dietas_tipo ON public.templates_dietas(tipo);
CREATE INDEX idx_templates_dietas_valor_calorico ON public.templates_dietas(valor_calorico);
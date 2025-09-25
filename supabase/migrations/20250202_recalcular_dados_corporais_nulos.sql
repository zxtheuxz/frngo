-- Migration para recalcular dados corporais que estão NULL
-- Implementa os mesmos cálculos do JavaScript para corrigir dados existentes

-- Função para calcular percentual de gordura usando Deurenberg (1991)
CREATE OR REPLACE FUNCTION calcular_percentual_gordura(
    p_altura DECIMAL,
    p_peso DECIMAL,
    p_idade INTEGER,
    p_sexo TEXT,
    p_cintura DECIMAL,
    p_quadril DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    v_imc DECIMAL;
    v_relacao_cq DECIMAL;
    v_sexo_fator INTEGER;
    v_percentual_base DECIMAL;
    v_fator_ajuste DECIMAL;
    v_percentual_final DECIMAL;
BEGIN
    -- Calcular IMC
    v_imc := p_peso / POWER(p_altura, 2);
    
    -- Calcular relação cintura/quadril
    v_relacao_cq := p_cintura / p_quadril;
    
    -- Fator de sexo (1 para M, 0 para F)
    v_sexo_fator := CASE WHEN UPPER(p_sexo) IN ('M', 'MASCULINO', 'MALE') THEN 1 ELSE 0 END;
    
    -- Fórmula base de Deurenberg (1991)
    v_percentual_base := (1.20 * v_imc) + (0.23 * p_idade) - (10.8 * v_sexo_fator) - 5.4;
    
    -- Aplicar ajustes proprietários baseados em sexo e relação cintura/quadril
    IF v_sexo_fator = 1 THEN
        -- Homens
        IF v_relacao_cq <= 0.84 THEN
            v_fator_ajuste := 0.75; -- Redução de 25% para ectomorfos
        ELSIF v_relacao_cq >= 0.87 THEN
            v_fator_ajuste := 0.83; -- Redução de 17% para endomorfos
        ELSE
            -- Interpolação linear entre 0.84 e 0.87
            v_fator_ajuste := 0.75 + (0.08 * (v_relacao_cq - 0.84) / 0.03);
        END IF;
    ELSE
        -- Mulheres
        IF v_relacao_cq <= 0.78 THEN
            v_fator_ajuste := 1.04; -- Aumento de 4%
        ELSIF v_relacao_cq <= 0.85 THEN
            -- Interpolação linear entre 0.78 e 0.85
            v_fator_ajuste := 1.04 + (0.04 * (v_relacao_cq - 0.78) / 0.07);
        ELSE
            v_fator_ajuste := 1.08; -- Aumento de 8% para C/Q alto
        END IF;
    END IF;
    
    v_percentual_final := v_percentual_base * v_fator_ajuste;
    
    -- Garantir que o resultado esteja dentro de faixas realistas (3-50%)
    RETURN GREATEST(3, LEAST(50, ROUND(v_percentual_final * 10) / 10));
END;
$$ LANGUAGE plpgsql;

-- Função para calcular o Índice Grimaldi (Shaped Score)
CREATE OR REPLACE FUNCTION calcular_indice_grimaldi(
    p_imc DECIMAL,
    p_img DECIMAL,
    p_imm DECIMAL,
    p_rcq DECIMAL,
    p_rce DECIMAL,
    p_ic DECIMAL,
    p_cintura DECIMAL,
    p_sexo TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_pontuacao DECIMAL := 0;
    v_indicadores_ruins INTEGER := 0;
    v_indicadores_bons INTEGER := 0;
    v_pontos_por_indicador DECIMAL := 100.0 / 6.0;
    v_bonus_base DECIMAL := 0;
BEGIN
    -- Avaliar Índice de Massa Gorda
    IF p_img <= 2.2 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSIF p_img <= 4.4 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSE
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.05);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    END IF;
    
    -- Avaliar Índice de Massa Magra
    IF p_imm <= 17.8 THEN
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.25);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    ELSIF p_imm <= 22.3 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSE
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    END IF;
    
    -- Avaliar Razão Cintura/Quadril
    IF p_rcq <= 0.9 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSE
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.05);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    END IF;
    
    -- Avaliar Razão Cintura/Estatura
    IF p_rce <= 0.5 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSIF p_rce <= 0.55 THEN
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.25);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    ELSE
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.05);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    END IF;
    
    -- Avaliar Índice de Conicidade
    IF p_ic < 1.25 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSE
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.05);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    END IF;
    
    -- Avaliar Cintura
    IF p_cintura <= 94 THEN
        v_pontuacao := v_pontuacao + v_pontos_por_indicador;
        v_indicadores_bons := v_indicadores_bons + 1;
    ELSIF p_cintura <= 102 THEN
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.25);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    ELSE
        v_pontuacao := v_pontuacao + (v_pontos_por_indicador * 0.05);
        v_indicadores_ruins := v_indicadores_ruins + 1;
    END IF;
    
    -- Penalizações por múltiplos indicadores ruins
    IF v_indicadores_ruins >= 2 THEN
        v_pontuacao := v_pontuacao * 0.75;
    END IF;
    IF v_indicadores_ruins >= 3 THEN
        v_pontuacao := v_pontuacao * 0.65;
    END IF;
    IF v_indicadores_ruins >= 4 THEN
        v_pontuacao := v_pontuacao * 0.55;
    END IF;
    IF v_indicadores_ruins >= 5 THEN
        v_pontuacao := v_pontuacao * 0.40;
    END IF;
    
    -- Bônus baseado em indicadores bons
    IF v_indicadores_bons >= 5 THEN
        v_bonus_base := 8;
    ELSIF v_indicadores_bons >= 4 THEN
        v_bonus_base := 5;
    ELSIF v_indicadores_bons >= 3 THEN
        v_bonus_base := 2;
    END IF;
    
    v_pontuacao := v_pontuacao + v_bonus_base;
    
    -- Curva de distribuição restritiva
    IF v_pontuacao > 75 THEN
        v_pontuacao := 75 + (v_pontuacao - 75) * 0.15;
    END IF;
    IF v_pontuacao > 85 THEN
        v_pontuacao := 85 + (v_pontuacao - 85) * 0.05;
    END IF;
    
    RETURN GREATEST(15, LEAST(100, ROUND(v_pontuacao)));
END;
$$ LANGUAGE plpgsql;

-- Atualizar registros com dados NULL
UPDATE medidas_corporais mc
SET 
    -- Calcular percentual de gordura
    percentual_gordura = calcular_percentual_gordura(
        mc.altura_usada::DECIMAL,
        mc.peso_usado::DECIMAL,
        COALESCE(mc.idade_calculada, 30),  -- Usar 30 como idade padrão se NULL
        mc.sexo_usado,
        mc.medida_cintura::DECIMAL,
        mc.medida_quadril::DECIMAL
    ),
    -- Calcular massa gorda
    massa_gorda = ROUND((calcular_percentual_gordura(
        mc.altura_usada::DECIMAL,
        mc.peso_usado::DECIMAL,
        COALESCE(mc.idade_calculada, 30),
        mc.sexo_usado,
        mc.medida_cintura::DECIMAL,
        mc.medida_quadril::DECIMAL
    ) / 100) * mc.peso_usado::DECIMAL, 1),
    -- Calcular massa magra
    massa_magra = ROUND(mc.peso_usado::DECIMAL - ((calcular_percentual_gordura(
        mc.altura_usada::DECIMAL,
        mc.peso_usado::DECIMAL,
        COALESCE(mc.idade_calculada, 30),
        mc.sexo_usado,
        mc.medida_cintura::DECIMAL,
        mc.medida_quadril::DECIMAL
    ) / 100) * mc.peso_usado::DECIMAL), 1),
    -- Calcular TMB usando Cunningham (1980)
    tmb = ROUND(500 + (22 * (mc.peso_usado::DECIMAL - ((calcular_percentual_gordura(
        mc.altura_usada::DECIMAL,
        mc.peso_usado::DECIMAL,
        COALESCE(mc.idade_calculada, 30),
        mc.sexo_usado,
        mc.medida_cintura::DECIMAL,
        mc.medida_quadril::DECIMAL
    ) / 100) * mc.peso_usado::DECIMAL))), 0),
    -- Calcular IMC
    imc = ROUND(mc.peso_usado::DECIMAL / POWER(mc.altura_usada::DECIMAL, 2), 1),
    -- Calcular razões e índices
    razao_cintura_quadril = ROUND(mc.medida_cintura::DECIMAL / mc.medida_quadril::DECIMAL, 3),
    razao_cintura_estatura = ROUND(mc.medida_cintura::DECIMAL / (mc.altura_usada::DECIMAL * 100), 3),
    indice_conicidade = ROUND((mc.medida_cintura::DECIMAL / 100) / (0.109 * SQRT(mc.peso_usado::DECIMAL / mc.altura_usada::DECIMAL)), 3),
    -- Atualizar idade calculada se NULL
    idade_calculada = CASE 
        WHEN mc.idade_calculada IS NULL THEN
            CASE 
                WHEN p.data_nascimento IS NOT NULL THEN 
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.data_nascimento))
                ELSE 30  -- Idade padrão
            END
        ELSE mc.idade_calculada
    END
FROM perfis p
WHERE mc.user_id = p.user_id
AND mc.percentual_gordura IS NULL
AND mc.calculado_automaticamente = true;

-- Calcular Índice Grimaldi para os registros atualizados
UPDATE medidas_corporais
SET shaped_score = calcular_indice_grimaldi(
    imc,
    massa_gorda / POWER(altura_usada::DECIMAL, 2),  -- IMG
    massa_magra / POWER(altura_usada::DECIMAL, 2),  -- IMM
    razao_cintura_quadril,
    razao_cintura_estatura,
    indice_conicidade,
    medida_cintura::DECIMAL,
    sexo_usado
)
WHERE percentual_gordura IS NOT NULL
AND shaped_score IS NULL
AND calculado_automaticamente = true;

-- Remover as funções temporárias
DROP FUNCTION IF EXISTS calcular_percentual_gordura;
DROP FUNCTION IF EXISTS calcular_indice_grimaldi;

-- Adicionar comentário na tabela
COMMENT ON COLUMN medidas_corporais.percentual_gordura IS 'Percentual de gordura corporal calculado usando fórmula de Deurenberg (1991) com ajustes';
COMMENT ON COLUMN medidas_corporais.shaped_score IS 'Índice Grimaldi (0-100) baseado em múltiplos indicadores de saúde';
-- Adicionar política para preparadores atualizarem resultado_fisica dos clientes
CREATE POLICY "Preparadores podem atualizar resultado_fisica dos clientes"
ON public.perfis
FOR UPDATE
TO authenticated
USING (
  -- Permite que preparadores e admins atualizem qualquer perfil
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('preparador', 'admin')
  )
)
WITH CHECK (
  -- Garante que apenas preparadores e admins podem fazer essas atualizações
  EXISTS (
    SELECT 1 FROM perfis p
    WHERE p.user_id = auth.uid()
    AND p.role IN ('preparador', 'admin')
  )
);

-- Comentário explicativo
COMMENT ON POLICY "Preparadores podem atualizar resultado_fisica dos clientes" ON public.perfis IS 
'Permite que usuários com role preparador ou admin atualizem os campos resultado_fisica e resultado_fisica_editado_em dos perfis dos clientes';
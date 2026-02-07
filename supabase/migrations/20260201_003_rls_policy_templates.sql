-- ============================================================================
-- Migration: RLS Policy Templates
-- Description: Templates de políticas RLS para isolamento multi-tenant
--              Use como referência para novas tabelas de negócio
-- Created: 2026-02-01
-- ============================================================================

-- ============================================================================
-- TEMPLATE: Políticas RLS para tabelas com company_id
-- ============================================================================
-- 
-- Para cada nova tabela de negócio, copie e adapte as políticas abaixo.
-- Substitua "nome_da_tabela" pelo nome real da tabela.
--
-- IMPORTANTE: Sempre habilite RLS antes de criar as políticas!
-- ============================================================================

-- EXEMPLO COMENTADO (não executa):
--
-- -- 1. Habilitar RLS
-- ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;
--
-- -- 2. Policy de SELECT (leitura)
-- CREATE POLICY "nome_da_tabela_select_policy"
-- ON public.nome_da_tabela
-- FOR SELECT
-- USING (
--   company_id = (
--     SELECT company_id
--     FROM public.users
--     WHERE id = auth.uid()
--   )
-- );
--
-- -- 3. Policy de INSERT
-- CREATE POLICY "nome_da_tabela_insert_policy"
-- ON public.nome_da_tabela
-- FOR INSERT
-- WITH CHECK (
--   company_id = (
--     SELECT company_id
--     FROM public.users
--     WHERE id = auth.uid()
--   )
-- );
--
-- -- 4. Policy de UPDATE
-- CREATE POLICY "nome_da_tabela_update_policy"
-- ON public.nome_da_tabela
-- FOR UPDATE
-- USING (
--   company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
-- )
-- WITH CHECK (
--   company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
-- );
--
-- -- 5. Policy de DELETE
-- CREATE POLICY "nome_da_tabela_delete_policy"
-- ON public.nome_da_tabela
-- FOR DELETE
-- USING (
--   company_id = (SELECT company_id FROM public.users WHERE id = auth.uid())
-- );

-- ============================================================================
-- FUNÇÃO HELPER: Obter company_id do usuário atual
-- ============================================================================
-- 
-- Função helper para simplificar as policies e melhorar performance
-- (evita repetir a subquery em cada policy)

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Comentário para documentação
COMMENT ON FUNCTION public.get_current_user_company_id IS 
  'Retorna o company_id do usuário autenticado. Use em policies RLS.';

-- ============================================================================
-- EXEMPLO DE USO DA FUNÇÃO HELPER
-- ============================================================================
--
-- Com a função helper, as policies ficam mais limpas:
--
-- CREATE POLICY "exemplo_select"
-- ON public.exemplo
-- FOR SELECT
-- USING (company_id = public.get_current_user_company_id());
--
-- CREATE POLICY "exemplo_insert"
-- ON public.exemplo
-- FOR INSERT
-- WITH CHECK (company_id = public.get_current_user_company_id());

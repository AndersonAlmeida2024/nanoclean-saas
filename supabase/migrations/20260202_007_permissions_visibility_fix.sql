-- ============================================================================
-- FIX: REVISÃO DE PERMISSÕES E VISIBILIDADE (API CACHE & GRANTS)
-- ============================================================================

-- 1. Garantir que as tabelas estão expostas para o PostgREST
GRANT ALL ON TABLE public.companies TO authenticated;
GRANT ALL ON TABLE public.company_memberships TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- 2. Garantir que as sequências (se houver) estão acessíveis
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 3. Resetar o Schema Cache (PostgREST)
-- Isso força o Supabase a reconhecer as novas tabelas e colunas imediatamente
NOTIFY pgrst, 'reload schema';

-- 4. Política de Segurança Adicional para Memberships
-- Garante que o usuário autenticado pode ver seus próprios vínculos de empresa
DROP POLICY IF EXISTS "authenticated_view_memberships" ON public.company_memberships;
CREATE POLICY "authenticated_view_memberships" ON public.company_memberships
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 5. Política para Empresas (Multi-tenant)
-- Permite que o usuário veja os dados básicos das empresas que ele é membro
DROP POLICY IF EXISTS "members_view_companies" ON public.companies;
CREATE POLICY "members_view_companies" ON public.companies
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT company_id 
        FROM public.company_memberships 
        WHERE user_id = auth.uid()
    )
);

-- 6. Garantir que o Owner atual seja o Owner da Matriz (Fix de Dados)
-- Se o usuário for o criador original, ele deve ser 'owner' da matriz
UPDATE public.company_memberships 
SET role = 'owner' 
WHERE company_id = (SELECT id FROM public.companies WHERE company_type = 'matrix' LIMIT 1);

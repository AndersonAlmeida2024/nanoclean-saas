-- ============================================================================
-- Migration: Fix Companies RLS for Multi-tenant visibility
-- Description: Permite que usuários visualizem empresas onde possuem membership.
-- Author: Antigravity (Supervisor)
-- ============================================================================

DO $$ 
BEGIN

-- 1. Ajustar a política de SELECT da tabela companies (antiga 'companys')
-- Nota: Verifiquei que a tabela foi corrigida para 'companies' na migração 009
DROP POLICY IF EXISTS "companies_select_policy" ON public.companies;
DROP POLICY IF EXISTS "companys_select" ON public.companies;

CREATE POLICY "companies_select_all_member" ON public.companies
FOR SELECT TO authenticated
USING (
    id IN (
        SELECT company_id 
        FROM public.company_memberships 
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- 2. Garantir que a tabela central de usuários também permita visualização própria segura
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users
FOR SELECT TO authenticated
USING (id = auth.uid());

END $$;

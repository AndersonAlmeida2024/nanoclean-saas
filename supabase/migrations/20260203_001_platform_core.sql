-- ============================================================================
-- Migration: Platform Administration Core
-- Description: Suporte a Super Admin, Status de Tenant e RPCs Administrativas.
-- Author: Antigravity (Supervisor)
-- ============================================================================

DO $$ 
BEGIN

-- 1. EXTENSÃO DO SCHEMA
-------------------------------------------------------------------------------
-- Adicionar flag de admin da plataforma
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN DEFAULT false;

-- Adicionar status e plano na tabela de empresas (tenants)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial_expired'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan_id TEXT DEFAULT 'free';

-- 2. FUNÇÕES DE SUPORTE (SECURITY DEFINER)
-------------------------------------------------------------------------------

-- Verificar se o usuário logado é admin da plataforma
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT is_platform_admin FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. RPCS ADMINISTRATIVAS (PLATFORM-ONLY)
-------------------------------------------------------------------------------

-- Listar empresas com metadados administrativos (sem dados sensíveis)
CREATE OR REPLACE FUNCTION public.admin_list_companies()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    company_type TEXT,
    status TEXT,
    plan_id TEXT,
    created_at TIMESTAMPTZ,
    member_count BIGINT
) AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    RETURN QUERY
    SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.company_type, 
        c.status, 
        c.plan_id, 
        c.created_at,
        (SELECT count(*) FROM public.company_memberships m WHERE m.company_id = c.id) as member_count
    FROM public.companies c
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alterar status de uma empresa (Suspensão/Ativação)
CREATE OR REPLACE FUNCTION public.admin_set_company_status(p_company_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    UPDATE public.companies 
    SET status = p_status, updated_at = now()
    WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provisionar nova empresa e convidar dono
CREATE OR REPLACE FUNCTION public.admin_provision_company(p_name TEXT, p_slug TEXT, p_owner_email TEXT)
RETURNS UUID AS $$
DECLARE
    v_new_company_id UUID;
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    -- 1. Criar a empresa
    INSERT INTO public.companies (name, slug, company_type)
    VALUES (p_name, p_slug, 'matrix')
    RETURNING id INTO v_new_company_id;

    -- 2. Criar o convite para o dono
    INSERT INTO public.invites (email, company_id, invited_by, role)
    VALUES (p_owner_email, v_new_company_id, auth.uid(), 'owner');

    RETURN v_new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. REFORÇO DE RLS (BLINDAGEM TOTAL)
-------------------------------------------------------------------------------

-- Garantir que Platform Admin pode VER as empresas via SELECT direto (metadados),
-- mas SEM dar acesso automático às tabelas de negócio.
DROP POLICY IF EXISTS "platform_admin_view_all_companies" ON public.companies;
CREATE POLICY "platform_admin_view_all_companies" ON public.companies
FOR SELECT TO authenticated
USING (public.is_platform_admin() OR id = public.get_active_company_id());

-- Bloqueio EXPLICITO: Platform Admin não acessa dados de negócio
-- As políticas atuais já usam get_active_company_id(). 
-- Se is_platform_admin for true e o admin não tiver active_company_id de uma filial, 
-- get_active_company_id() retornará null e o acesso será negado.

END $$;

-- ============================================================================
-- Migration: Platform Hardening & Audit Logging
-- Description: Implementação de logs de auditoria e endurecimento de RLS.
-- Author: Antigravity (Supervisor)
-- ============================================================================

DO $$ 
BEGIN

-- 1. TABELA DE AUDITORIA DE PLATAFORMA
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    target_id UUID, -- ID da empresa ou recurso afetado
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins de plataforma podem ver logs de auditoria
CREATE POLICY "platform_admins_view_logs" ON public.platform_audit_logs
FOR SELECT TO authenticated
USING (public.is_platform_admin());

-- 2. ENDURECIMENTO DO RLS (GET ACTIVE COMPANY ID)
-------------------------------------------------------------------------------
-- A função agora valida se o usuário possui membership ATIVA na empresa selecionada.
-- Isso impede que um admin de plataforma emule uma filial sem ter um vínculo legítimo.
CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS UUID AS $$
    SELECT u.active_company_id 
    FROM public.users u
    JOIN public.company_memberships m ON m.user_id = u.id AND m.company_id = u.active_company_id
    WHERE u.id = auth.uid() 
      AND m.status = 'active'
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. ATUALIZAÇÃO DAS RPCS COM LOGGING
-------------------------------------------------------------------------------

-- Alterar status de uma empresa com Log
CREATE OR REPLACE FUNCTION public.admin_set_company_status(p_company_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    -- Update da empresa
    UPDATE public.companies 
    SET status = p_status, updated_at = now()
    WHERE id = p_company_id;

    -- Inserir Log
    INSERT INTO public.platform_audit_logs (admin_id, action, target_id, metadata)
    VALUES (
        auth.uid(), 
        'SET_COMPANY_STATUS', 
        p_company_id, 
        jsonb_build_object('new_status', p_status)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provisionar nova empresa com Log
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

    -- 3. Inserir Log
    INSERT INTO public.platform_audit_logs (admin_id, action, target_id, metadata)
    VALUES (
        auth.uid(), 
        'PROVISION_COMPANY', 
        v_new_company_id, 
        jsonb_build_object('name', p_name, 'owner_email', p_owner_email)
    );

    RETURN v_new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. VALIDAÇÃO DE "PLATAFORMA CEGA"
-------------------------------------------------------------------------------
-- Forçamos que qualquer select em tabelas de negócio por um admin sem membership resulte em 0 linhas.
-- O endurecimento da função get_active_company_id() já garante isso, pois ela retornará NULL 
-- para o Platform Admin se ele não tiver o membership inserido manualmente.

END $$;

-- ============================================================================
-- MASTER MIGRATION: Matriz & Filiais (Headquarters & Branches)
-- Final Version for Multi-tenant Hierarchy and Context Switching
-- ============================================================================

DO $$ 
BEGIN

-- 1. ESTRUTURA HIERÁRQUICA DE EMPRESAS
-------------------------------------------------------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'branch' CHECK (company_type IN ('matrix', 'branch'));

CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON public.companies(parent_company_id);

-- 2. TABELA DE ACESSO MULTI-EMPRESA (MEMBERSHIPS)
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

-- 3. TABELA DE CONVITES (INVITES) - CRIAÇÃO SE NÃO EXISTIR
-------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    token UUID DEFAULT gen_random_uuid() UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days')
);

ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

-- 4. RASTREAMENTO DE CONTEXTO ATIVO NO USUÁRIO
-------------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_company_id UUID REFERENCES public.companies(id);

-- 5. MIGRAÇÃO DE DADOS EXISTENTES
-------------------------------------------------------------------------------
-- Garante que cada usuário tenha uma membership na sua empresa atual
INSERT INTO public.company_memberships (user_id, company_id, role, status)
SELECT id, company_id, role, 'active'
FROM public.users
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Define active_company_id inicial para todos
UPDATE public.users SET active_company_id = company_id WHERE active_company_id IS NULL;

-- 6. FUNÇÕES HELPER DE SEGURANÇA
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS UUID AS $$
    SELECT active_company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID AS $$
    SELECT public.get_active_company_id();
$$ LANGUAGE sql STABLE;

-- 7. POLÍTICAS RLS ATUALIZADAS (FILTRAGEM POR CONTEXTO ATIVO)
-------------------------------------------------------------------------------

-- Memberships
DROP POLICY IF EXISTS "memberships_view_own" ON public.company_memberships;
CREATE POLICY "memberships_view_own" ON public.company_memberships
FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Clients, Appointments, Transactions
DROP POLICY IF EXISTS "clients_isolation_policy" ON public.clients;
CREATE POLICY "clients_isolation_policy" ON public.clients
FOR ALL TO authenticated 
USING (company_id = public.get_active_company_id())
WITH CHECK (company_id = public.get_active_company_id());

DROP POLICY IF EXISTS "appointments_isolation_policy" ON public.appointments;
CREATE POLICY "appointments_isolation_policy" ON public.appointments
FOR ALL TO authenticated 
USING (company_id = public.get_active_company_id())
WITH CHECK (company_id = public.get_active_company_id());

DROP POLICY IF EXISTS "transactions_isolation_policy" ON public.transactions;
CREATE POLICY "transactions_isolation_policy" ON public.transactions
FOR ALL TO authenticated 
USING (company_id = public.get_active_company_id())
WITH CHECK (company_id = public.get_active_company_id());

-- 8. RPCs SEGURAS
-------------------------------------------------------------------------------

-- Troca de Contexto
CREATE OR REPLACE FUNCTION public.switch_company(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.company_memberships 
        WHERE user_id = auth.uid() AND company_id = p_company_id AND status = 'active'
    ) THEN
        UPDATE public.users SET active_company_id = p_company_id WHERE id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Você não tem permissão para acessar esta empresa ou o vínculo está inativo.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criação de Filial
CREATE OR REPLACE FUNCTION public.create_branch(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
    v_matrix_id UUID;
    v_new_branch_id UUID;
BEGIN
    -- Busca a empresa ativa do usuário (deve ser uma matrix)
    SELECT active_company_id INTO v_matrix_id FROM public.users WHERE id = auth.uid();

    -- Valida se é owner/admin na empresa atual
    IF NOT EXISTS (
        SELECT 1 FROM public.company_memberships 
        WHERE user_id = auth.uid() AND company_id = v_matrix_id AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Apenas proprietários ou administradores podem criar filiais.';
    END IF;

    -- Cria a filial
    INSERT INTO public.companies (name, slug, parent_company_id, company_type)
    VALUES (p_name, p_slug, v_matrix_id, 'branch')
    RETURNING id INTO v_new_branch_id;

    -- Adiciona o criador como owner da filial
    INSERT INTO public.company_memberships (user_id, company_id, role, status)
    VALUES (auth.uid(), v_new_branch_id, 'owner', 'active');

    RETURN v_new_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Convite de Membro
CREATE OR REPLACE FUNCTION public.invite_member(p_email TEXT, p_company_id UUID, p_role TEXT)
RETURNS UUID AS $$
DECLARE
    v_invite_id UUID;
BEGIN
    -- Valida se quem convida tem permissão na empresa alvo
    IF NOT EXISTS (
        SELECT 1 FROM public.company_memberships 
        WHERE user_id = auth.uid() AND company_id = p_company_id AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permissão insuficiente para convidar membros para esta empresa.';
    END IF;

    INSERT INTO public.invites (email, company_id, invited_by, role)
    VALUES (p_email, p_company_id, auth.uid(), p_role)
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aceite de Convite
CREATE OR REPLACE FUNCTION public.accept_invite(p_token UUID)
RETURNS VOID AS $$
DECLARE
    v_invite RECORD;
BEGIN
    SELECT * INTO v_invite FROM public.invites WHERE token = p_token AND status = 'pending';

    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Convite inválido, expirado ou já aceito.';
    END IF;

    -- Cria a membership
    INSERT INTO public.company_memberships (user_id, company_id, role, status)
    VALUES (auth.uid(), v_invite.company_id, v_invite.role, 'active')
    ON CONFLICT (user_id, company_id) DO UPDATE SET status = 'active', role = EXCLUDED.role;

    -- Marca como aceito
    UPDATE public.invites SET status = 'accepted' WHERE id = v_invite.id;

    -- Define como empresa ativa se for a primeira ou por conveniência
    UPDATE public.users SET active_company_id = v_invite.company_id WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

END $$;

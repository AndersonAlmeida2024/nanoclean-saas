-- ============================================================================
-- SAAS MATRIX & BRANCHES (MATRIZ & FILIAIS)
-- Implementation: Idempotent, RLS-Safe, Multi-tenant
-- ============================================================================

DO $$ 
BEGIN

-- 1. ESTRUTURA HIERÁRQUICA DE EMPRESAS
-------------------------------------------------------------------------------
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'branch' CHECK (company_type IN ('matrix', 'branch'));

CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON public.companies(parent_company_id);

-- 2. ACESSO MULTI-EMPRESA (MEMBERSHIPS)
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

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_company_id ON public.company_memberships(company_id);

-- 3. CONTEXTO DE SESSÃO (ACTIVE COMPANY)
-------------------------------------------------------------------------------
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS active_company_id UUID REFERENCES public.companies(id);

-- 4. MIGRAÇÃO DE DADOS LEGADOS: Transformar o vínculo 1:1 atual em Membership
-------------------------------------------------------------------------------
INSERT INTO public.company_memberships (user_id, company_id, role)
SELECT id, company_id, role 
FROM public.users 
WHERE company_id IS NOT NULL
ON CONFLICT (user_id, company_id) DO NOTHING;

-- Definir a empresa atual como a ativa inicial
UPDATE public.users SET active_company_id = company_id WHERE active_company_id IS NULL;

-- 5. FUNÇÕES HELPER DE SEGURANÇA (O CORAÇÃO DO SWITCH)
-------------------------------------------------------------------------------

-- Retorna a empresa que o usuário está "atuando" no momento
CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS UUID AS $$
  SELECT active_company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Substituir o alias antigo para usar o novo contexto dinâmico
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID AS $$
  SELECT public.get_active_company_id();
$$ LANGUAGE sql STABLE;

-- 6. RPCs: LÓGICA DE NEGÓCIO SEGURA
-------------------------------------------------------------------------------

-- Troca a empresa ativa (valida se o usuário tem acesso)
CREATE OR REPLACE FUNCTION public.switch_company(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.company_memberships 
        WHERE user_id = auth.uid() AND company_id = p_company_id AND status = 'active'
    ) THEN
        UPDATE public.users SET active_company_id = p_company_id WHERE id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Você não tem permissão para acessar esta empresa.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cria uma filial (Apenas Matriz Owner/Admin)
CREATE OR REPLACE FUNCTION public.create_branch(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
    v_matrix_id UUID;
    v_new_branch_id UUID;
BEGIN
    SELECT active_company_id INTO v_matrix_id FROM public.users WHERE id = auth.uid();
    
    -- Validar se quem cria é owner/admin da matriz atual
    IF NOT EXISTS (
        SELECT 1 FROM public.company_memberships 
        WHERE user_id = auth.uid() AND company_id = v_matrix_id AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem criar filiais.';
    END IF;

    INSERT INTO public.companies (name, slug, parent_company_id, company_type)
    VALUES (p_name, p_slug, v_matrix_id, 'branch')
    RETURNING id INTO v_new_branch_id;

    -- O criador automaticamente ganha acesso à filial como owner
    INSERT INTO public.company_memberships (user_id, company_id, role)
    VALUES (auth.uid(), v_new_branch_id, 'owner');

    RETURN v_new_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RE-APLICAR RLS COM O NOVO CONTEXTO DINÂMICO
-------------------------------------------------------------------------------

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memberships_view_own" ON public.company_memberships;
CREATE POLICY "memberships_view_own" ON public.company_memberships
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Re-aplicar políticas nas tabelas de negócio usando public.current_company_id()
-- (Como já configuramos as políticas para usar essa função, elas agora são dinâmicas!)

END $$;

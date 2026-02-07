-- arquivo: supabase/migrations/20260201_999_golden_master.sql

-- DEPENDS_ON: NONE
-- SAFE_TO_REAPPLY: YES (Idempotent)
-- BREAKING_CHANGE: NO
-- VERSION: v1_core_multitenant
-- ============================================================================

-- 1. ESTRUTURA CORE (TENANTS & USERS)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id),
  role TEXT DEFAULT 'owner',
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices Críticos
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- 2. FUNÇÕES DE SEGURANÇA (SINGLE SOURCE OF TRUTH)
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. TRIGGER DE AUTOSYNC NO SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- Cria uma empresa padrão para cada novo usuário (Modelo de Self-Service Signup)
  INSERT INTO public.companies (name, slug)
  VALUES ('Minha Empresa', 'empresa-' || substr(NEW.id::text, 1, 8))
  RETURNING id INTO new_company_id;

  INSERT INTO public.users (id, company_id, role, full_name)
  VALUES (
    NEW.id, 
    new_company_id, 
    'owner', 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABELAS DE NEGÓCIO COM DEFAULTS MULTI-TENANT
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT public.get_current_user_company_id() REFERENCES public.companies(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT public.get_current_user_company_id() REFERENCES public.companies(id);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS company_id UUID DEFAULT public.get_current_user_company_id() REFERENCES public.companies(id);

-- 5. POLÍTICAS RLS (BLINDAGEM TOTAL)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Exemplo para CLIENTS (Padrão para todas)
DROP POLICY IF EXISTS "clients_isolation_policy" ON public.clients;
CREATE POLICY "clients_isolation_policy" ON public.clients
  FOR ALL USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Repetir padrão para Appointments e Transactions
DROP POLICY IF EXISTS "appointments_isolation_policy" ON public.appointments;
CREATE POLICY "appointments_isolation_policy" ON public.appointments
  FOR ALL USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

DROP POLICY IF EXISTS "transactions_isolation_policy" ON public.transactions;
CREATE POLICY "transactions_isolation_policy" ON public.transactions
  FOR ALL USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- 6. PERMISSÕES DE PERFIL
CREATE POLICY "users_view_own_company" ON public.users
  FOR SELECT USING (company_id = (SELECT company_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "companies_view_own" ON public.companies
  FOR SELECT USING (id = public.get_current_user_company_id());

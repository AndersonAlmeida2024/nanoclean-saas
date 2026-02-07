-- ============================================================================
-- SETUP COMPLETO MULTI-TENANT - NANOCLEN
-- Execute no Supabase Dashboard (tudo de uma vez)
-- ============================================================================

-- ============================================================================
-- 1. CRIAR TABELA COMPANYS (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Minha Empresa',
  slug TEXT UNIQUE,
  plan TEXT DEFAULT 'free',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. ADICIONAR company_id ÀS TABELAS EXISTENTES
-- ============================================================================

DO $$ 
BEGIN
  -- CLIENTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company_id UUID;
    CREATE INDEX IF NOT EXISTS idx_clients_company_id ON public.clients(company_id);
  END IF;

  -- APPOINTMENTS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
    ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS company_id UUID;
    CREATE INDEX IF NOT EXISTS idx_appointments_company_id ON public.appointments(company_id);
  END IF;

  -- TRANSACTIONS
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS company_id UUID;
    CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
  END IF;
END $$;

-- ============================================================================
-- 3. HABILITAR RLS (ignora se tabela não existe)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
    ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

ALTER TABLE public.companys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. POLICIES - COMPANYS
-- ============================================================================

DROP POLICY IF EXISTS "companys_select" ON public.companys;
DROP POLICY IF EXISTS "companys_insert" ON public.companys;
DROP POLICY IF EXISTS "companys_update" ON public.companys;

CREATE POLICY "companys_select" ON public.companys FOR SELECT
USING (id = public.get_current_user_company_id());

CREATE POLICY "companys_insert" ON public.companys FOR INSERT
WITH CHECK (true);

CREATE POLICY "companys_update" ON public.companys FOR UPDATE
USING (id = public.get_current_user_company_id())
WITH CHECK (id = public.get_current_user_company_id());

-- ============================================================================
-- 5. POLICIES - CLIENTS (se existir)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "clients_select" ON public.clients;
    DROP POLICY IF EXISTS "clients_insert" ON public.clients;
    DROP POLICY IF EXISTS "clients_update" ON public.clients;
    DROP POLICY IF EXISTS "clients_delete" ON public.clients;
    
    CREATE POLICY "clients_select" ON public.clients FOR SELECT
    USING (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "clients_insert" ON public.clients FOR INSERT
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "clients_update" ON public.clients FOR UPDATE
    USING (company_id = public.get_current_user_company_id())
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "clients_delete" ON public.clients FOR DELETE
    USING (company_id = public.get_current_user_company_id());
  END IF;
END $$;

-- ============================================================================
-- 6. POLICIES - APPOINTMENTS (se existir)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'appointments' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "appointments_select" ON public.appointments;
    DROP POLICY IF EXISTS "appointments_insert" ON public.appointments;
    DROP POLICY IF EXISTS "appointments_update" ON public.appointments;
    DROP POLICY IF EXISTS "appointments_delete" ON public.appointments;
    
    CREATE POLICY "appointments_select" ON public.appointments FOR SELECT
    USING (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "appointments_insert" ON public.appointments FOR INSERT
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "appointments_update" ON public.appointments FOR UPDATE
    USING (company_id = public.get_current_user_company_id())
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "appointments_delete" ON public.appointments FOR DELETE
    USING (company_id = public.get_current_user_company_id());
  END IF;
END $$;

-- ============================================================================
-- 7. POLICIES - TRANSACTIONS (se existir)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    DROP POLICY IF EXISTS "transactions_select" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_insert" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_update" ON public.transactions;
    DROP POLICY IF EXISTS "transactions_delete" ON public.transactions;
    
    CREATE POLICY "transactions_select" ON public.transactions FOR SELECT
    USING (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "transactions_insert" ON public.transactions FOR INSERT
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "transactions_update" ON public.transactions FOR UPDATE
    USING (company_id = public.get_current_user_company_id())
    WITH CHECK (company_id = public.get_current_user_company_id());
    
    CREATE POLICY "transactions_delete" ON public.transactions FOR DELETE
    USING (company_id = public.get_current_user_company_id());
  END IF;
END $$;

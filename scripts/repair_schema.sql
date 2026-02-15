-- ==========================================
-- SCHEMA REPAIR SCRIPT - NANOCLEAN SAAS
-- Run this in Supabase SQL Editor (SQL Editor -> New Query)
-- ==========================================

-- 1. FIX COMPANIES TABLE (Missing columns for Matrix/Branch and Trial)
DO $$ 
BEGIN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS parent_company_id UUID REFERENCES public.companies(id);
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS company_type TEXT DEFAULT 'branch' CHECK (company_type IN ('matrix', 'branch'));
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial_expired'));
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 days');
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 2. FIX CLIENTS TABLE (Missing stage column for Kanban)
DO $$ 
BEGIN
    ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'quoted', 'scheduled', 'completed', 'lost'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- 3. RE-CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON public.companies(parent_company_id);
CREATE INDEX IF NOT EXISTS idx_clients_stage ON public.clients(stage);

-- 4. INITIALIZE DATA FOR EXISTING RECORDS
UPDATE public.companies SET trial_ends_at = created_at + INTERVAL '15 days' WHERE trial_ends_at IS NULL;
UPDATE public.clients SET stage = 'lead' WHERE stage IS NULL;

-- 5. VERIFICATION QUERY
SELECT 'Schema Repair Complete' as status;

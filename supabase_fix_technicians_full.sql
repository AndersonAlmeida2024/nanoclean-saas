-- FIX V2: Script Unificado para Tabela de Técnicos e Comissões
-- Author: Antigravity (Backend Specialist)
-- Date: 2026-02-13
-- Objetivo: Garantir tabela, colunas e aumentar precisão numérica para valores fixos

BEGIN;

-- 1. Criação da Tabela Base (Se não existir)
CREATE TABLE IF NOT EXISTS public.technicians (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    color text NOT NULL DEFAULT '#06b6d4',
    commission_rate numeric(10,2) DEFAULT 0.00, -- AUMENTADO para suportar valores > 999.99
    commission_type text CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent',
    pix_key text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT technicians_pkey PRIMARY KEY (id)
);

-- 2. Ajustes de Colunas (Caso tabela já exista)
DO $$ 
BEGIN 
    -- Adicionar commission_type se faltar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technicians') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'commission_type') THEN
            ALTER TABLE public.technicians 
            ADD COLUMN commission_type text CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent';
        END IF;

        -- Alterar precisão de commission_rate para suportar valores fixos altos
        ALTER TABLE public.technicians 
        ALTER COLUMN commission_rate TYPE numeric(10,2);
    END IF;
END $$;

-- 3. Índices (Idempotente)
CREATE INDEX IF NOT EXISTS technicians_company_id_idx ON public.technicians(company_id);
CREATE INDEX IF NOT EXISTS technicians_user_id_idx ON public.technicians(user_id);

-- 4. RLS (Idempotente)
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- 5. Policies (Recriação para garantir integridade)
DROP POLICY IF EXISTS "Users can view technicians from their company" ON public.technicians;
DROP POLICY IF EXISTS "Admins can insert technicians" ON public.technicians;
DROP POLICY IF EXISTS "Admins can update technicians" ON public.technicians;
DROP POLICY IF EXISTS "Admins can delete technicians" ON public.technicians;

-- Policy Views
CREATE POLICY "Users can view technicians from their company"
    ON public.technicians FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = technicians.company_id
            AND cm.user_id = auth.uid()
        )
    );

-- Policy Insert
CREATE POLICY "Admins can insert technicians"
    ON public.technicians FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = technicians.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Policy Update
CREATE POLICY "Admins can update technicians"
    ON public.technicians FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = technicians.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- Policy Delete
CREATE POLICY "Admins can delete technicians"
    ON public.technicians FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = technicians.company_id
            AND cm.user_id = auth.uid()
            AND cm.role IN ('owner', 'admin')
        )
    );

-- 6. Trigger Update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_technicians_updated_at ON public.technicians;
CREATE TRIGGER update_technicians_updated_at
    BEFORE UPDATE ON public.technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;

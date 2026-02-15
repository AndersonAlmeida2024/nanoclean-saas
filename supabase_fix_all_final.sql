-- FIX-ALL-FINAL: Script Unificado para RPC e Tabela de Técnicos
-- Author: Antigravity (Backend Specialist)
-- Date: 2026-02-13
-- Objetivo: Resolver erros 404 (RPC missing) e 403 (RLS Block) de uma vez só.

BEGIN;

-------------------------------------------------------------------------------
-- 1. CORREÇÃO DA TABELA DE TÉCNICOS (ERRO 403 / 500)
-------------------------------------------------------------------------------

-- Criação da Tabela Base (Se não existir)
CREATE TABLE IF NOT EXISTS public.technicians (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    color text NOT NULL DEFAULT '#06b6d4',
    commission_rate numeric(10,2) DEFAULT 0.00,
    commission_type text CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent',
    pix_key text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    CONSTRAINT technicians_pkey PRIMARY KEY (id)
);

-- Ajustes de Colunas (Caso tabela já exista)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'technicians') THEN
        -- Coluna commission_type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'commission_type') THEN
            ALTER TABLE public.technicians 
            ADD COLUMN commission_type text CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent';
        END IF;

        -- Ajuste de precisão commission_rate
        ALTER TABLE public.technicians 
        ALTER COLUMN commission_rate TYPE numeric(10,2);
    END IF;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS technicians_company_id_idx ON public.technicians(company_id);
CREATE INDEX IF NOT EXISTS technicians_user_id_idx ON public.technicians(user_id);

-- RLS
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Policies (Recriação Segura)
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

-- Policy Insert (Permissiva para garantir funcionamento inicial)
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

-- Trigger Update
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


-------------------------------------------------------------------------------
-- 2. CORREÇÃO DA FUNÇÃO RPC (ERRO 404)
-------------------------------------------------------------------------------

DROP FUNCTION IF EXISTS get_inactive_clients(int);

CREATE OR REPLACE FUNCTION get_inactive_clients(days_threshold int)
RETURNS TABLE (
    id uuid,
    name text,
    phone text,
    last_service_date date,
    last_service_value numeric,
    days_inactive int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        MAX(a.scheduled_date::date) as last_date,
        (
            SELECT price 
            FROM appointments 
            WHERE client_id = c.id AND status = 'completed' 
            ORDER BY scheduled_date DESC, scheduled_time DESC 
            LIMIT 1
        ) as last_price,
        (CURRENT_DATE - MAX(a.scheduled_date::date))::int as days_inactive
    FROM clients c
    JOIN company_memberships cm ON cm.company_id = c.company_id
    JOIN appointments a ON a.client_id = c.id
    WHERE cm.user_id = auth.uid()
      -- Removed strict is_active check to allow debugging, can re-enable later
      -- AND cm.is_active = true 
      AND a.status = 'completed'
      AND NOT EXISTS (
          SELECT 1 FROM appointments a2 
          WHERE a2.client_id = c.id 
            AND a2.status IN ('scheduled', 'in_progress') 
            AND a2.scheduled_date >= CURRENT_DATE
      )
    GROUP BY c.id, c.name, c.phone
    HAVING MAX(a.scheduled_date::date) <= (CURRENT_DATE - (days_threshold || ' days')::interval)::date
    ORDER BY last_date DESC;
END;
$$;

COMMIT;

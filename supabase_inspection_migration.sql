-- 1. Tabela de Inspeções de Serviço
CREATE TABLE IF NOT EXISTS public.service_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id),
    items JSONB DEFAULT '{}'::jsonb, -- Checklist: {manchas: true, rasgos: false, etc}
    photos_before TEXT[] DEFAULT '{}',
    photos_after TEXT[] DEFAULT '{}',
    customer_signature TEXT, -- Base64 da assinatura
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE public.service_inspections ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS para service_inspections
CREATE POLICY "Membros da empresa podem gerenciar inspeções" ON public.service_inspections
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 4. Adicionar coluna de Check-in na tabela de agendamentos
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- 5. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_inspections_appointment ON public.service_inspections(appointment_id);
CREATE INDEX IF NOT EXISTS idx_inspections_company ON public.service_inspections(company_id);

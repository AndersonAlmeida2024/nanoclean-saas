-- PHASE 2 MIGRATION: Agenda e Comissões
-- Author: Antigravity (Backend Specialist)
-- Date: 2026-02-13

BEGIN;

-------------------------------------------------------------------------------
-- 1. SCHEMA UPDATE: Appointments
-------------------------------------------------------------------------------

DO $$ 
BEGIN 
    -- Adicionar technician_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'technician_id') THEN
        ALTER TABLE public.appointments 
        ADD COLUMN technician_id uuid REFERENCES public.technicians(id) ON DELETE SET NULL;
        CREATE INDEX appointments_technician_id_idx ON public.appointments(technician_id);
    END IF;
END $$;

-------------------------------------------------------------------------------
-- 2. TRIGGER: Comissão Automática
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION calculate_commission_on_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_tech_commission_rate numeric;
    v_tech_commission_type text;
    v_commission_amount numeric;
    v_tech_user_id uuid;
BEGIN
    -- Só executa quando status muda para 'completed'
    IF NEW.status = 'completed' AND OLD.status <> 'completed' AND NEW.technician_id IS NOT NULL THEN
        
        -- Buscar dados do técnico
        SELECT commission_rate, commission_type, user_id
        INTO v_tech_commission_rate, v_tech_commission_type, v_tech_user_id
        FROM public.technicians
        WHERE id = NEW.technician_id;

        IF v_tech_commission_rate > 0 THEN
            -- Calcular valor
            IF v_tech_commission_type = 'fixed' THEN
                v_commission_amount := v_tech_commission_rate;
            ELSE
                v_commission_amount := (NEW.price * v_tech_commission_rate) / 100;
            END IF;

            -- Inserir despesa de comissão (Pendente)
            INSERT INTO public.transactions (
                company_id,
                user_id, -- Quem registrou (o sistema/gatilho, mas usamos o user do appointment ou nulo, melhor usar o do técnico para rastreio ou do owner)
                type,
                category,
                amount,
                description,
                status,
                date,
                appointment_id
            ) VALUES (
                NEW.company_id,
                NEW.user_id, -- Owner do agendamento
                'expense',
                'Comissão',
                v_commission_amount,
                'Comissão - Serviço #' || NEW.id,
                'pending',
                CURRENT_DATE,
                NEW.id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_commission ON public.appointments;
CREATE TRIGGER trigger_calculate_commission
    AFTER UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION calculate_commission_on_complete();

-------------------------------------------------------------------------------
-- 3. RLS UPDATE: Appointments (Tech View)
-------------------------------------------------------------------------------

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view appointments from their company" ON public.appointments;

-- Nova Policy de Leitura Inteligente
-- 1. Se é Owner/Admin: Vê tudo da empresa
-- 2. Se é Técnico: Vê apenas o que é dele OU o que não tem técnico atribuído (Opcional, mas vamos restringir ao dele)
CREATE POLICY "Users can view appointments from their company"
    ON public.appointments FOR SELECT
    USING (
        -- Regra Base: Pertence à empresa
        company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Regra Específica:
            -- Se for Owner/Admin: Vê tudo (check_is_admin function criada anteriormente ajuda aqui, mas vamos fazer direto para evitar dependência circular se a função falhar)
            EXISTS (
                SELECT 1 FROM public.company_memberships 
                WHERE company_id = appointments.company_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
            OR
            -- Se for Técnico (e technician_id bater com o tecnico vinculado ao user_id)
            (
                technician_id IN (
                    SELECT id FROM public.technicians 
                    WHERE user_id = auth.uid()
                )
            )
            OR
            -- Fallback: Se não tem technician_id, todos veem? Ou só admins?
            -- Vamos deixar visível para admins e para quem criou (user_id)
            user_id = auth.uid()
        )
    );

-- Manter policies de Insert/Update/Delete (geralmente admins, ou tech pode editar o seu?)
-- Vamos manter simples: Admins podem tudo. Techs podem atualizar status do SEU agendamento.

DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins and Assigned Techs can update appointments"
    ON public.appointments FOR UPDATE
    USING (
        -- Mesma lógica do SELECT
         company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid()
        )
        AND (
            EXISTS (
                SELECT 1 FROM public.company_memberships 
                WHERE company_id = appointments.company_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
            OR
            technician_id IN (
                SELECT id FROM public.technicians 
                WHERE user_id = auth.uid()
            )
        )
    );

COMMIT;

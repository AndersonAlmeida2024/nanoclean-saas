-- PHASE 3: Segurança Blindada Portal do Técnico
-- Author: Antigravity (Security Specialist)
-- Date: 2026-02-13

BEGIN;

-------------------------------------------------------------------------------
-- 1. BLOQUEIO DE FINANÇAS (Transactions)
-------------------------------------------------------------------------------

-- Somente Owners e Admins podem ver transações
DROP POLICY IF EXISTS "Users can view transactions from their company" ON public.transactions;
CREATE POLICY "Users can view transactions from their company"
    ON public.transactions FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-------------------------------------------------------------------------------
-- 2. REFORÇO DE AGENDA (Appointments)
-------------------------------------------------------------------------------

-- Já existe na Fase 2, mas vamos garantir que o técnico SÓ veja o dele
DROP POLICY IF EXISTS "Users can view appointments from their company" ON public.appointments;
CREATE POLICY "Users can view appointments from their company"
    ON public.appointments FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Owner/Admin: Vê tudo
            EXISTS (
                SELECT 1 FROM public.company_memberships 
                WHERE company_id = appointments.company_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
            OR
            -- Técnico: Vê apenas o seu
            technician_id IN (
                SELECT id FROM public.technicians 
                WHERE user_id = auth.uid()
            )
        )
    );

-------------------------------------------------------------------------------
-- 3. VISIBILIDADE DE CLIENTES (Clients)
-------------------------------------------------------------------------------

-- Técnicos só podem ver clientes que têm agendamentos vinculados a eles
DROP POLICY IF EXISTS "Users can view clients from their company" ON public.clients;
CREATE POLICY "Users can view clients from their company"
    ON public.clients FOR SELECT
    USING (
        company_id IN (
            SELECT company_id FROM public.company_memberships 
            WHERE user_id = auth.uid()
        )
        AND (
            -- Owner/Admin: Vê todos
            EXISTS (
                SELECT 1 FROM public.company_memberships 
                WHERE company_id = clients.company_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            )
            OR
            -- Técnico: Vê apenas se há vínculo na agenda
            EXISTS (
                SELECT 1 FROM public.appointments 
                WHERE client_id = clients.id 
                AND technician_id IN (
                    SELECT id FROM public.technicians 
                    WHERE user_id = auth.uid()
                )
            )
        )
    );

COMMIT;

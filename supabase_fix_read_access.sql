-- FIX READ ACESS: Garantir que usuários vejam os técnicos
-- Author: Antigravity
-- Date: 2026-02-13
-- Objetivo: Usar SECURITY DEFINER também para leitura (SELECT), resolvendo o "salvou mas não aparece".

BEGIN;

-------------------------------------------------------------------------------
-- 1. FUNÇÃO HELPER DE MEMBRESIA (Bypass RLS Seguro)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION check_is_member(company_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões elevadas para checar membership
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.company_memberships 
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        -- Não restringimos por is_active aqui para evitar sumir dados em edge cases
    );
END;
$$;

-------------------------------------------------------------------------------
-- 2. ATUALIZAR POLICY DE SELECT
-------------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view technicians from their company" ON public.technicians;

CREATE POLICY "Users can view technicians from their company"
    ON public.technicians FOR SELECT
    USING (
        check_is_member(company_id) -- Usa a função segura
    );

COMMIT;

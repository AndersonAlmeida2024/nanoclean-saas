-- FIX RLS DEFINER: Solução Robusta para Permissões
-- Author: Antigravity (Backend Specialist)
-- Date: 2026-02-13
-- Objetivo: Usar SECURITY DEFINER para checar permissões, evitando bloqueios de RLS em cascata.

BEGIN;

-------------------------------------------------------------------------------
-- 1. FUNÇÃO HELPER (Bypass RLS com Segurança)
-------------------------------------------------------------------------------

-- Esta função roda como "Superusuário/Dono" do banco, permitindo ler company_memberships
-- sem ser bloqueada pelas políticas da própria tabela company_memberships.
CREATE OR REPLACE FUNCTION check_is_admin(company_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- <--- O Segredo: Roda com permissões elevadas apenas para este check
SET search_path = public -- Segurança: previne hijacking
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.company_memberships 
        WHERE company_id = company_uuid
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND is_active = true
    );
END;
$$;

-------------------------------------------------------------------------------
-- 2. APLICAR NOVA POLÍTICA NA TABELA TECHNICIANS
-------------------------------------------------------------------------------

-- Recriar Policies usando a função segura
DROP POLICY IF EXISTS "Admins can insert technicians" ON public.technicians;
DROP POLICY IF EXISTS "Admins can update technicians" ON public.technicians;
DROP POLICY IF EXISTS "Admins can delete technicians" ON public.technicians;

-- Policy Insert
CREATE POLICY "Admins can insert technicians"
    ON public.technicians FOR INSERT
    WITH CHECK (
        check_is_admin(company_id) -- Usa a função segura
    );

-- Policy Update
CREATE POLICY "Admins can update technicians"
    ON public.technicians FOR UPDATE
    USING (
        check_is_admin(company_id)
    );

-- Policy Delete
CREATE POLICY "Admins can delete technicians"
    ON public.technicians FOR DELETE
    USING (
        check_is_admin(company_id)
    );

-- Garantir acesso de leitura (Select)
DROP POLICY IF EXISTS "Users can view technicians from their company" ON public.technicians;
CREATE POLICY "Users can view technicians from their company"
    ON public.technicians FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_memberships cm
            WHERE cm.company_id = technicians.company_id
            AND cm.user_id = auth.uid()
        )
    );

COMMIT;

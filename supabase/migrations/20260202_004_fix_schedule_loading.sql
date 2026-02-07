-- ============================================================================
-- BUGFIX: RESTAURAÇÃO DE AGENDAMENTOS E TOKENS PÚBLICOS
-- ============================================================================

-- 1. Unificar funções de Contexto (O Usuário mencionou 'current_company_id')
-- Criamos um alias para garantir que tanto o código antigo quanto o novo funcionem.
CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID AS $$
  SELECT public.get_current_user_company_id();
$$ LANGUAGE sql STABLE;

-- 2. Corrigir Coluna Faltante (Causa raiz do Erro 400)
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- 3. Garantir Políticas RLS (Prevenção de lista vazia / 403)
-- Clients
DROP POLICY IF EXISTS "clients_isolation_policy" ON public.clients;
CREATE POLICY "clients_isolation_policy" ON public.clients
  FOR ALL TO authenticated
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Appointments
DROP POLICY IF EXISTS "appointments_isolation_policy" ON public.appointments;
CREATE POLICY "appointments_isolation_policy" ON public.appointments
  FOR ALL TO authenticated
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- Transactions
DROP POLICY IF EXISTS "transactions_isolation_policy" ON public.transactions;
CREATE POLICY "transactions_isolation_policy" ON public.transactions
  FOR ALL TO authenticated
  USING (company_id = public.get_current_user_company_id())
  WITH CHECK (company_id = public.get_current_user_company_id());

-- 4. Garantir Acesso Público Controlado (Para o link de agenda do cliente)
-- Revogar acesso direto e usar apenas RPC (Hardening que fizemos antes)
REVOKE SELECT ON public.appointments FROM anon;

CREATE OR REPLACE FUNCTION public.get_public_appointment(p_token UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'service_type', a.service_type,
        'address', COALESCE(a.address, c.address),
        'notes', a.notes,
        'price', a.price,
        'client', jsonb_build_object('name', c.name),
        'companies', jsonb_build_object('name', comp.name)
    ) INTO result
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.companies comp ON a.company_id = comp.id
    WHERE a.public_token = p_token;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_public_appointment(UUID) TO anon;

-- 5. Garantir que company_id nunca seja NULL no INSERT
ALTER TABLE public.appointments ALTER COLUMN company_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN company_id SET NOT NULL;

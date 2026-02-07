-- ============================================================================
-- MODEL A REVERSION & AGENDA HARDENING
-- Reverte as mudanças de Matriz/Filiais e foca na estabilidade da Agenda
-- ============================================================================

DO $$ 
BEGIN

-- 1. LIMPEZA DE ESTRUTURA HIERÁRQUICA (REVERSÃO)
-------------------------------------------------------------------------------
-- Remove as colunas experimentais de Matriz se existirem
IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'parent_company_id') THEN
    ALTER TABLE public.companies DROP COLUMN parent_company_id;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'companies' AND column_name = 'company_type') THEN
    ALTER TABLE public.companies DROP COLUMN company_type;
END IF;

IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'active_company_id') THEN
    ALTER TABLE public.users DROP COLUMN active_company_id;
END IF;

-- Remove tabelas experimentais
DROP TABLE IF EXISTS public.company_memberships CASCADE;

-- 2. RESTAURAÇÃO DO HELPER DE SEGURANÇA (SINGLE TENANT)
-------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS UUID AS $$
  SELECT public.get_current_user_company_id();
$$ LANGUAGE sql STABLE;

-- 3. HARDENING DA AGENDA (REALTIME & IDENTITY)
-------------------------------------------------------------------------------

-- Habilita o envio de todos os dados nas atualizações/deletes do Realtime
-- Essencial para o frontend reagir corretamente sem dados incompletos
ALTER TABLE public.appointments REPLICA IDENTITY FULL;

-- Garante que a tabela está na publicação de Realtime
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION WHEN OTHERS THEN
    -- Ignora erro se já estiver na publicação
    NULL;
END;

-- 4. POLÍTICAS RLS ROBUSTAS (MODELO A)
-------------------------------------------------------------------------------

-- Garantir isolamento por company_id
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_isolation_policy" ON public.appointments;
CREATE POLICY "appointments_isolation_policy" ON public.appointments
FOR ALL TO authenticated
USING (company_id = public.get_current_user_company_id())
WITH CHECK (company_id = public.get_current_user_company_id());

-- Garantir isolamento em clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clients_isolation_policy" ON public.clients;
CREATE POLICY "clients_isolation_policy" ON public.clients
FOR ALL TO authenticated
USING (company_id = public.get_current_user_company_id())
WITH CHECK (company_id = public.get_current_user_company_id());

-- 4. RPC DE SEGURANÇA HARDENING
-------------------------------------------------------------------------------
-- RPC público para compartilhar agendamento (já existente, apenas reforçando)
CREATE OR REPLACE FUNCTION public.get_public_appointment(p_token UUID)
RETURNS TABLE (
    id UUID,
    scheduled_date DATE,
    scheduled_time TIME,
    service_type TEXT,
    status TEXT,
    client_name TEXT,
    address TEXT,
    price DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.scheduled_date,
        a.scheduled_time,
        a.service_type,
        a.status,
        c.name as client_name,
        a.address,
        a.price
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    WHERE a.public_token = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

END $$;

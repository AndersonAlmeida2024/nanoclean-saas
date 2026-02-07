-- DEPENDS_ON: 20260202_002_v3_public_sharing.sql
-- SAFE_TO_REAPPLY: YES
-- BREAKING_CHANGE: YES (Switching from Table RLS to RPC)
-- VERSION: v3_security_hardening
-- ============================================================================
-- BLOCK 5.1: REFORÇO DE SEGURANÇA (RPC-ONLY PARA ANON)
-- ============================================================================

-- 1. Remover a política permissiva que permitia listagem anônima (mesmo que filtrada)
DROP POLICY IF EXISTS "appointments_public_share_policy" ON public.appointments;

-- 2. Garantir que ANON não tenha acesso direto à tabela (Defensivo)
REVOKE SELECT ON public.appointments FROM anon;

-- 3. Criar Função de Acesso Controlado (RPC)
-- Esta função é SECURITY DEFINER para rodar como sistema, mas o ANON só a executa com o token.
CREATE OR REPLACE FUNCTION public.get_public_appointment(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'date', a.date,
    'scheduled_time', a.scheduled_time,
    'service_type', a.service_type,
    'address', COALESCE(a.address, c.address),
    'client_name', c.name,
    'company_name', comp.name
  ) INTO v_result
  FROM public.appointments a
  JOIN public.clients c ON a.client_id = c.id
  JOIN public.companies comp ON a.company_id = comp.id
  WHERE a.public_token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Permitir que ANON execute apenas esta função específica
GRANT EXECUTE ON FUNCTION public.get_public_appointment(UUID) TO anon;

-- UPDATE DECISION_LOG.md: Decisão 6 - Acesso Público via RPC para evitar Mass Listing.

-- Migration: security_hardening
-- Date: 2026-02-15
-- Author: Sentinel 🛡️
-- Description: Hardening of SECURITY DEFINER functions and secure RPC for public inspections.

BEGIN;

-- 1. Hardening de todas as funções SECURITY DEFINER (Search Path Hijacking)
-- Garante que todas as funções com privilégios elevados usem caminhos de busca seguros.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT ns.nspname || '.' || p.proname AS full_name, pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace ns ON p.pronamespace = ns.oid
        WHERE ns.nspname = 'public'
          AND p.prosecdef = true
    LOOP
        EXECUTE format('ALTER FUNCTION %s(%s) SET search_path = public', func_record.full_name, func_record.args);
    END LOOP;
END $$;

-- 2. RPC Seguro para Inspeções Públicas
-- Substitui o acesso direto via SELECT (IDOR) por acesso validado via Token Público.
CREATE OR REPLACE FUNCTION public.get_public_inspection(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', si.id,
    'items', si.items,
    'photos_before', si.photos_before,
    'photos_after', si.photos_after,
    'customer_signature', si.customer_signature,
    'created_at', si.created_at,
    'appointment', jsonb_build_object(
        'service_type', a.service_type,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'client_name', c.name
    )
  ) INTO v_result
  FROM public.service_inspections si
  JOIN public.appointments a ON si.appointment_id = a.id
  JOIN public.clients c ON a.client_id = c.id
  WHERE a.public_token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Permissões
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID) TO authenticated;

COMMIT;

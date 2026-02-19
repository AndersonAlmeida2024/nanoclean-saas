-- Migration: Security Hardening for SECURITY DEFINER functions
-- Description: Sets explicit search_path to 'public' for critical functions to prevent hijacking.
--              Also adds a secure RPC for public inspection reports.
-- Author: Sentinel 🛡️

BEGIN;

-- 1. Harden existing functions
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_current_user_company_id() SET search_path = public;
ALTER FUNCTION public.get_active_company_id() SET search_path = public;
ALTER FUNCTION public.get_public_appointment(UUID) SET search_path = public;
ALTER FUNCTION public.is_platform_admin() SET search_path = public;

-- 2. Create get_public_inspection RPC
-- This allows anonymous access to inspection reports without needing permissive RLS policies.
CREATE OR REPLACE FUNCTION public.get_public_inspection(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'items', i.items,
    'photos_before', i.photos_before,
    'photos_after', i.photos_after,
    'customer_signature', i.customer_signature,
    'created_at', i.created_at,
    'appointments', jsonb_build_object(
        'service_type', a.service_type,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'clients', jsonb_build_object('name', c.name)
    )
  ) INTO v_result
  FROM public.service_inspections i
  JOIN public.appointments a ON i.appointment_id = a.id
  JOIN public.clients c ON a.client_id = c.id
  WHERE i.id = p_token;

  RETURN v_result;
END;
$$;

-- 3. Grant permissions to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_appointment(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID) TO anon;

COMMIT;

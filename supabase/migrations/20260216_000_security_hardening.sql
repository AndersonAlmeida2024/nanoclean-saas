-- Migration: Security Hardening (RPC-only access and search_path)
-- Author: Sentinel 🛡️
-- Date: 2026-02-16

BEGIN;

-------------------------------------------------------------------------------
-- 1. HARDENING EXISTING FUNCTIONS (Search Path Hijacking Protection)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS UUID AS $$
  SELECT active_company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_public_appointment(p_token UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'date', a.scheduled_date, -- Alias for frontend compatibility
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'service_type', a.service_type,
        'address', COALESCE(a.address, c.address),
        'client_name', c.name, -- For ShareAppointmentPage
        'company_name', comp.name, -- For ShareAppointmentPage
        'notes', a.notes,
        'price', a.price
    ) INTO result
    FROM public.appointments a
    JOIN public.clients c ON a.client_id = c.id
    JOIN public.companies comp ON a.company_id = comp.id
    WHERE a.public_token = p_token;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-------------------------------------------------------------------------------
-- 2. NEW RPC FOR PUBLIC INSPECTIONS (Privacy-First)
-------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_public_inspection(p_inspection_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', si.id,
    'created_at', si.created_at,
    'items', si.items,
    'photos_before', si.photos_before,
    'photos_after', si.photos_after,
    'customer_signature', si.customer_signature,
    'appointments', jsonb_build_object(
      'service_type', a.service_type,
      'scheduled_date', a.scheduled_date,
      'scheduled_time', a.scheduled_time,
      'clients', jsonb_build_object('name', c.name)
    )
  ) INTO v_result
  FROM public.service_inspections si
  JOIN public.appointments a ON si.appointment_id = a.id
  JOIN public.clients c ON a.client_id = c.id
  WHERE si.id = p_inspection_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-------------------------------------------------------------------------------
-- 3. REVOKE DIRECT ACCESS TO ANON
-------------------------------------------------------------------------------

-- Ensure anon cannot select directly from sensitive tables
REVOKE SELECT ON public.service_inspections FROM anon;
REVOKE SELECT ON public.appointments FROM anon;

-- Grant execution permissions to anon for the secure RPCs
GRANT EXECUTE ON FUNCTION public.get_public_appointment(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID) TO anon;

COMMIT;

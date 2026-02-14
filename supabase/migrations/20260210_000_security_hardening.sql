-- ============================================================================
-- Migration: Security Hardening (Sentinel)
-- Description: Fix Search Path Hijacking and implement secure Public Reports (IDOR Fix)
-- ============================================================================

-- 1. HARDEN SEARCH PATH FOR ALL SECURITY DEFINER FUNCTIONS
-------------------------------------------------------------------------------
ALTER FUNCTION public.get_current_user_company_id() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.is_platform_admin() SET search_path = public;
ALTER FUNCTION public.get_active_company_id() SET search_path = public;
ALTER FUNCTION public.admin_list_companies() SET search_path = public;
ALTER FUNCTION public.admin_set_company_status(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_provision_company(TEXT, TEXT, TEXT) SET search_path = public;

-- For get_public_appointment, we use the latest signature from 20260202_008
ALTER FUNCTION public.get_public_appointment(UUID) SET search_path = public;

-- 2. SECURE PUBLIC INSPECTIONS (FIX IDOR/MASS LISTING)
-------------------------------------------------------------------------------

-- New RPC that requires a public_token from the associated appointment
CREATE OR REPLACE FUNCTION public.get_public_inspection(p_inspection_id UUID, p_token UUID)
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
    WHERE si.id = p_inspection_id AND a.public_token = p_token;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to anon
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID, UUID) TO anon;

-- Explicitly Revoke direct SELECT for anon to prevent IDOR/Mass Listing
REVOKE SELECT ON public.service_inspections FROM anon;

-- 3. HARDEN STORAGE ACCESS
-------------------------------------------------------------------------------
-- Remove public listing of objects in inspections bucket (security best practice)
-- Files remain accessible via direct public URLs if the bucket is public.
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;

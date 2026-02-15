-- DEPENDS_ON: 20260201_999_golden_master.sql, supabase_inspection_migration.sql
-- SAFE_TO_REAPPLY: YES
-- BREAKING_CHANGE: NO
-- VERSION: v3_secure_public_reports
-- ============================================================================
-- SECURE PUBLIC REPORT ACCESS (RPC-ONLY)
-- ============================================================================

-- 1. Create the RPC function to fetch inspection data securely via token
CREATE OR REPLACE FUNCTION public.get_public_inspection(p_inspection_id UUID, p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'created_at', i.created_at,
    'items', i.items,
    'photos_before', i.photos_before,
    'photos_after', i.photos_after,
    'customer_signature', i.customer_signature,
    'appointments', jsonb_build_object(
        'service_type', a.service_type,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'clients', jsonb_build_object(
            'name', c.name
        )
    )
  ) INTO v_result
  FROM public.service_inspections i
  JOIN public.appointments a ON i.appointment_id = a.id
  JOIN public.clients c ON a.client_id = c.id
  WHERE i.id = p_inspection_id AND a.public_token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID, UUID) TO authenticated;

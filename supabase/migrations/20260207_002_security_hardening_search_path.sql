-- ============================================================================
-- Migration: Security Hardening - Search Path
-- Description: Protect SECURITY DEFINER functions from Search Path Hijacking.
--              This follows PostgreSQL security best practices for Supabase.
-- Author: Sentinel 🛡️
-- ============================================================================

-- Harden all identified SECURITY DEFINER functions by explicitly setting search_path to public.
-- This prevents attackers from creating malicious objects in other schemas to trick these functions.

ALTER FUNCTION public.is_platform_admin() SET search_path = public;
ALTER FUNCTION public.admin_list_companies() SET search_path = public;
ALTER FUNCTION public.admin_set_company_status(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_provision_company(TEXT, TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.get_active_company_id() SET search_path = public;
ALTER FUNCTION public.get_public_appointment(UUID) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_current_user_company_id() SET search_path = public;
ALTER FUNCTION public.current_company_id() SET search_path = public;
ALTER FUNCTION public.switch_company(UUID) SET search_path = public;
ALTER FUNCTION public.create_branch(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.invite_member(TEXT, UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.accept_invite(UUID) SET search_path = public;
ALTER FUNCTION public.accept_company_invite(TEXT) SET search_path = public;

-- Documenting the change for audit purposes
COMMENT ON FUNCTION public.get_public_appointment(UUID) IS 'Public RPC to fetch appointment details by token. Hardened with search_path.';
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to sync auth.users to public.users. Hardened with search_path.';

-- ============================================================================
-- Migration: Security Hardening - Search Path Protection
-- Description: Sets explicit search_path for all SECURITY DEFINER functions.
--              This prevents search-path hijacking vulnerabilities.
-- Author: Sentinel 🛡️
-- Date: 2026-02-16
-- ============================================================================

-- Helper functions
ALTER FUNCTION public.get_current_user_company_id() SET search_path = public;
ALTER FUNCTION public.get_active_company_id() SET search_path = public;
ALTER FUNCTION public.is_platform_admin() SET search_path = public;

-- Public access
ALTER FUNCTION public.get_public_appointment(UUID) SET search_path = public;

-- Platform administration
ALTER FUNCTION public.admin_list_companies() SET search_path = public;
ALTER FUNCTION public.admin_set_company_status(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.admin_provision_company(TEXT, TEXT, TEXT) SET search_path = public;

-- Multi-tenant / Context switching
ALTER FUNCTION public.switch_company(UUID) SET search_path = public;
ALTER FUNCTION public.create_branch(TEXT, TEXT) SET search_path = public;
ALTER FUNCTION public.invite_member(TEXT, UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.accept_invite(UUID) SET search_path = public;
ALTER FUNCTION public.accept_company_invite(TEXT) SET search_path = public;

-- Lifecycle / Triggers
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.calculate_commission_on_complete() SET search_path = public;

-- End of migration

-- ============================================================================
-- SMOKE TEST: Matriz & Filiais Isolation & Switching
-- ============================================================================

BEGIN;

-- 1. Setup Mock Data
INSERT INTO public.companies (id, name, slug, company_type) 
VALUES ('c0000000-0000-0000-0000-000000000001', 'Matrix Corp', 'matrix', 'matrix')
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.users (id, email) 
VALUES ('u0000000-0000-0000-0000-000000000001', 'owner@matrix.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, company_id, role, active_company_id)
VALUES ('u0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.company_memberships (user_id, company_id, role, status)
VALUES ('u0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'owner', 'active')
ON CONFLICT (user_id, company_id) DO NOTHING;

-- 2. Test Branch Creation (as Matrix Owner)
SET ROLE authenticated;
SET auth.uid = 'u0000000-0000-0000-0000-000000000001';

SELECT public.create_branch('Branch Alpha', 'branch-alpha') AS new_branch_id \gset

-- 3. Test Switch Context to Branch
SELECT public.switch_company(:'new_branch_id');

-- Verify active company updated
SELECT CASE 
    WHEN active_company_id = :'new_branch_id' THEN '✅ Switch Success' 
    ELSE '❌ Switch Failed' 
END FROM public.users WHERE id = auth.uid();

-- 4. Test Isolation (Insert in Branch)
INSERT INTO public.clients (name, phone, company_id, user_id) 
VALUES ('Client Branch', '123', :'new_branch_id', auth.uid());

-- 5. Switch back to Matrix and Verify Isolation
SELECT public.switch_company('c0000000-0000-0000-0000-000000000001');

-- Expect 0 clients (should be filtered by RLS using current_company_id)
SELECT CASE 
    WHEN COUNT(*) = 0 THEN '✅ Isolation Success' 
    ELSE '❌ Isolation Failed: Client visible in Matrix' 
END FROM public.clients;

-- 6. Cleanup (Optional or Rollback)
ROLLBACK;

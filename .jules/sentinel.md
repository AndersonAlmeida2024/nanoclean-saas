## 2026-02-16 - [Search Path Hijacking in SECURITY DEFINER Functions]
**Vulnerability:** PostgreSQL SECURITY DEFINER functions without an explicit `search_path` are vulnerable to hijacking. An attacker can create objects (like functions or tables) in their own schema that shadow public ones, leading to unauthorized code execution with elevated privileges.
**Learning:** In Supabase, where many RLS helper functions and RPCs use SECURITY DEFINER to bypass RLS or access auth-protected tables, this risk is prevalent if not explicitly mitigated.
**Prevention:** Always include `SET search_path = public` (or the specific schemas needed) when defining SECURITY DEFINER functions. Additionally, use explicit schema qualification (e.g., `public.tablename`) inside the function body.

## 2026-02-16 - [Secure Public Access via RPC]
**Vulnerability:** Allowing anonymous users (`anon` role) direct `SELECT` access to tables with RLS policies based on guessable or listable IDs can lead to Mass Listing Leaks or IDOR.
**Learning:** Standard RLS is often too permissive or complex for public sharing. A cleaner and more secure approach is to use a SECURITY DEFINER RPC that validates a specific token and returns only a sanitized subset of data.
**Prevention:** Revoke direct `SELECT` for `anon` on sensitive tables and implement dedicated RPC functions for public data retrieval.

## 2026-02-10 - [HIGH] Fix IDOR in public reports and harden PostgreSQL search path
**Vulnerability:** Public reports were accessible via direct `SELECT` on the `service_inspections` table using only the record UUID. This allowed potential IDOR and Mass Listing leaks. Additionally, several `SECURITY DEFINER` functions lacked `SET search_path = public`, exposing them to search-path hijacking.
**Learning:** Even with RLS enabled, granting `SELECT` to `anon` on tables with guest-accessible data is risky. A more secure pattern is to use `SECURITY DEFINER` RPC functions that validate a specific `public_token`.
**Prevention:** Use the RPC-only pattern for public access. Always set `search_path = public` on `SECURITY DEFINER` functions in Supabase migrations.

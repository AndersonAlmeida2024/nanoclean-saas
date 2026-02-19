## 2026-02-16 - Hardening SECURITY DEFINER & Public Access
**Vulnerability:** Widespread use of `SECURITY DEFINER` functions without explicit `SET search_path = public`, and insecure public data exposure via direct table SELECT.
**Learning:** Functions running with elevated privileges (SECURITY DEFINER) are vulnerable to search-path hijacking if the search path is not pinned. Additionally, direct table access for anonymous users via RLS is harder to audit and can lead to accidental data leaks (Mass Listing).
**Prevention:** 1. Always apply `SET search_path = public` to `SECURITY DEFINER` functions. 2. Use RPCs for public data sharing to control the exact shape of exposed data and keep table RLS strict.

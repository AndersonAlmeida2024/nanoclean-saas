## 2026-02-10 - Secure Public Data Sharing Pattern
**Vulnerability:** IDOR (Insecure Direct Object Reference) in public report pages. Data was accessible by simply knowing the UUID of the inspection, without any token validation.
**Learning:** Even with RLS enabled for authenticated users, public pages (role `anon`) need a secure mechanism. Direct table access for `anon` is dangerous as it can lead to "Mass Listing" leaks.
**Prevention:** Use a combination of a UUID `public_token` on the parent record (e.g., `appointments`) and a `SECURITY DEFINER` RPC function (e.g., `get_public_inspection`) that validates the token. This creates a "Privacy-First" access layer that bypasses RLS safely and strictly controls which fields are exposed.

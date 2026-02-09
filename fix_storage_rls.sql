-- NanoClean Storage RLS Fix
-- Purpose: Fix permission denied on 'inspections' bucket uploads.
-- Run this in Supabase SQL Editor.

-- 1. Drop old policies if they exist (to avoid duplication or conflicts)
DROP POLICY IF EXISTS "Company Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Company Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;

-- 2. Re-create with robust company_id check from user_metadata
CREATE POLICY "Company Upload Access" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'inspections' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    );

-- 3. Public access for viewing (WhatsApp reports)
CREATE POLICY "Public View Access" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'inspections');

-- 4. Delete access for technicians
CREATE POLICY "Company Delete Access" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'inspections' AND
        (storage.foldername(name))[1] = (auth.jwt() -> 'user_metadata' ->> 'company_id')
    );

-- IMPORTANT: Ensure the 'inspections' bucket is set to PUBLIC in Supabase UI.

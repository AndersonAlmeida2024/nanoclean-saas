-- NanoClean Storage Configuration
-- Purpose: Setup the 'inspections' bucket for service photos.

-- 1. Create the bucket (This can also be done manually in Supabase UI)
-- Note: Some Supabase versions don't allow creating buckets via SQL for security.
-- If this fails, create a bucket named 'inspections' manually and set it to PUBLIC.

-- 2. Set Public Access Policies for the 'inspections' bucket
-- Policy: Allow authenticated users to upload photos to their company folder
CREATE POLICY "Company Upload Access" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'inspections' AND
        (storage.foldername(name))[1] = (auth.jwt() ->> 'company_id')
    );

-- Policy: Allow public to view photos (for WhatsApp reports)
CREATE POLICY "Public View Access" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'inspections');

-- Policy: Allow company members to delete their own photos
CREATE POLICY "Company Delete Access" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'inspections' AND
        (storage.foldername(name))[1] = (auth.jwt() ->> 'company_id')
    );

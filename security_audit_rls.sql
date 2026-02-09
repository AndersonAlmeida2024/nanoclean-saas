-- NanoClean RLS Security Audit & Hardening Script
-- Purpose: Ensure strict data isolation between companies.

-- 1. Enable RLS on all relevant tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to ensure a clean state
DROP POLICY IF EXISTS "Companies can only see their own appointments" ON appointments;
DROP POLICY IF EXISTS "Companies can only manage their own appointments" ON appointments;
DROP POLICY IF EXISTS "Companies can only see their own transactions" ON transactions;
DROP POLICY IF EXISTS "Companies can manage their own transactions" ON transactions;
DROP POLICY IF EXISTS "Companies can only see their own inspections" ON service_inspections;
DROP POLICY IF EXISTS "Companies can manage their own inspections" ON service_inspections;

-- 3. Create Robust Policies for Appointments
CREATE POLICY "Strict isolation for appointments" ON appointments
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- 4. Create Robust Policies for Transactions
CREATE POLICY "Strict isolation for transactions" ON transactions
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- 5. Create Robust Policies for Service Inspections
CREATE POLICY "Strict isolation for service_inspections" ON service_inspections
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- 6. Create Robust Policies for Clients
CREATE POLICY "Strict isolation for clients" ON clients
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- 7. Secure User Profiles (Users can only see profiles within their company)
CREATE POLICY "Strict isolation for user_profiles" ON user_profiles
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING (company_id = (auth.jwt() ->> 'company_id')::uuid)
    WITH CHECK (company_id = (auth.jwt() ->> 'company_id')::uuid);

-- IMPORTANT: This assumes 'company_id' is stored in the user's JWT metadata (App Metadata).
-- If company_id is NOT in the JWT, we would fallback to a join with user_profiles, but JWT is more performant and secure.

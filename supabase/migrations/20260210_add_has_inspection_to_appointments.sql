-- Migration: Add has_inspection to appointments and sync logic
-- Description: Improves Agenda performance by avoiding N+1 queries.

-- 1. Add column
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS has_inspection BOOLEAN DEFAULT FALSE;

-- 2. Backfill existing data
UPDATE public.appointments a
SET has_inspection = EXISTS (
    SELECT 1 FROM public.service_inspections si 
    WHERE si.appointment_id = a.id
);

-- 3. Create or Update Trigger function
CREATE OR REPLACE FUNCTION public.handle_inspection_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.appointments SET has_inspection = TRUE WHERE id = NEW.appointment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        -- Check if there are other inspections for the same appointment (rare but safe)
        UPDATE public.appointments 
        SET has_inspection = EXISTS (
            SELECT 1 FROM public.service_inspections WHERE appointment_id = OLD.appointment_id
        )
        WHERE id = OLD.appointment_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger
DROP TRIGGER IF EXISTS tr_sync_inspection_flag ON public.service_inspections;
CREATE TRIGGER tr_sync_inspection_flag
AFTER INSERT OR DELETE ON public.service_inspections
FOR EACH ROW EXECUTE FUNCTION public.handle_inspection_sync();

-- 5. Add index for the new flag
CREATE INDEX IF NOT EXISTS idx_appointments_has_inspection ON public.appointments(has_inspection);

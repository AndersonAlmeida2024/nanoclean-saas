-- Migration: Add stage column to clients table for Kanban CRM
-- Date: 2026-02-12

-- Add stage column with default 'lead'
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'lead' CHECK (stage IN ('lead', 'contacted', 'quoted', 'scheduled', 'completed', 'lost'));

-- Create index for better performance on stage filtering
CREATE INDEX IF NOT EXISTS idx_clients_stage ON public.clients(stage);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.stage IS 'Current stage in the sales funnel: lead, contacted, quoted, scheduled, completed, lost';

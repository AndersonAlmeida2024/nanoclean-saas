-- DEPENDS_ON: 20260201_999_golden_master.sql
-- SAFE_TO_REAPPLY: YES
-- BREAKING_CHANGE: NO
-- VERSION: v3_public_sharing
-- ============================================================================
-- BLOCK 5: SMART REMINDERS & PUBLIC SHARING
-- ============================================================================

-- 1. Adicionar public_token para agendamentos (UUID aleatório único)
ALTER TABLE public.appointments 
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- 2. Habilitar RLS Anon para compartilhamento público
-- Nota: O Supabase exige que a política SELECT seja explícita para o role 'anon'
DROP POLICY IF EXISTS "appointments_public_share_policy" ON public.appointments;

CREATE POLICY "appointments_public_share_policy" ON public.appointments
  FOR SELECT 
  TO anon
  USING (public_token IS NOT NULL);

-- Adicionar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_appointments_public_token ON public.appointments(public_token);

-- 3. Registrar Decisão no Log (Ação Manual recomendada após execução)
-- UPDATE DECISION_LOG.md: Adicionada Decisão 5 sobre Tokens Públicos.

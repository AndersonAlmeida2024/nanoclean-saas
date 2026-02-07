-- ============================================================================
-- ENABLE REALTIME FOR AGENDA (IDEMPOTENT)
-- ============================================================================

DO $$ 
BEGIN
  -- 1. Habilitar Replicação para a tabela de agendamentos
  -- Verifica se a tabela já faz parte da publicação 'supabase_realtime'
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'appointments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  END IF;

  -- 2. Garantir que o Realtime respeite o RLS e suporte UPDATE/DELETE com PK completa
  ALTER TABLE public.appointments REPLICA IDENTITY FULL;
END $$;

-- ============================================================================
-- SCRIPT CONSOLIDADO - Executar no Supabase Dashboard
-- Projeto: NANOCLEN
-- Data: 2026-02-01
-- ============================================================================
-- IMPORTANTE: Execute este script COMPLETO de uma vez no SQL Editor
-- ============================================================================

-- ============================================================================
-- PASSO 1: Criar tabela public.users (se não existir)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,
  
  company_id UUID NULL,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- ============================================================================
-- PASSO 2: Criar função de sincronização
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASSO 3: Criar trigger (drop primeiro se existir)
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PASSO 4: Função helper para RLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================================
-- PASSO 5: Habilitar RLS nas tabelas existentes
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Se você tem essas tabelas, descomente:
-- ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.companys ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 6: Policies para public.users
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;

CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================================
-- PASSO 7: Sincronizar usuários existentes (auth → public)
-- ============================================================================

INSERT INTO public.users (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Execute para verificar se funcionou:
-- SELECT * FROM public.users;

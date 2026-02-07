-- ============================================================================
-- MASTER FIX (V2): Multi-Tenant, Defaults e Segurança
-- ============================================================================

-- 1. Unificar nome da tabela para 'companies' (Check Robusto)
DO $$ 
BEGIN
  -- Se 'companys' existir e 'companies' NÃO existir, renomeia.
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companys' AND table_schema = 'public') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    ALTER TABLE public.companys RENAME TO companies;
  
  -- Se ambas existirem por erro de migrações anteriores, tenta mesclar ou apenas avisa (aqui optamos por manter a 'companies')
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companys' AND table_schema = 'public') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    RAISE NOTICE 'Ambas tabelas companys e companies existem. Usando companies.';
  END IF;
END $$;

-- 2. Garantir que a tabela 'companies' tem a estrutura correta (Slug é importante)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'companies' AND table_schema = 'public') THEN
    ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug TEXT;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'companies' AND indexname = 'companies_slug_key') THEN
      ALTER TABLE public.companies ADD CONSTRAINT companies_slug_key UNIQUE (slug);
    END IF;
  END IF;
END $$;

-- 3. Garantir que a empresa Demo existe
INSERT INTO public.companies (id, name, slug)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'NanoClean Demo',
  'nanoclean-demo'
)
ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug,
  name = EXCLUDED.name;

-- 4. Associar usuários existentes à empresa Demo
UPDATE public.users 
SET company_id = 'a0000000-0000-0000-0000-000000000001' 
WHERE company_id IS NULL;

-- 5. Configurar Defaults Automáticos para company_id
-- Isso permite que o RLS funcione no INSERT sem que o frontend envie o ID
ALTER TABLE public.clients 
  ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();

ALTER TABLE public.appointments 
  ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();

ALTER TABLE public.transactions 
  ALTER COLUMN company_id SET DEFAULT public.get_current_user_company_id();

-- 6. Atualizar Trigger de Novos Usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_company_id UUID;
BEGIN
  SELECT id INTO target_company_id FROM public.companies WHERE slug = 'nanoclean-demo' LIMIT 1;
  
  IF target_company_id IS NULL THEN
    target_company_id := 'a0000000-0000-0000-0000-000000000001';
  END IF;

  INSERT INTO public.users (id, company_id, role)
  VALUES (NEW.id, target_company_id, 'owner')
  ON CONFLICT (id) DO UPDATE SET company_id = EXCLUDED.company_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Resetar RLS para garantir consistência
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
CREATE POLICY "companies_select" ON public.companies FOR SELECT USING (id = public.get_current_user_company_id());
CREATE POLICY "companies_update" ON public.companies FOR UPDATE USING (id = public.get_current_user_company_id());

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

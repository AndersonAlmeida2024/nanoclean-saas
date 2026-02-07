-- ============================================================================
-- FIX: Associar usuários a empresa (SIMPLIFICADO)
-- ============================================================================

-- 1. Criar empresa padrão (apenas colunas que existem)
INSERT INTO public.companies (id, name)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'NanoClean Demo'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Associar usuários sem empresa
UPDATE public.users
SET company_id = 'a0000000-0000-0000-0000-000000000001'
WHERE company_id IS NULL;

-- 3. Verificar
SELECT 
  (SELECT COUNT(*) FROM public.users WHERE company_id IS NOT NULL) as users_com_empresa,
  (SELECT COUNT(*) FROM public.companies) as total_empresas;

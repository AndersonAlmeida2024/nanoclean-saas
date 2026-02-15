-- =====================================================
-- AUTO-CRIAÇÃO DE EMPRESA NO SIGNUP
-- Cria automaticamente uma empresa para cada novo usuário
-- =====================================================

-- Função que cria empresa + membership automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_company_slug TEXT;
  v_user_name TEXT;
BEGIN
  -- Extrai nome da empresa do user_metadata
  v_company_name := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Minha Empresa'
  );
  
  -- Extrai nome do usuário
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Gera slug único baseado no nome da empresa + timestamp
  v_company_slug := LOWER(REGEXP_REPLACE(
    v_company_name || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    '[^a-z0-9-]',
    '-',
    'g'
  ));
  
  -- Remove hífens duplicados
  v_company_slug := REGEXP_REPLACE(v_company_slug, '-+', '-', 'g');
  
  -- Cria a empresa
  INSERT INTO public.companies (name, slug, status)
  VALUES (v_company_name, v_company_slug, 'active')
  RETURNING id INTO v_company_id;
  
  -- Cria o membership (owner)
  INSERT INTO public.company_memberships (user_id, company_id, role, is_active)
  VALUES (NEW.id, v_company_id, 'owner', true);
  
  -- Cria o registro na tabela users com a empresa ativa
  INSERT INTO public.users (id, email, active_company_id)
  VALUES (NEW.id, NEW.email, v_company_id)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      active_company_id = EXCLUDED.active_company_id,
      updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Cria trigger que dispara após inserção em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PERMISSÕES
-- =====================================================

-- Permite authenticated inserir em companies
GRANT INSERT ON public.companies TO authenticated;

-- Recarrega schema
NOTIFY pgrst, 'reload schema';

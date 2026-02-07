-- ============================================================================
-- Migration: Fix Matrix Type and Signup Trigger
-- Description: Corrige o tipo das empresas principais e garante Matriz no signup.
-- Author: Antigravity (Supervisor)
-- ============================================================================

DO $$ 
BEGIN

-- 1. CORREÇÃO RETROATIVA: Empresas sem pai devem ser 'matrix'
-- Muitas empresas foram criadas com o default 'branch' por engano
UPDATE public.companies 
SET company_type = 'matrix' 
WHERE parent_company_id IS NULL AND company_type != 'matrix';

-- 2. ATUALIZAÇÃO DO TRIGGER DE SIGNUP (handle_new_user)
-- Garante que empresas criadas no registro inicial sejam 'matrix'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_company_id UUID;
BEGIN
  -- Se houver convite, o comportamento permanece o mesmo (staff sem empresa inicial)
  IF (NEW.raw_user_meta_data->>'invite_token') IS NOT NULL THEN
     INSERT INTO public.users (id, role, full_name)
     VALUES (
       NEW.id, 
       'staff', 
       COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário')
     );
  ELSE
     -- Sign up normal -> CRIA MATRIZ EXPLICITAMENTE
     INSERT INTO public.companies (name, slug, company_type)
     VALUES (
       'Minha Empresa', 
       'empresa-' || substr(NEW.id::text, 1, 8),
       'matrix' -- <--- FIX: Força nível Matriz no signup
     )
     RETURNING id INTO target_company_id;

     INSERT INTO public.users (id, company_id, active_company_id, role, full_name)
     VALUES (
       NEW.id, 
       target_company_id,
       target_company_id, -- Define como ativa inicial
       'owner', 
       COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário')
     );

     -- Cria a membership inicial obrigatória
     INSERT INTO public.company_memberships (user_id, company_id, role, status)
     VALUES (NEW.id, target_company_id, 'owner', 'active');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

END $$;

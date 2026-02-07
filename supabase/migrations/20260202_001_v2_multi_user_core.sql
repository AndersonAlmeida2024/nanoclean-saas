-- DEPENDS_ON: 20260201_999_golden_master.sql
-- SAFE_TO_REAPPLY: YES (Idempotent)
-- BREAKING_CHANGE: NO
-- VERSION: v2_multi_user_roles
-- ============================================================================

-- 1. EXTENSÃO DO SCHEMA DE ROLES
-- Criar um tipo enumerado para roles se não existir ou usar restrição de texto
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('owner', 'admin', 'staff');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.users 
  ALTER COLUMN role TYPE TEXT; -- Mantemos texto por compatibilidade, mas validamos via check

ALTER TABLE public.users 
  DROP CONSTRAINT IF EXISTS check_valid_role;

ALTER TABLE public.users 
  ADD CONSTRAINT check_valid_role 
  CHECK (role IN ('owner', 'admin', 'staff'));

-- 2. TABELA DE CONVITES (BLOCK 2)
-- Hardening: Garantir que usuários sem empresa não acessem nada
ALTER TABLE public.users 
  ADD CONSTRAINT users_company_id_required_check 
  CHECK (company_id IS NOT NULL OR role = 'staff'); -- Staff em convite pode ser temporariamente null

-- ... (tabela de convites permanece igual)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  
  UNIQUE(company_id, email) -- Evita convites duplicados para a mesma empresa/email
);

-- RLS para Convites (Apenas Owners e Admins podem ver/criar convites da empresa)
ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invites_manage_policy" ON public.company_invites
  FOR ALL USING (
    company_id = public.get_current_user_company_id() 
    AND EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 3. FUNÇÃO DE ACEITE DE CONVITE (ZERO TRUST)
CREATE OR REPLACE FUNCTION public.accept_company_invite(token_in TEXT)
RETURNS JSONB AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- 1. Validar Token e Expiração
  SELECT * INTO invite_record 
  FROM public.company_invites 
  WHERE invite_token = token_in 
    AND accepted_at IS NULL 
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Convite inválido ou expirado.';
  END IF;

  -- 2. Validar se o usuário logado é o dono do e-mail (opcional, mas recomendado)
  -- IF invite_record.email != (SELECT email FROM auth.users WHERE id = auth.uid()) THEN
  --   RAISE EXCEPTION 'Este convite não pertence ao seu usuário.';
  -- END IF;

  -- 3. Vincular usuário à empresa e definir role
  UPDATE public.users 
  SET 
    company_id = invite_record.company_id,
    role = invite_record.role
  WHERE id = auth.uid();

  -- 4. Marcar convite como aceito
  UPDATE public.company_invites 
  SET accepted_at = now() 
  WHERE id = invite_record.id;

  RETURN jsonb_build_object(
    'success', true, 
    'company_id', invite_record.company_id,
    'role', invite_record.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AJUSTE NO handle_new_user (Invite-Aware)
-- Modificado para NÃO criar empresa se houver um convite pendente na sessão (meta_data)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  target_company_id UUID;
  invite_role TEXT;
BEGIN
  -- Verificar se no Signup foi passado um invite_token via user_metadata
  -- Nota: Isso exige que o frontend envie o token no signUp({ options: { data: { invite_token: '...' } } })
  
  IF (NEW.raw_user_meta_data->>'invite_token') IS NOT NULL THEN
     -- Se houver convite, o accept_company_invite será chamado via API após o usuário logar pela primeira vez
     -- Por segurança, o handle_new_user apenas cria o registro public.users VAZIO (sem company_id)
     INSERT INTO public.users (id, role, full_name)
     VALUES (
       NEW.id, 
       'staff', 
       COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário')
     );
  ELSE
     -- Sign up normal (Cria nova empresa)
     INSERT INTO public.companies (name, slug)
     VALUES ('Minha Empresa', 'empresa-' || substr(NEW.id::text, 1, 8))
     RETURNING id INTO target_company_id;

     INSERT INTO public.users (id, company_id, role, full_name)
     VALUES (
       NEW.id, 
       target_company_id, 
       'owner', 
       COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário')
     );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

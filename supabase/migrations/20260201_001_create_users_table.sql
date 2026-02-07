-- ============================================================================
-- Migration: Create public.users table
-- Description: Tabela de usuários da aplicação (camada de negócio)
--              Vincula o usuário autenticado (auth.users) ao domínio do SaaS
-- Created: 2026-02-01
-- ============================================================================

-- Tabela de usuários do domínio
-- IMPORTANTE: Esta tabela é a camada de negócio, NÃO auth.users
CREATE TABLE IF NOT EXISTS public.users (
  -- ID sincronizado com auth.users
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  -- Multi-tenant: empresa do usuário (NULL = sem empresa ainda)
  company_id UUID NULL,

  -- Role do usuário dentro da empresa
  -- Valores: 'owner', 'admin', 'member', 'viewer'
  role TEXT DEFAULT 'owner',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para buscas por empresa
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver seus próprios dados
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Policy: Usuários podem atualizar seus próprios dados
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Comentários para documentação
COMMENT ON TABLE public.users IS 'Tabela de usuários do domínio SaaS - sincronizada com auth.users';
COMMENT ON COLUMN public.users.company_id IS 'ID da empresa para multi-tenant';
COMMENT ON COLUMN public.users.role IS 'Papel do usuário: owner, admin, member, viewer';

-- ============================================================================
-- Migration: Create user sync trigger
-- Description: Sincronização automática entre auth.users e public.users
--              Garante que todo signup crie um registro no domínio do SaaS
-- Created: 2026-02-01
-- ============================================================================

-- Função que cria automaticamente um usuário na tabela public.users
-- sempre que um novo usuário é criado em auth.users
--
-- SECURITY DEFINER: Executa com privilégios do owner da função
-- Isso é necessário porque o trigger roda no contexto de auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função acima
-- após a criação de um usuário no sistema de autenticação
--
-- AFTER INSERT: Roda após o INSERT em auth.users ser confirmado
-- FOR EACH ROW: Executa para cada linha inserida
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Comentário para documentação
COMMENT ON FUNCTION public.handle_new_user IS 'Sincroniza auth.users → public.users automaticamente no signup';

-- arquivo: supabase/tests/rls_test_suite.sql

-- ============================================================================
-- BLOCK 3: SUITE DE TESTES DE ISOLAMENTO RLS (NANOCLEN CORE V2)
-- Executar no SQL Editor para validar a blindagem.
-- ============================================================================

DO $$ 
DECLARE
  user_a_id UUID := '00000000-0000-0000-0000-00000000000a';
  user_b_id UUID := '00000000-0000-0000-0000-00000000000b';
  company_a_id UUID := '10000000-0000-0000-0000-00000000000a';
  company_b_id UUID := '20000000-0000-0000-0000-00000000000b';
  test_client_id UUID;
BEGIN
  -- 1. SETUP DE TESTE (Limpeza)
  DELETE FROM public.users WHERE id IN (user_a_id, user_b_id);
  DELETE FROM public.companies WHERE id IN (company_a_id, company_b_id);

  -- 2. CRIAR CENÁRIO (Empresas e Usuários)
  INSERT INTO public.companies (id, name, slug) VALUES (company_a_id, 'Empresa A', 'emp-a');
  INSERT INTO public.companies (id, name, slug) VALUES (company_b_id, 'Empresa B', 'emp-b');
  
  INSERT INTO public.users (id, company_id, role) VALUES (user_a_id, company_a_id, 'owner');
  INSERT INTO public.users (id, company_id, role) VALUES (user_b_id, company_b_id, 'owner');

  -- 3. TESTE 1: ISOLAMENTO DE SELECT
  -- Inserir dados como admin direto (bypass RLS)
  INSERT INTO public.clients (name, phone, company_id) VALUES ('Cliente A', '111', company_a_id);
  INSERT INTO public.clients (name, phone, company_id) VALUES ('Cliente B', '222', company_b_id);

  -- Simular Usuário A
  SET request.jwt.claims = format('{"sub": "%s"}', user_a_id);
  
  IF (SELECT count(*) FROM public.clients) != 1 THEN
    RAISE EXCEPTION 'TESTE FALHOU: Usuário A viu dados de outras empresas! Contagem: %', (SELECT count(*) FROM public.clients);
  END IF;
  
  IF (SELECT name FROM public.clients LIMIT 1) != 'Cliente A' THEN
    RAISE EXCEPTION 'TESTE FALHOU: Usuário A viu o cliente errado!';
  END IF;

  -- 4. TESTE 2: ISOLAMENTO DE INSERT ATRAVÉS DO DEFAULT
  -- Usuário A tenta inserir sem passar company_id
  INSERT INTO public.clients (name, phone) VALUES ('Novo Cliente A', '333') RETURNING id INTO test_client_id;
  
  IF (SELECT company_id FROM public.clients WHERE id = test_client_id) != company_a_id THEN
    RAISE EXCEPTION 'TESTE FALHOU: O default do company_id não foi preenchido corretamente!';
  END IF;

  -- 5. TESTE 3: BLOQUEIO DE ATAQUE LATERAL (ATRIBUTO CRUZADO)
  -- Usuário A tenta deletar cliente da Empresa B explicitando o ID
  -- Primeiro, pegar o ID do Cliente B
  RESET request.jwt.claims;
  SELECT id INTO test_client_id FROM public.clients WHERE name = 'Cliente B';
  SET request.jwt.claims = format('{"sub": "%s"}', user_a_id);

  DELETE FROM public.clients WHERE id = test_client_id;
  
  -- Verificar se Cliente B ainda existe
  RESET request.jwt.claims;
  IF NOT EXISTS (SELECT 1 FROM public.clients WHERE id = test_client_id) THEN
    RAISE EXCEPTION 'TESTE FALHOU: Usuário A conseguiu deletar dados da Empresa B!';
  END IF;

  -- 6. TESTE 4: BLOQUEIO DE UPDATE LATERAL
  -- Usuário A tenta alterar nome de cliente da Empresa B
  RESET request.jwt.claims;
  SELECT id INTO test_client_id FROM public.clients WHERE name = 'Cliente B';
  SET request.jwt.claims = format('{"sub": "%s"}', user_a_id);

  UPDATE public.clients SET name = 'Hackeado' WHERE id = test_client_id;
  
  -- Verificar se nome NÃO mudou
  RESET request.jwt.claims;
  IF (SELECT name FROM public.clients WHERE id = test_client_id) = 'Hackeado' THEN
    RAISE EXCEPTION 'TESTE FALHOU: Usuário A conseguiu alterar dados da Empresa B!';
  END IF;

  -- 7. TESTE 5: BLINDAGEM ANÔNIMA (ANTI-MASS LISTING)
  -- Tentar SELECT direto como anon deve retornar 0 ou erro pós-hardening
  SET role anon;
  IF (SELECT count(*) FROM public.appointments) > 0 THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA: Usuário anônimo conseguiu listar agendamentos!';
  END IF;

  -- Tentar via RPC com token INVÁLIDO deve retornar null
  IF (SELECT public.get_public_appointment('00000000-0000-0000-0000-000000000000'::uuid)) IS NOT NULL THEN
    RAISE EXCEPTION 'FALHA DE SEGURANÇA: RPC retornou dados para token inexistente!';
  END IF;

  -- 8. LIMPEZA FINAL
  DELETE FROM public.users WHERE id IN (user_a_id, user_b_id);
  DELETE FROM public.companies WHERE id IN (company_a_id, company_b_id);

  RAISE NOTICE '✅ TODOS OS TESTES DE RLS PASSARAM COM SUCESSO!';
END $$;

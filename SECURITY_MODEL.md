# 🛡️ Modelo de Segurança: Isolamento de Dados (RLS)

Este documento detalha como o NanoClean garante que uma empresa nunca veja os dados de outra.

## 🏗️ Camadas de Defesa

### 1. Nível de Banco (PostgreSQL RLS)
O PostgreSQL Row Level Security é o coração do sistema. Mesmo que o código da API (Node/Go/Python) seja comprometido, o banco de dados recusa entregar linhas que não pertencem à sessão do usuário.

### 2. Âncora de Identidade (`company_id`)
Cada registro em tabelas de negócio (`clients`, `appointments`, etc) está "ancorado" a um `company_id`.

### 3. Sessão Blindada (JWT Claims)
Quando um usuário loga, o Supabase gera um JWT.
- O RLS usa `auth.uid()` para identificar o usuário.
- O mapeamento `usuário -> empresa` é feito via `public.users`.
- A função SQL `get_current_user_company_id()` abstrai essa busca de forma segura e cacheável pelo DB.

## 🛡️ Fluxo de um Ataque Lateral (Mock)
1. **Atacante (Empresa A)** descobre o UUID `123` de um cliente da **Empresa B**.
2. O atacante tenta uma requisição direta: `DELETE FROM clients WHERE id = '123'`.
3. O PostgreSQL intercepta via política RLS.
4. O RLS verifica: `id_empresa_do_carrinho (123)` é igual a `id_empresa_do_atacante (A)`?
5. **Resultado**: FALSE. A linha é filtrada. O atacante recebe "0 rows affected" ou "Permission Denied".

### 4. Acesso Público Blindado (RPC Pattern)
Para evitar o risco de "Mass Listing" (onde um usuário anônimo tenta baixar todas as linhas de uma tabela usando filtros genéricos), o NanoClean utiliza o padrão RPC para acessos públicos:
- O acesso direto via `SELECT` para a role `anon` é **bloqueado**.
- O acesso é feito exclusivamente via a função `get_public_appointment(token)`.
- A função valida o token e retorna um objeto JSON contendo apenas os campos seguros para exposição pública (Privacy-First).

## 🧪 Verificação de Segurança
Sempre que houver alteração no banco, execute a suíte de testes:
`supabase/tests/rls_test_suite.sql`

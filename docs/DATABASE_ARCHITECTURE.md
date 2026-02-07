# Arquitetura de Banco de Dados - Multi-Tenant SaaS

> Documentação da arquitetura de banco de dados para SaaS multi-tenant com Supabase.

---

## 📋 Visão Geral

Este projeto utiliza uma arquitetura de duas camadas para gerenciar usuários:

| Camada | Tabela | Responsabilidade |
|--------|--------|------------------|
| **Autenticação** | `auth.users` | Login, signup, JWT, sessões (gerenciada pelo Supabase) |
| **Domínio/Negócio** | `public.users` | Perfil, empresa, role, dados específicos do SaaS |

### Por que essa separação?

1. **Separação de concerns** - Autenticação ≠ Lógica de Negócio
2. **Multi-tenant ready** - `company_id` pronto para RLS desde o início
3. **Escalável** - Adicionar campos de perfil sem tocar em auth
4. **RLS seguro** - Policies isolam dados por empresa via `auth.uid()`
5. **Flexibilidade** - Campos customizados, roles, permissões granulares

---

## 🗄️ Schema Principal

### Tabela `public.users`

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  company_id UUID NULL,           -- Preparado para multi-tenant
  role TEXT DEFAULT 'owner',      -- owner, admin, member, viewer

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | FK para `auth.users.id`, sincronizado automaticamente |
| `company_id` | UUID | ID da empresa (para multi-tenant) |
| `role` | TEXT | Papel do usuário: `owner`, `admin`, `member`, `viewer` |
| `created_at` | TIMESTAMPTZ | Data de criação |

---

## 🔄 Sincronização Automática

### Trigger de Criação de Usuário

Quando um novo usuário faz signup via Supabase Auth, um registro correspondente é criado automaticamente em `public.users`:

```sql
-- Função que cria automaticamente um usuário na tabela public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que executa a função após signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

### Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                     FLUXO DE SIGNUP                         │
├─────────────────────────────────────────────────────────────┤
│  1. Usuário faz signup                                      │
│           ↓                                                 │
│  2. Supabase Auth cria registro em auth.users               │
│           ↓                                                 │
│  3. Trigger `on_auth_user_created` é disparado              │
│           ↓                                                 │
│  4. Função `handle_new_user()` executa                      │
│           ↓                                                 │
│  5. Registro criado em public.users (com mesmo UUID)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Row Level Security (RLS)

### Padrão para Isolamento Multi-Tenant

Todas as tabelas de negócio devem usar este padrão para garantir que usuários só acessem dados da própria empresa:

```sql
-- Habilitar RLS
ALTER TABLE public.nome_da_tabela ENABLE ROW LEVEL SECURITY;

-- Policy de SELECT
CREATE POLICY "Users can view own company data"
ON public.nome_da_tabela
FOR SELECT
USING (
  company_id = (
    SELECT company_id
    FROM public.users
    WHERE id = auth.uid()
  )
);

-- Policy de INSERT
CREATE POLICY "Users can insert own company data"
ON public.nome_da_tabela
FOR INSERT
WITH CHECK (
  company_id = (
    SELECT company_id
    FROM public.users
    WHERE id = auth.uid()
  )
);

-- Policy de UPDATE
CREATE POLICY "Users can update own company data"
ON public.nome_da_tabela
FOR UPDATE
USING (
  company_id = (
    SELECT company_id
    FROM public.users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  company_id = (
    SELECT company_id
    FROM public.users
    WHERE id = auth.uid()
  )
);

-- Policy de DELETE
CREATE POLICY "Users can delete own company data"
ON public.nome_da_tabela
FOR DELETE
USING (
  company_id = (
    SELECT company_id
    FROM public.users
    WHERE id = auth.uid()
  )
);
```

---

## 🏢 Expansão para Multi-Tenant Completo

Quando necessário, adicionar a tabela de empresas:

```sql
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free',           -- free, pro, enterprise
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Adicionar FK em public.users
ALTER TABLE public.users
ADD CONSTRAINT fk_users_company
FOREIGN KEY (company_id)
REFERENCES public.companies(id)
ON DELETE SET NULL;
```

---

## 📝 Checklist de Implementação

- [ ] Criar tabela `public.users`
- [ ] Criar função `handle_new_user()`
- [ ] Criar trigger `on_auth_user_created`
- [ ] Habilitar RLS em todas as tabelas de negócio
- [ ] Criar policies baseadas em `company_id`
- [ ] (Futuro) Criar tabela `public.companies`
- [ ] (Futuro) Migrar usuários para companies

---

## 🔗 Referências

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-tenant SaaS with Supabase](https://supabase.com/docs/guides/getting-started/architecture)

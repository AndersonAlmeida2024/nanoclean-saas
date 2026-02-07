-- =====================================================
-- SETUP COMPLETO DO SAAS (IDEMPOTENTE)
-- Pode rodar quantas vezes quiser sem quebrar nada
-- Gerado em: 2026-02-07
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- TABELAS
-- =====================================================

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  plan text default 'starter',
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  parent_company_id uuid null
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  active_company_id uuid references public.companies(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null default 'owner',
  is_active boolean not null default true,
  created_at timestamptz default now(),
  unique (user_id, company_id)
);

-- =====================================================
-- RLS (SEGURANÇA)
-- =====================================================

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.company_memberships enable row level security;

-- memberships → usuário vê só as próprias
drop policy if exists "membership_select_own" on public.company_memberships;
create policy "membership_select_own"
on public.company_memberships
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "membership_insert_own" on public.company_memberships;
create policy "membership_insert_own"
on public.company_memberships
for insert
to authenticated
with check (user_id = auth.uid());

-- companies → usuário vê empresas onde é membro
drop policy if exists "companies_select_by_membership" on public.companies;
create policy "companies_select_by_membership"
on public.companies
for select
to authenticated
using (
  exists (
    select 1 from public.company_memberships m
    where m.company_id = companies.id
    and m.user_id = auth.uid()
    and m.is_active = true
  )
);

-- users → usuário vê só o próprio perfil
drop policy if exists "users_select_self" on public.users;
create policy "users_select_self"
on public.users
for select
to authenticated
using (id = auth.uid());

drop policy if exists "users_upsert_self" on public.users;
create policy "users_upsert_self"
on public.users
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- =====================================================
-- GRANTS (PERMISSÕES PARA A ANON KEY FUNCIONAR)
-- =====================================================

grant usage on schema public to anon, authenticated;
grant select on public.companies to authenticated;
grant select, insert on public.company_memberships to authenticated;
grant select, insert, update on public.users to authenticated;

-- =====================================================
-- SEED AUTOMÁTICO (CRIA SUA EMPRESA + VÍNCULO)
-- =====================================================

do $$
declare
  v_user_id uuid;
  v_company_id uuid;
begin
  select id into v_user_id from auth.users where email = 'anderson.1608@hotmail.com';

  if v_user_id is null then
    raise exception 'Usuário não encontrado em auth.users. Crie login primeiro.';
  end if;

  insert into public.companies (name, slug)
  values ('Minha Empresa', 'minha-empresa')
  on conflict (slug) do update set name = excluded.name
  returning id into v_company_id;

  insert into public.company_memberships (user_id, company_id, role, is_active)
  values (v_user_id, v_company_id, 'owner', true)
  on conflict (user_id, company_id) do update
    set role = excluded.role, is_active = true;

  insert into public.users (id, email, active_company_id)
  values (v_user_id, 'anderson.1608@hotmail.com', v_company_id)
  on conflict (id) do update
    set email = excluded.email,
        active_company_id = excluded.active_company_id;
end $$;

-- =====================================================
-- RECARREGAR CACHE DO SUPABASE (MUITO IMPORTANTE)
-- =====================================================

notify pgrst, 'reload schema';

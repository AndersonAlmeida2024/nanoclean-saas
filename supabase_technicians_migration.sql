-- Migration para Tabela de Técnicos (Gestão de Equipe)
-- Habilita funcionalidades de comissão e agenda múltipla (Modo Team)

create table if not exists public.technicians (
    id uuid not null default gen_random_uuid(),
    company_id uuid not null references public.companies(id) on delete cascade,
    user_id uuid references auth.users(id) on delete set null, -- Nullable: Ajudantes sem login
    name text not null,
    phone text not null,
    email text,
    color text not null default '#06b6d4', -- Cyan-500 default
    commission_rate numeric(5,2) default 0.00, -- Ex: 30.00 para 30%
    pix_key text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    
    constraint technicians_pkey primary key (id)
);

-- Índices para performance
create index if not exists technicians_company_id_idx on public.technicians(company_id);
create index if not exists technicians_user_id_idx on public.technicians(user_id);

-- Habilitar RLS
alter table public.technicians enable row level security;

-- Policies de Segurança (Isolamento por Empresa)

-- Visualizar técnicos: Apenas usuários da mesma empresa
create policy "Users can view technicians from their company"
    on public.technicians for select
    using (
        exists (
            select 1 from public.company_memberships cm
            where cm.company_id = technicians.company_id
            and cm.user_id = auth.uid()
        )
    );

-- Inserir técnicos: Admins/Owners da empresa
create policy "Admins can insert technicians"
    on public.technicians for insert
    with check (
        exists (
            select 1 from public.company_memberships cm
            where cm.company_id = technicians.company_id
            and cm.user_id = auth.uid()
            and cm.role in ('owner', 'admin')
        )
    );

-- Atualizar técnicos: Admins/Owners da empresa
create policy "Admins can update technicians"
    on public.technicians for update
    using (
        exists (
            select 1 from public.company_memberships cm
            where cm.company_id = technicians.company_id
            and cm.user_id = auth.uid()
            and cm.role in ('owner', 'admin')
        )
    );

-- Deletar técnicos: Admins/Owners da empresa
create policy "Admins can delete technicians"
    on public.technicians for delete
    using (
        exists (
            select 1 from public.company_memberships cm
            where cm.company_id = technicians.company_id
            and cm.user_id = auth.uid()
            and cm.role in ('owner', 'admin')
        )
    );

-- Trigger para atualizar updated_at
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_technicians_updated_at
    before update on public.technicians
    for each row
    execute function update_updated_at_column();

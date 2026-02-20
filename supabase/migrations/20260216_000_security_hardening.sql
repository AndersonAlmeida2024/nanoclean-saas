-- Migration: security_hardening_definers
-- Data: 2026-02-16
-- Objetivo: Endurecimento de segurança para funções SECURITY DEFINER (Search Path Hijacking Prevention)
-- e implementação de acesso seguro a laudos técnicos.

BEGIN;

-- ============================================================================
-- 1. ENDURECIMENTO DE FUNÇÕES EXISTENTES (SET search_path = public)
-- ============================================================================

-- 1.1 Core Multi-tenant & Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_company_id UUID;
  v_company_name TEXT;
  v_company_slug TEXT;
BEGIN
  v_company_name := COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa');
  v_company_slug := LOWER(REGEXP_REPLACE(v_company_name || '-' || EXTRACT(EPOCH FROM NOW())::TEXT, '[^a-z0-9-]', '-', 'g'));
  v_company_slug := REGEXP_REPLACE(v_company_slug, '-+', '-', 'g');

  INSERT INTO public.companies (name, slug, status)
  VALUES (v_company_name, v_company_slug, 'active')
  RETURNING id INTO v_company_id;

  INSERT INTO public.company_memberships (user_id, company_id, role, is_active)
  VALUES (NEW.id, v_company_id, 'owner', true);

  INSERT INTO public.users (id, email, active_company_id)
  VALUES (NEW.id, NEW.email, v_company_id)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email, active_company_id = EXCLUDED.active_company_id, updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_active_company_id()
RETURNS UUID AS $$
    SELECT active_company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1.2 Platform Admin
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
    SELECT is_platform_admin FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 1.3 Public Sharing (Appointment)
CREATE OR REPLACE FUNCTION public.get_public_appointment(p_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'date', a.date,
    'scheduled_time', a.scheduled_time,
    'service_type', a.service_type,
    'address', COALESCE(a.address, c.address),
    'client_name', c.name,
    'company_name', comp.name
  ) INTO v_result
  FROM public.appointments a
  JOIN public.clients c ON a.client_id = c.id
  JOIN public.companies comp ON a.company_id = comp.id
  WHERE a.public_token = p_token;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.4 Admin RPCs
CREATE OR REPLACE FUNCTION public.admin_list_companies()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    company_type TEXT,
    status TEXT,
    plan_id TEXT,
    created_at TIMESTAMPTZ,
    member_count BIGINT
) AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.slug,
        c.company_type,
        c.status,
        c.plan_id,
        c.created_at,
        (SELECT count(*) FROM public.company_memberships m WHERE m.company_id = c.id) as member_count
    FROM public.companies c
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_set_company_status(p_company_id UUID, p_status TEXT)
RETURNS VOID AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    UPDATE public.companies
    SET status = p_status, updated_at = now()
    WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.admin_provision_company(p_name TEXT, p_slug TEXT, p_owner_email TEXT)
RETURNS UUID AS $$
DECLARE
    v_new_company_id UUID;
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Acesso negado: Requer privilégios de plataforma.';
    END IF;

    -- 1. Criar a empresa
    INSERT INTO public.companies (name, slug, company_type)
    VALUES (p_name, p_slug, 'matrix')
    RETURNING id INTO v_new_company_id;

    -- 2. Criar o convite para o dono
    INSERT INTO public.invites (email, company_id, invited_by, role)
    VALUES (p_owner_email, v_new_company_id, auth.uid(), 'owner');

    RETURN v_new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.5 CRM & Context Switching
CREATE OR REPLACE FUNCTION public.switch_company(p_company_id UUID)
RETURNS VOID AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE user_id = auth.uid() AND company_id = p_company_id AND status = 'active'
    ) THEN
        UPDATE public.users SET active_company_id = p_company_id WHERE id = auth.uid();
    ELSE
        RAISE EXCEPTION 'Você não tem permissão para acessar esta empresa ou o vínculo está inativo.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.create_branch(p_name TEXT, p_slug TEXT)
RETURNS UUID AS $$
DECLARE
    v_matrix_id UUID;
    v_new_branch_id UUID;
BEGIN
    SELECT active_company_id INTO v_matrix_id FROM public.users WHERE id = auth.uid();
    IF NOT EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE user_id = auth.uid() AND company_id = v_matrix_id AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Apenas proprietários ou administradores podem criar filiais.';
    END IF;

    INSERT INTO public.companies (name, slug, parent_company_id, company_type)
    VALUES (p_name, p_slug, v_matrix_id, 'branch')
    RETURNING id INTO v_new_branch_id;

    INSERT INTO public.company_memberships (user_id, company_id, role, status)
    VALUES (auth.uid(), v_new_branch_id, 'owner', 'active');

    RETURN v_new_branch_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.invite_member(p_email TEXT, p_company_id UUID, p_role TEXT)
RETURNS UUID AS $$
DECLARE
    v_invite_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.company_memberships
        WHERE user_id = auth.uid() AND company_id = p_company_id AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Permissão insuficiente para convidar membros para esta empresa.';
    END IF;

    INSERT INTO public.invites (email, company_id, invited_by, role)
    VALUES (p_email, p_company_id, auth.uid(), p_role)
    RETURNING id INTO v_invite_id;

    RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.accept_invite(p_token UUID)
RETURNS VOID AS $$
DECLARE
    v_invite RECORD;
BEGIN
    SELECT * INTO v_invite FROM public.invites WHERE token = p_token AND status = 'pending';
    IF v_invite IS NULL THEN
        RAISE EXCEPTION 'Convite inválido, expirado ou já aceito.';
    END IF;

    INSERT INTO public.company_memberships (user_id, company_id, role, status)
    VALUES (auth.uid(), v_invite.company_id, v_invite.role, 'active')
    ON CONFLICT (user_id, company_id) DO UPDATE SET status = 'active', role = EXCLUDED.role;

    UPDATE public.invites SET status = 'accepted' WHERE id = v_invite.id;
    UPDATE public.users SET active_company_id = v_invite.company_id WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_inactive_clients(days_threshold int)
RETURNS TABLE (
    id uuid,
    name text,
    phone text,
    last_service_date date,
    last_service_value numeric,
    days_inactive int
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.name,
        c.phone,
        MAX(a.scheduled_date::date) as last_date,
        (
            SELECT price
            FROM public.appointments
            WHERE client_id = c.id AND status = 'completed'
            ORDER BY scheduled_date DESC, scheduled_time DESC
            LIMIT 1
        ) as last_price,
        (CURRENT_DATE - MAX(a.scheduled_date::date))::int as days_inactive
    FROM public.clients c
    JOIN public.company_memberships cm ON cm.company_id = c.company_id
    JOIN public.appointments a ON a.client_id = c.id
    WHERE cm.user_id = auth.uid()
      AND cm.is_active = true
      AND a.status = 'completed'
      AND NOT EXISTS (
          SELECT 1 FROM public.appointments a2
          WHERE a2.client_id = c.id
            AND a2.status IN ('scheduled', 'in_progress')
            AND a2.scheduled_date >= CURRENT_DATE
      )
    GROUP BY c.id, c.name, c.phone
    HAVING MAX(a.scheduled_date::date) <= (CURRENT_DATE - (days_threshold || ' days')::interval)::date
    ORDER BY last_date DESC;
END;
$$;

-- 1.6 Commissions
CREATE OR REPLACE FUNCTION public.calculate_commission_on_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_technician_id UUID;
    v_commission_rate NUMERIC;
    v_commission_value NUMERIC;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        SELECT technician_id INTO v_technician_id FROM public.appointments WHERE id = NEW.id;
        IF v_technician_id IS NOT NULL THEN
            SELECT commission_rate INTO v_commission_rate FROM public.technicians WHERE id = v_technician_id;
            IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 THEN
                IF v_commission_rate > 1 THEN v_commission_value := v_commission_rate;
                ELSE v_commission_value := NEW.price * v_commission_rate;
                END IF;

                INSERT INTO public.transactions (type, amount, description, category, date, company_id, user_id, technician_id, status)
                VALUES ('expense', v_commission_value, 'Comissão - ' || NEW.client_name, 'Comissão', CURRENT_DATE, NEW.company_id, NEW.user_id, v_technician_id, 'pending');
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 2. ACESSO PÚBLICO SEGURO PARA LAUDOS (INSPEÇÕES)
-- ============================================================================

-- 2.1 Criar Função RPC para Acesso ao Laudo
-- Enforced: SECURITY DEFINER + SET search_path = public
CREATE OR REPLACE FUNCTION public.get_public_inspection(p_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', si.id,
    'created_at', si.created_at,
    'items', si.items,
    'photos_before', si.photos_before,
    'photos_after', si.photos_after,
    'customer_signature', si.customer_signature,
    'appointments', jsonb_build_object(
        'service_type', a.service_type,
        'scheduled_date', a.scheduled_date,
        'scheduled_time', a.scheduled_time,
        'clients', jsonb_build_object('name', c.name)
    )
  ) INTO v_result
  FROM public.service_inspections si
  JOIN public.appointments a ON si.appointment_id = a.id
  JOIN public.clients c ON a.client_id = c.id
  WHERE si.id = p_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2.2 Blindagem da Tabela (Revogar acesso direto para ANON)
REVOKE SELECT ON public.service_inspections FROM anon;

-- 2.3 Conceder Permissão de Execução do RPC
GRANT EXECUTE ON FUNCTION public.get_public_inspection(UUID) TO anon;

COMMIT;

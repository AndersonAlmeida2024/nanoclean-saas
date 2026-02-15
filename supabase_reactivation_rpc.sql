-- Função RPC para buscar clientes inativos
-- Utiliza SECURITY DEFINER para acessar tabelas protegidas via RLS usando o contexto do usuário autenticado.

CREATE OR REPLACE FUNCTION get_inactive_clients(days_threshold int)
RETURNS TABLE (
    id uuid,
    name text,
    phone text,
    last_service_date date,
    last_service_value numeric,
    days_inactive int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.phone,
        MAX(a.scheduled_date::date) as last_date,
        (
            SELECT price 
            FROM appointments 
            WHERE client_id = c.id AND status = 'completed' 
            ORDER BY scheduled_date DESC, scheduled_time DESC 
            LIMIT 1
        ) as last_price,
        (CURRENT_DATE - MAX(a.scheduled_date::date))::int as days_inactive
    FROM clients c
    JOIN company_memberships cm ON cm.company_id = c.company_id
    JOIN appointments a ON a.client_id = c.id
    WHERE cm.user_id = auth.uid()
      AND cm.is_active = true
      AND a.status = 'completed'
      -- Excluir quem tem agendamento futuro (pendente ou confirmado)
      AND NOT EXISTS (
          SELECT 1 FROM appointments a2 
          WHERE a2.client_id = c.id 
            AND a2.status IN ('scheduled', 'in_progress') 
            AND a2.scheduled_date >= CURRENT_DATE
      )
    GROUP BY c.id, c.name, c.phone
    -- Filtro de inatividade
    HAVING MAX(a.scheduled_date::date) <= (CURRENT_DATE - (days_threshold || ' days')::interval)::date
    ORDER BY last_date DESC;
END;
$$;

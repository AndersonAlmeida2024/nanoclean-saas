-- 1. Adicionar coluna de expiração do trial
ALTER TABLE companies ADD COLUMN trial_ends_at TIMESTAMPTZ;

-- 2. Atualizar empresas existentes (opcional)
UPDATE companies SET trial_ends_at = created_at + INTERVAL '15 days' WHERE trial_ends_at IS NULL;

-- 3. Trigger para automatizar a definição do trial em novos cadastros
CREATE OR REPLACE FUNCTION set_default_trial()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trial_ends_at IS NULL THEN
        NEW.trial_ends_at := NOW() + INTERVAL '15 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_company_trial
BEFORE INSERT ON companies
FOR EACH ROW EXECUTE FUNCTION set_default_trial();

-- 4. Notificar o Supabase sobre a mudança de status se necessário (RLS ou Workers)
-- NOTA: O status 'trial_expired' pode ser controlado via componente TrialGuard no front
-- ou por um cron job no banco. Para o MVP, usaremos o TrialGuard verificando a data.

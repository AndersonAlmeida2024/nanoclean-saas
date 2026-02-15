-- Migration: commissions_v2 (Fase 4 - Financeiro PRO)
-- Data: 2026-02-14
-- Objetivo: Vincular transações a técnicos e permitir controle de pagamento de comissões

-- 1. Adicionar coluna technician_id na tabela transactions
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS technician_id UUID REFERENCES public.technicians(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled'));

-- 2. Criar índice para performance em queries de comissão
CREATE INDEX IF NOT EXISTS idx_transactions_technician_id ON public.transactions(technician_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- 3. Adicionar categoria 'Comissão' se não existir (apenas conceitual, pois categories é texto livre ou enum no front)
-- No front, garantiremos que category = 'Comissão'

-- 4. Atualizar a função calculate_commission_on_complete para popular o technician_id
CREATE OR REPLACE FUNCTION public.calculate_commission_on_complete()
RETURNS TRIGGER AS $$
DECLARE
    v_technician_id UUID;
    v_commission_rate NUMERIC;
    v_commission_value NUMERIC;
    v_user_role TEXT;
BEGIN
    -- Verifica se o status mudou para 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        
        -- Busca o técnico responsável pelo agendamento
        SELECT technician_id INTO v_technician_id
        FROM public.appointments
        WHERE id = NEW.id;

        -- Se houver técnico, busca a taxa de comissão
        IF v_technician_id IS NOT NULL THEN
            SELECT commission_rate INTO v_commission_rate
            FROM public.technicians
            WHERE id = v_technician_id;

            -- Se houver taxa de comissão configurada
            IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 THEN
                
                -- Calcula o valor da comissão (assumindo que price é o valor total)
                -- Lógica híbrida: Se rate > 1, assume valor fixo (R$). Se rate <= 1, assume porcentagem (%).
                -- Ajuste conforme regra de negócio da Fase 3.
                IF v_commission_rate > 1 THEN
                    v_commission_value := v_commission_rate; -- Valor Fixo
                ELSE
                    v_commission_value := NEW.price * v_commission_rate; -- Porcentagem
                END IF;

                -- Cria a transação de despesa (Comissão a Pagar)
                INSERT INTO public.transactions (
                    type,
                    amount,
                    description,
                    category,
                    date,
                    company_id,
                    user_id,
                    technician_id, -- Novo campo
                    status -- Novo campo
                ) VALUES (
                    'expense',
                    v_commission_value,
                    'Comissão - ' || NEW.client_name,
                    'Comissão',
                    CURRENT_DATE,
                    NEW.company_id,
                    NEW.user_id, -- ID do usuário que completou (pode não ser o técnico, mas ok)
                    v_technician_id,
                    'pending'
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

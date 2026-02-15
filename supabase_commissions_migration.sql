-- Migration: Add commission_type to technicians table
-- Author: Antigravity (Database Architect)
-- Date: 2026-02-13

DO $$ 
BEGIN 
    -- Adicionar coluna commission_type se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'commission_type') THEN
        ALTER TABLE technicians 
        ADD COLUMN commission_type text CHECK (commission_type IN ('percent', 'fixed')) DEFAULT 'percent';
    END IF;

    -- Renomear commission_rate para commission_value se necessário (opcional, mantendo rate por compatibilidade mas tratando como value no front)
    -- Decisão: Manter 'commission_rate' mas documentar que pode ser valor fixo.
    -- Ou melhor: Adicionar clone 'commission_value' e migrar dados? 
    -- SIMPLIFICAÇÃO R1: Usaremos a coluna existente `commission_rate` para armazenar o valor numérico, 
    -- e `commission_type` para definir como interpretar.
    
    -- Comentário na coluna para clareza futura
    COMMENT ON COLUMN technicians.commission_rate IS 'Valor da comissão. Se commission_type=percent, é %. Se fixed, é valor monetário.';

END $$;

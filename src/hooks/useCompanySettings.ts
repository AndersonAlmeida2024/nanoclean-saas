import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';

export interface CompanySettings {
    has_team: boolean;
    plan_tier: 'solo' | 'pro' | 'enterprise';
    notifications: {
        reactivation_count: number;
    };
    loading: boolean;
    refetch: () => Promise<void>;
}

export function useCompanySettings(): CompanySettings {
    const { activeCompanyId } = useAuthStore();
    const [settings, setSettings] = useState<Omit<CompanySettings, 'refetch'>>({
        has_team: false,
        plan_tier: 'solo',
        notifications: {
            reactivation_count: 0
        },
        loading: true
    });

    const fetchSettings = async () => {
        if (!activeCompanyId) return;

        try {
            // 1. Verificar se existem técnicos cadastrados
            const { count, error: techError } = await supabase
                .from('technicians')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', activeCompanyId)
                .eq('is_active', true);

            if (techError) {
                console.error('[useCompanySettings] Erro ao buscar técnicos:', techError);
            }

            // 2. Buscar contagem de reativação (RPC get_inactive_clients)
            // Usamos um threshold seguro (45 dias) para notificação
            const { data: inactiveData, error: rpcError } = await supabase
                .rpc('get_inactive_clients', { days_threshold: 45 });

            if (rpcError) {
                console.error('[useCompanySettings] Erro no RPC:', rpcError);
            }

            setSettings(prev => ({
                ...prev,
                has_team: (count || 0) > 0, // Progressive Disclosure: Ativa se houver técnico
                plan_tier: 'pro', // TODO: Buscar do banco real se houver
                notifications: {
                    reactivation_count: inactiveData?.length || 0
                },
                loading: false
            }));

        } catch (error) {
            console.error('[useCompanySettings] Erro geral:', error);
            setSettings(prev => ({ ...prev, loading: false }));
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [activeCompanyId]);

    return {
        ...settings,
        refetch: fetchSettings
    };
}

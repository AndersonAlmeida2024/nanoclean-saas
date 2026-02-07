import { supabase } from '../lib/supabase';

export interface Invite {
    id: string;
    email: string;
    role: 'admin' | 'member';
    status: 'pending' | 'accepted' | 'expired';
    created_at: string;
}

export const inviteService = {
    async createInvite(email: string, companyId: string, role: 'admin' | 'member' = 'member') {
        const { data, error } = await supabase.rpc('invite_member', {
            p_email: email,
            p_company_id: companyId,
            p_role: role
        });

        if (error) {
            console.error('Erro ao criar convite:', error);
            throw error;
        }
        return data;
    },

    async acceptInvite(token: string) {
        const { error } = await supabase.rpc('accept_invite', {
            p_token: token
        });

        if (error) {
            console.error('Erro ao aceitar convite:', error);
            throw error;
        }
    }
};

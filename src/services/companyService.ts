import { supabase } from '../lib/supabase';

export interface Company {
    id: string;
    name: string;
    slug: string;
    company_type: 'matrix' | 'branch';
    parent_company_id: string | null;
    status: 'active' | 'suspended' | 'trial_expired';
    subscription_status?: 'trial' | 'active' | 'expired'; // Alias para UI
    trial_ends_at: string | null;
}

export interface CompanyMembership {
    id: string;
    company_id: string;
    role: 'owner' | 'admin' | 'member';
    companies: Company;
}

export const companyService = {
    async listMyCompanies(): Promise<CompanyMembership[]> {
        try {
            const { data, error } = await supabase
                .from('company_memberships')
                .select(
                    `id, company_id, role, companies (id, name, slug, company_type, parent_company_id, status, trial_ends_at)`
                )
                .eq('status', 'active');

            if (error) {
                console.error('Erro ao listar empresas:', JSON.stringify(error, null, 2), error);
                return [] as CompanyMembership[];
            }

            return data as any as CompanyMembership[];
        } catch (err) {
            console.error('Erro inesperado ao listar empresas:', err);
            return [] as CompanyMembership[];
        }
    },

    async createBranch(name: string, slug: string) {
        const { data, error } = await supabase.rpc('create_branch', {
            p_name: name,
            p_slug: slug
        });

        if (error) {
            console.error('Erro ao criar filial:', error);
            throw error;
        }
        return data;
    },

    async switchCompany(companyId: string) {
        const { error } = await supabase.rpc('switch_company', {
            p_company_id: companyId
        });

        if (error) {
            console.error('Erro ao trocar de empresa:', error);
            throw error;
        }
    },

    async getBranches(matrixId: string): Promise<Company[]> {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('parent_company_id', matrixId);

        if (error) {
            console.error('Erro ao listar filiais:', error);
            throw error;
        }
        return data as Company[];
    }
};

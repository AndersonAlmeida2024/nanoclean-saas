import { supabase } from '../lib/supabase';

export interface AdminCompany {
    id: string;
    name: string;
    slug: string;
    company_type: 'matrix' | 'branch';
    status: 'active' | 'suspended' | 'trial_expired';
    plan_id: string;
    created_at: string;
    member_count: number;
}

export const adminService = {
    async listCompanies(): Promise<AdminCompany[]> {
        const { data, error } = await supabase.rpc('admin_list_companies');

        if (error) {
            console.error('Error listing companies:', error);
            throw error;
        }

        return data as AdminCompany[];
    },

    async setCompanyStatus(companyId: string, status: string): Promise<void> {
        const { error } = await supabase.rpc('admin_set_company_status', {
            p_company_id: companyId,
            p_status: status
        });

        if (error) {
            console.error('Error setting company status:', error);
            throw error;
        }
    },

    async provisionCompany(name: string, slug: string, ownerEmail: string): Promise<string> {
        const { data, error } = await supabase.rpc('admin_provision_company', {
            p_name: name,
            p_slug: slug,
            p_owner_email: ownerEmail
        });

        if (error) {
            console.error('Error provisioning company:', error);
            throw error;
        }

        return data as string;
    }
};

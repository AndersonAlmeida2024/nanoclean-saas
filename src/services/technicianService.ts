import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

export type Technician = Database['public']['Tables']['technicians']['Row'];

export const technicianService = {
    async getAll(companyId: string): Promise<Technician[]> {
        const { data, error } = await supabase
            .from('technicians')
            .select('*')
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data || [];
    }
};

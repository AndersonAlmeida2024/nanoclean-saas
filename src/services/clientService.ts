import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];

export const clientService = {
    async getAll(companyId: string) {
        if (!companyId) throw new Error('Company ID is required to fetch clients');

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('company_id', companyId)
            .order('name', { ascending: true });

        if (error) {
            console.error('Supabase Error (getAll):', error);
            throw new Error(`Erro ao buscar clientes: ${error.message}`);
        }
        return data;
    },

    async create(client: ClientInsert) {
        const { data, error } = await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();

        if (error) {
            console.error('Supabase Error (create):', error);
            throw new Error(`Erro ao salvar: ${error.message}`);
        }
        return data;
    },

    async update(id: string, updates: Partial<Client>) {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

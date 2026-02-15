import { supabase } from '../lib/supabase';
import type { Transaction, CreateTransactionDTO, FinanceStatsData } from '../modules/finance/types/finance.types';

export const transactionService = {
    async getAll(companyId: string) {
        if (!companyId) throw new Error('companyId is required');

        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    async create(dto: CreateTransactionDTO) {
        const { date, ...rest } = dto;
        if (!rest.company_id) throw new Error('company_id is required for transactions');

        // Map the optional 'date' field (YYYY-MM-DD) to 'created_at' column
        const payload = {
            ...rest,
            ...(date && { created_at: new Date(date).toISOString() })
        };

        const { data, error } = await supabase
            .from('transactions')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data as Transaction;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getStats(companyId: string): Promise<FinanceStatsData> {
        if (!companyId) throw new Error('companyId is required');

        const { data, error } = await supabase
            .from('transactions')
            .select('type, amount')
            .eq('company_id', companyId);

        if (error) throw error;

        const stats: FinanceStatsData = {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            avgTicket: 0
        };

        let incomeCount = 0;

        data?.forEach((t: { type: string; amount: number }) => {
            if (t.type === 'income') {
                stats.totalIncome += t.amount;
                incomeCount++;
            }
            else {
                stats.totalExpenses += t.amount;
            }
        });

        stats.balance = stats.totalIncome - stats.totalExpenses;
        stats.avgTicket = incomeCount > 0 ? stats.totalIncome / incomeCount : 0;

        return stats;
    },

    async getCommissionsByTechnician(companyId: string, technicianId: string, status?: 'pending' | 'paid') {
        let query = supabase
            .from('transactions')
            .select('*')
            .eq('company_id', companyId)
            .eq('technician_id', technicianId)
            .eq('category', 'Comissão');

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    async payCommissions(transactionIds: string[]) {
        if (!transactionIds.length) return;

        const { error } = await supabase
            .from('transactions')
            .update({ status: 'paid' })
            .in('id', transactionIds);

        if (error) throw error;
    }
};

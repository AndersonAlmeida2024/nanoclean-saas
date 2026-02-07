import { supabase } from '../lib/supabase';
import type { Transaction, CreateTransactionDTO, FinanceStatsData } from '../modules/finance/types/finance.types';

export const transactionService = {
    async getAll() {
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    async create(dto: CreateTransactionDTO) {
        const { date, ...rest } = dto;

        // Map the optional 'date' field (YYYY-MM-DD) to 'created_at' column
        // If date is provided, we use it. If not, Supabase defaults to now().
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

    async getStats(): Promise<FinanceStatsData> {
        const { data, error } = await supabase
            .from('transactions')
            .select('type, amount');

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
    }
};

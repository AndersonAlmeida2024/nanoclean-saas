/**
 * Represents a single financial transaction.
 */
export interface Transaction {
    id: string;
    created_at: string;
    type: TransactionType;
    amount: number;
    description: string;
    category: TransactionCategory;
    appointment_id?: string;
    user_id: string;
    technician_id?: string;
    status?: 'pending' | 'paid' | 'cancelled';
}

export type TransactionType = 'income' | 'expense';

/**
 * Supported transaction categories.
 * Can be extended in the future.
 */
export type TransactionCategory =
    | 'serviço'
    | 'combustível'
    | 'equipamentos'
    | 'produtos'
    | 'marketing'
    | 'contabilidade'
    | 'Comissão'
    | 'outros';

/**
 * Data required to create a new transaction.
 */
export interface CreateTransactionDTO {
    type: TransactionType;
    amount: number;
    description: string;
    category: TransactionCategory;
    user_id: string;
    company_id: string;
    date?: string; // Optional custom date, defaults to now in backend if omitted
    appointment_id?: string;
}

/**
 * Aggregated financial statistics.
 */
export interface FinanceStatsData {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    avgTicket: number;
}

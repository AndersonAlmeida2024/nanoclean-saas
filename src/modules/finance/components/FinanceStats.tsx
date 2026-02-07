import { useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Wallet, type LucideIcon } from 'lucide-react';
import { cn } from '../../../utils/cn';

/**
 * Data structure for finance statistics.
 */
export interface FinanceStatsData {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    avgTicket: number;
}

interface FinanceStatsProps {
    readonly stats: FinanceStatsData;
    readonly className?: string;
}

interface StatItem {
    label: string;
    value: string;
    icon: LucideIcon;
    color: string;
    bg: string;
    ariaLabel: string;
}

/**
 * Formats a number as BRL currency.
 */
const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export function FinanceStats({ stats, className }: FinanceStatsProps) {
    const items: StatItem[] = useMemo(() => {
        // Safety check for stats object to prevent runtime crashes if data is missing
        const safeStats = stats || {
            totalIncome: 0,
            totalExpenses: 0,
            balance: 0,
            avgTicket: 0
        };

        return [
            {
                label: 'Receita Bruta',
                value: formatCurrency(safeStats.totalIncome),
                icon: TrendingUp,
                color: 'text-cyan-400',
                bg: 'bg-cyan-500/10',
                ariaLabel: `Receita bruta de ${formatCurrency(safeStats.totalIncome)}`
            },
            {
                label: 'Total de Gastos',
                value: formatCurrency(safeStats.totalExpenses),
                icon: TrendingDown,
                color: 'text-red-400',
                bg: 'bg-red-500/10',
                ariaLabel: `Total de gastos de ${formatCurrency(safeStats.totalExpenses)}`
            },
            {
                label: 'Lucro Líquido',
                value: formatCurrency(safeStats.balance),
                icon: Wallet,
                color: 'text-green-400',
                bg: 'bg-green-500/10',
                ariaLabel: `Lucro líquido de ${formatCurrency(safeStats.balance)}`
            },
            {
                label: 'Ticket Médio',
                value: formatCurrency(safeStats.avgTicket),
                icon: DollarSign,
                color: 'text-purple-400',
                bg: 'bg-purple-500/10',
                ariaLabel: `Ticket médio de ${formatCurrency(safeStats.avgTicket)}`
            },
        ];
    }, [stats]);

    return (
        <div
            className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}
            role="region"
            aria-label="Estatísticas Financeiras"
        >
            {items.map((stat) => (
                <div
                    key={stat.label}
                    className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-all duration-300 shadow-lg"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div
                            className={cn("p-3 rounded-xl transition-colors", stat.bg)}
                            aria-hidden="true" // Icon is decorative, value provides context
                        >
                            <stat.icon size={24} className={stat.color} />
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">
                        {stat.label}
                    </p>
                    <h3
                        className="text-2xl font-black text-white mt-1"
                        aria-label={stat.ariaLabel}
                    >
                        {stat.value}
                    </h3>
                </div>
            ))}
        </div>
    );
}


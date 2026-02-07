import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { Transaction } from '../types/finance.types';

interface FinanceChartProps {
    period: string;
    transactions: Transaction[];
}

export function FinanceChart({ period, transactions }: FinanceChartProps) {
    const data = useMemo(() => {
        const groupedData: Record<string, { name: string; receita: number; despesa: number; dateInfo: Date }> = {};

        // Sort transactions by date first
        const sortedTransactions = [...transactions].sort((a, b) =>
            new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
        );

        if (sortedTransactions.length === 0) return [];

        sortedTransactions.forEach(t => {
            if (!t.created_at) return;
            const dateObj = new Date(t.created_at);
            // Group by Day (DD/MM) for granular views
            const key = format(dateObj, 'dd/MM');

            if (!groupedData[key]) {
                groupedData[key] = {
                    name: key,
                    receita: 0,
                    despesa: 0,
                    dateInfo: dateObj // Store for sorting if needed later
                };
            }

            const amount = Number(t.amount);
            if (t.type === 'income') {
                groupedData[key].receita += amount;
            } else {
                groupedData[key].despesa += amount;
            }
        });

        return Object.values(groupedData);
    }, [transactions]);

    return (
        <div className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">
                Fluxo de Caixa ({period.trim()})
            </h3>

            {
                data.length > 0 ? (
                    <div className="w-full h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis
                                    dataKey="name"
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                />
                                <YAxis
                                    stroke="#6b7280"
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickFormatter={(value) => `R$${value}`}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    formatter={(value: number | undefined) => [`R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
                                    labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="receita"
                                    name="Receitas"
                                    stroke="#06b6d4"
                                    fillOpacity={1}
                                    fill="url(#colorReceita)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="despesa"
                                    name="Despesas"
                                    stroke="#ef4444"
                                    fillOpacity={1}
                                    fill="url(#colorDespesa)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="w-full h-[300px] flex flex-col items-center justify-center text-gray-500 border border-dashed border-white/5 rounded-xl">
                        <p>Sem dados para o período</p>
                    </div>
                )
            }
        </div >
    );
}

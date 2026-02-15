import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RevenueChartProps {
    transactions: any[];
}

export function RevenueChart({ transactions }: RevenueChartProps) {
    const data = useMemo(() => {
        // Gera os últimos 7 dias
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = subDays(new Date(), 6 - i);
            return {
                date,
                name: format(date, 'eee', { locale: ptBR }),
                receita: 0
            };
        });

        // Preenche com os dados reais
        transactions.forEach(t => {
            if (t.type !== 'income' || !t.created_at) return;
            const tDate = new Date(t.created_at);

            const dayData = last7Days.find(d => isSameDay(d.date, tDate));
            if (dayData) {
                dayData.receita += Number(t.amount);
            }
        });

        return last7Days;
    }, [transactions]);

    return (
        <div className="w-full h-[240px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                        dy={10}
                        style={{ textTransform: 'uppercase' }}
                    />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: '#06b6d4', fontWeight: 'bold', fontSize: '12px' }}
                        labelStyle={{ color: '#71717a', marginBottom: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        formatter={(value: number | undefined) => [`R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`, 'Receita']}
                        labelFormatter={(label) => `${label}`}
                        cursor={{ stroke: '#06b6d4', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="receita"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#revenueGradient)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

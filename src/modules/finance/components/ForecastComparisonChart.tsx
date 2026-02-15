import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { format, subDays, addDays, isSameDay } from 'date-fns';

interface ForecastComparisonChartProps {
    appointments: any[];
    transactions: any[];
}

export function ForecastComparisonChart({ appointments, transactions }: ForecastComparisonChartProps) {
    const data = useMemo(() => {
        // Last 7 days + Next 7 days
        const days = Array.from({ length: 14 }).map((_, i) => {
            const date = addDays(subDays(new Date(), 7), i);
            return {
                date,
                name: format(date, 'dd/MM'),
                realizado: 0,
                previsto: 0
            };
        });

        // Realizado (Transactions)
        transactions.forEach(t => {
            if (t.type !== 'income' || !t.created_at) return;
            const tDate = new Date(t.created_at);
            const dayData = days.find(d => isSameDay(d.date, tDate));
            if (dayData) {
                dayData.realizado += Number(t.amount);
            }
        });

        // Previsto (Appointments)
        // Historical conversion rate for better projection
        const historicalScheduled = appointments.filter(a => a.status === 'scheduled' || a.status === 'completed').length;
        const historicalCompleted = appointments.filter(a => a.status === 'completed').length;
        const conversionRate = historicalScheduled > 0 ? historicalCompleted / historicalScheduled : 0.85;

        appointments.forEach(apt => {
            if (!apt.scheduled_date || apt.status === 'cancelled') return;
            const aptDate = new Date(apt.scheduled_date);
            const dayData = days.find(d => isSameDay(d.date, aptDate));
            if (dayData) {
                // If in the past and completed, it's already in 'realizado' (if it turned into a transaction)
                // But we show what was expected vs what happened
                dayData.previsto += Number(apt.price || 0) * conversionRate;
            }
        });

        return days;
    }, [appointments, transactions]);

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10 }}
                        tickFormatter={(value) => `R$${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                        }}
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                    <Bar
                        dataKey="realizado"
                        name="Realizado"
                        fill="#06b6d4"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                    />
                    <Bar
                        dataKey="previsto"
                        name="Previsto (Projeção)"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                        opacity={0.6}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

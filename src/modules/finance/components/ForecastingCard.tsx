import { TrendingUp, Calendar, Target, Percent } from 'lucide-react';
import type { ForecastData } from '../hooks/useForecast';

interface ForecastingCardProps {
    forecast: ForecastData;
}

export function ForecastingCard({ forecast }: ForecastingCardProps) {
    return (
        <div className="bg-gradient-to-br from-purple-500/10 via-cyan-500/10 to-blue-500/10 border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            {/* Glow Effect */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/20 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 blur-[100px] rounded-full" />

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-black text-white flex items-center gap-2">
                            <TrendingUp className="text-cyan-400" size={24} />
                            Previsão de Receita
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 font-medium">
                            Baseado em {forecast.totalScheduled} agendamentos futuros
                        </p>
                    </div>
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Percent size={16} className="text-green-400" />
                            <span className="text-sm font-black text-green-400">
                                {forecast.conversionRate.toFixed(0)}% conversão
                            </span>
                        </div>
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Next 7 Days */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg group-hover:bg-cyan-500/20 transition-colors">
                                <Calendar size={20} className="text-cyan-400" />
                            </div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Próximos 7 Dias
                            </span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            R$ {forecast.nextSevenDays.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">Receita prevista</p>
                    </div>

                    {/* Next 30 Days */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                                <Calendar size={20} className="text-purple-400" />
                            </div>
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                Próximos 30 Dias
                            </span>
                        </div>
                        <p className="text-3xl font-black text-white">
                            R$ {forecast.nextThirtyDays.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-600 mt-2">Receita prevista</p>
                    </div>

                    {/* Total Projected */}
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-5 hover:from-green-500/30 hover:to-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                <Target size={20} className="text-green-400" />
                            </div>
                            <span className="text-xs text-green-400 font-bold uppercase tracking-wider">
                                Projeção Total
                            </span>
                        </div>
                        <p className="text-3xl font-black text-green-400">
                            R$ {forecast.projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-400/60 mt-2">Receita esperada (30 dias)</p>
                    </div>
                </div>

                {/* Insight */}
                <div className="mt-6 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-xl">
                    <p className="text-sm text-cyan-400 font-medium leading-relaxed">
                        💡 <span className="font-bold">Insight:</span> Com base no seu histórico de conversão de{' '}
                        <span className="font-black">{forecast.conversionRate.toFixed(0)}%</span>, você tem{' '}
                        <span className="font-black">{forecast.totalScheduled} serviços agendados</span> que podem gerar até{' '}
                        <span className="font-black">
                            R$ {forecast.projectedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>{' '}
                        nos próximos 30 dias.
                    </p>
                </div>
            </div>
        </div>
    );
}

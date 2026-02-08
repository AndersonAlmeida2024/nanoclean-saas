import { useEffect, useState } from 'react';
import {
    TrendingUp,
    Users,
    Calendar,
    MessageCircle,
    Clock,
    ArrowRight,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import { appointmentService } from '../services/appointmentService';
import { transactionService } from '../services/transactionService';

interface StatsData {
    revenue: number;
    activeClients: number;
    todayServices: number;
    pendingServices: number;
    newLeads: number;
}

interface TodayAppointment {
    time: string;
    client: string;
    service: string;
    status: 'done' | 'current' | 'pending';
}

export function DashboardPage() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState<StatsData>({
        revenue: 0,
        activeClients: 0,
        todayServices: 0,
        pendingServices: 0,
        newLeads: 0
    });
    const [todaySchedule, setTodaySchedule] = useState<TodayAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Carregar dados em paralelo
            const [clients, financeStats, todayAppointments] = await Promise.all([
                clientService.getAll().catch((err) => { throw err }),
                transactionService.getStats().catch((err) => { throw err }),
                appointmentService.getByDate(
                    format(new Date(), 'yyyy-MM-dd')
                ).catch((err) => { throw err })
            ]);

            // Calcular estatísticas
            const activeClients = clients?.filter((c: { status?: string }) => c.status === 'active').length || 0;
            const newLeads = clients?.filter((c: { status?: string }) => c.status === 'lead').length || 0;
            const activeToday = todayAppointments?.filter((a: { status?: string }) => a.status !== 'cancelled') || [];

            setStats({
                revenue: financeStats.totalIncome || 0,
                activeClients,
                todayServices: activeToday.length,
                pendingServices: activeToday.filter((a: { status?: string }) => a.status === 'scheduled').length || 0,
                newLeads
            });

            // Formatar agenda do dia (Apenas ativos)
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const formattedSchedule: TodayAppointment[] = (todayAppointments || [])
                .filter((a: { status?: string }) => a.status !== 'cancelled')
                .map((apt: {
                    scheduled_time?: string;
                    clients?: { name?: string } | null;
                    service_type?: string;
                    status?: string;
                }) => {
                    const aptTime = apt.scheduled_time || '00:00';
                    let status: 'done' | 'current' | 'pending' = 'pending';

                    if (apt.status === 'completed') {
                        status = 'done';
                    } else if (aptTime <= currentTime && apt.status === 'scheduled') {
                        status = 'current';
                    }

                    return {
                        time: aptTime.substring(0, 5),
                        client: apt.clients?.name || 'Cliente',
                        service: apt.service_type || 'Serviço',
                        status
                    };
                });

            setTodaySchedule(formattedSchedule);
        } catch (error) {
            console.error('Erro ao carregar dashboard:', error);
            setError('Não foi possível carregar as informações do painel. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, []);

    const statsCards = [
        {
            label: 'Receita do Mês',
            value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
            change: stats.revenue > 0 ? 'Atualizado' : 'Sem dados',
            icon: TrendingUp,
            color: 'cyan'
        },
        {
            label: 'Clientes Ativos',
            value: stats.activeClients.toString(),
            change: stats.activeClients > 0 ? 'Cadastrados' : 'Nenhum',
            icon: Users,
            color: 'purple'
        },
        {
            label: 'Serviços Hoje',
            value: stats.todayServices.toString(),
            change: stats.pendingServices > 0 ? `${stats.pendingServices} pendente(s)` : 'Nenhum pendente',
            icon: Calendar,
            color: 'green'
        },
        {
            label: 'Leads Novos',
            value: stats.newLeads.toString(),
            change: stats.newLeads > 0 ? 'Aguardando' : 'Nenhum',
            icon: MessageCircle,
            color: 'yellow'
        },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="text-red-500" size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h2>
                <p className="text-gray-400 max-w-sm mb-8">{error}</p>
                <button
                    onClick={() => loadDashboardData()}
                    className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold transition-all active:scale-95"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">
                        {greeting}, <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">{userName}</span> 👋
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
                    >
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                            stat.color === 'cyan' && "bg-cyan-500/10",
                            stat.color === 'purple' && "bg-purple-500/10",
                            stat.color === 'green' && "bg-green-500/10",
                            stat.color === 'yellow' && "bg-yellow-500/10",
                        )}>
                            <stat.icon className={cn(
                                "w-6 h-6",
                                stat.color === 'cyan' && "text-cyan-400",
                                stat.color === 'purple' && "text-purple-400",
                                stat.color === 'green' && "text-green-400",
                                stat.color === 'yellow' && "text-yellow-400",
                            )} />
                        </div>
                        <p className="text-gray-400 text-sm">{stat.label}</p>
                        <div className="flex items-end justify-between mt-1">
                            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{stat.change}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Schedule */}
                <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Clock size={20} className="text-cyan-400" />
                            Agenda de Hoje
                        </h2>
                        <button className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                            Ver tudo <ArrowRight size={14} />
                        </button>
                    </div>

                    {todaySchedule.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum agendamento para hoje</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {todaySchedule.map((item, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-center gap-4 p-4 rounded-xl transition-colors",
                                        item.status === 'current' && "bg-cyan-500/10 border border-cyan-500/20",
                                        item.status === 'done' && "opacity-50",
                                        item.status === 'pending' && "bg-white/5 hover:bg-white/[0.07]"
                                    )}
                                >
                                    <div className="text-center min-w-[60px]">
                                        <span className={cn(
                                            "text-lg font-bold",
                                            item.status === 'current' ? "text-cyan-400" : "text-gray-400"
                                        )}>{item.time}</span>
                                    </div>

                                    <div className="flex-1">
                                        <p className="font-medium text-white">{item.client}</p>
                                        <p className="text-sm text-gray-400">{item.service}</p>
                                    </div>

                                    <div>
                                        {item.status === 'done' && <CheckCircle2 className="text-green-500" size={20} />}
                                        {item.status === 'current' && <AlertCircle className="text-cyan-400 animate-pulse" size={20} />}
                                        {item.status === 'pending' && <Clock className="text-gray-500" size={20} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empty State for Recent Activity */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Atividade Recente</h2>

                    <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma atividade recente</p>
                        <p className="text-sm mt-1">Cadastre clientes e agendamentos</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

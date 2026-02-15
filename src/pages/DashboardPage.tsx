import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    Calendar,
    MessageCircle,
    Clock,
    ArrowRight,
    AlertCircle,
    Bell,
    Plus,
    DollarSign,
    BarChart3,
    Sparkles,
    ClipboardCheck
} from 'lucide-react';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuthStore } from '../stores/authStore';
import { clientService } from '../services/clientService';
import { appointmentService } from '../services/appointmentService';
import { transactionService } from '../services/transactionService';
import { motion } from 'framer-motion';
import { ActivityFeed } from '../components/ActivityFeed';
import { transactionService as ts } from '../services/transactionService';
import { ForecastComparisonChart } from '../modules/finance/components/ForecastComparisonChart';
import { ForecastingCard } from '../modules/finance/components/ForecastingCard';
import { useForecast } from '../modules/finance/hooks/useForecast';

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
    const navigate = useNavigate();
    const { user, activeCompanyId, company } = useAuthStore();
    const [stats, setStats] = useState<StatsData>({
        revenue: 0,
        activeClients: 0,
        todayServices: 0,
        pendingServices: 0,
        newLeads: 0
    });
    const [todaySchedule, setTodaySchedule] = useState<TodayAppointment[]>([]);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [allAppointments, setAllAppointments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const forecast = useForecast(allAppointments || []);

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
    const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';

    const loadDashboardData = async () => {
        if (!activeCompanyId) return;

        try {
            setIsLoading(true);
            setError(null);

            // Carregar dados em paralelo
            const today = format(new Date(), 'yyyy-MM-dd');
            const [clients, financeStats, todayAppointments, allTransactions, allAppointments] = await Promise.all([
                clientService.getAll(activeCompanyId).catch(() => []),
                transactionService.getStats(activeCompanyId).catch(() => ({ totalIncome: 0 })),
                appointmentService.getByDate(today, activeCompanyId).catch(() => []),
                ts.getAll(activeCompanyId).catch(() => []),
                appointmentService.getAll(activeCompanyId).catch(() => [])
            ]);

            setTransactions(allTransactions || []);
            setAllAppointments(allAppointments || []);

            // Calcular estatísticas
            const activeClients = (clients || []).filter((c: any) => c.status === 'active').length || 0;
            const newLeads = (clients || []).filter((c: any) => c.status === 'lead').length || 0;
            const activeToday = (todayAppointments || []).filter((a: any) => a.status !== 'cancelled');

            setStats({
                revenue: financeStats.totalIncome || 0,
                activeClients,
                todayServices: activeToday.length,
                pendingServices: activeToday.filter((a: any) => a.status === 'scheduled').length || 0,
                newLeads
            });

            // Formatar agenda do dia
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

            const formattedSchedule: TodayAppointment[] = (todayAppointments || [])
                .filter((a: any) => a.status !== 'cancelled')
                .map((apt: any) => {
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
            setError('Não foi possível carregar as informações do painel.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeCompanyId) {
            loadDashboardData();
        } else {
            setStats({ revenue: 0, activeClients: 0, todayServices: 0, pendingServices: 0, newLeads: 0 });
            setIsLoading(false);
        }
    }, [activeCompanyId, user]);

    const statsCards = [
        {
            label: 'Receita do Mês',
            value: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`,
            change: '+12.5%',
            icon: TrendingUp,
            color: 'cyan'
        },
        {
            label: 'Clientes Ativos',
            value: stats.activeClients.toString(),
            change: `+${stats.newLeads}`,
            icon: Users,
            color: 'purple'
        },
        {
            label: 'Serviços Hoje',
            value: stats.todayServices.toString(),
            change: stats.pendingServices > 0 ? `${stats.pendingServices} pendentes` : 'Tudo pronto',
            icon: Calendar,
            color: 'green'
        },
        {
            label: 'Leads Novos',
            value: stats.newLeads.toString(),
            change: 'Aguardando',
            icon: MessageCircle,
            color: 'yellow'
        },
    ];

    const quickActions = [
        { label: 'Portal Técnico', icon: ClipboardCheck, color: 'blue', path: '/portal' },
        { label: 'Novo Cliente', icon: Plus, color: 'cyan', path: '/crm' },
        { label: 'Agendar', icon: Calendar, color: 'purple', path: '/schedule' },
        { label: 'Lançar Despesa', icon: DollarSign, color: 'pink', path: '/finance' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                <AlertCircle size={48} className="text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Ops! Algo deu errado</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                    onClick={() => loadDashboardData()}
                    className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-cyan-400 font-bold transition-all"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-black text-white tracking-tight">
                        {greeting}, <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">{userName}</span> 👋
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                        <p className="text-gray-400 font-medium">
                            {company?.name ? (
                                <span className="text-cyan-400 font-bold">{company.name}</span>
                            ) : (
                                <span className="text-gray-500 italic">Configuração pendente</span>
                            )}
                            <span className="mx-2 opacity-30">•</span>
                            <span className="capitalize">
                                {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
                            </span>
                        </p>
                    </div>
                </motion.div>

                <div className="flex items-center gap-4">
                    <button className="relative p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                        <Bell size={24} className="text-gray-400 group-hover:text-white" />
                        <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-[#0a0a0a] rounded-full" />
                    </button>
                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-white/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
                            {userName[0].toUpperCase()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Forecasting Banner (Highlight Pro) */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <ForecastingCard forecast={forecast} />
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-[2rem] p-6 transition-all duration-500 hover:-translate-y-2 overflow-hidden"
                    >
                        {/* Glow effect background */}
                        <div className={cn(
                            "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                            stat.color === 'cyan' && "bg-cyan-500",
                            stat.color === 'purple' && "bg-purple-500",
                            stat.color === 'green' && "bg-green-500",
                            stat.color === 'yellow' && "bg-yellow-500",
                        )} />

                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner",
                            stat.color === 'cyan' && "bg-cyan-500/10 text-cyan-400",
                            stat.color === 'purple' && "bg-purple-500/10 text-purple-400",
                            stat.color === 'green' && "bg-green-500/10 text-green-400",
                            stat.color === 'yellow' && "bg-yellow-500/10 text-yellow-400",
                        )}>
                            <stat.icon size={28} />
                        </div>

                        <p className="text-gray-400 font-medium text-sm mb-1">{stat.label}</p>
                        <div className="flex items-baseline justify-between">
                            <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                            <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter",
                                stat.color === 'cyan' && "bg-cyan-500/10 text-cyan-400",
                                stat.color === 'purple' && "bg-purple-500/10 text-purple-400",
                                stat.color === 'green' && "bg-green-500/10 text-green-400",
                                stat.color === 'yellow' && "bg-yellow-500/10 text-yellow-400",
                            )}>
                                {stat.change}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[100px] -z-10" />
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Sparkles size={20} className="text-cyan-400" />
                    ⚡ Ações Rápidas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                        <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + (index * 0.1) }}
                            className="flex flex-col items-center justify-center p-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-all hover:scale-[1.05] active:scale-95 group relative overflow-hidden"
                            onClick={() => navigate(action.path)}
                        >
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner",
                                action.color === 'cyan' && "bg-cyan-500/10 text-cyan-400",
                                action.color === 'purple' && "bg-purple-500/10 text-purple-400",
                                action.color === 'pink' && "bg-pink-500/10 text-pink-400",
                                action.color === 'yellow' && "bg-yellow-500/10 text-yellow-400",
                            )}>
                                <action.icon size={28} />
                            </div>
                            <span className="text-sm font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest">{action.label}</span>

                            {/* Decorative background glow on hover */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity -z-10 blur-xl",
                                action.color === 'cyan' && "bg-cyan-500",
                                action.color === 'purple' && "bg-purple-500",
                                action.color === 'pink' && "bg-pink-500",
                                action.color === 'yellow' && "bg-yellow-500",
                            )} />
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Today's Schedule */}
                <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-black text-white flex items-center gap-3">
                                <Clock size={28} className="text-cyan-400" />
                                Agenda de Hoje
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Serviços programados para este período</p>
                        </div>
                        <button className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-cyan-400 transition-all flex items-center gap-2">
                            Ver completa <ArrowRight size={16} />
                        </button>
                    </div>

                    {todaySchedule.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-black/20 rounded-3xl border border-white/5 border-dashed">
                            <Calendar size={48} className="text-gray-700 mb-4" />
                            <p className="text-gray-500 font-bold">Nenhum agendamento para hoje</p>
                            <button className="mt-4 text-cyan-400 text-sm hover:underline">Agendar primeiro serviço</button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {todaySchedule.map((item, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "group flex items-center gap-6 p-5 rounded-3xl border transition-all",
                                        item.status === 'current'
                                            ? "bg-cyan-500/10 border-cyan-500/20 shadow-lg shadow-cyan-500/5"
                                            : "bg-white/5 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <div className={cn(
                                        "w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black",
                                        item.status === 'current' ? "bg-cyan-500 text-black" : "bg-white/5 text-gray-400"
                                    )}>
                                        <span className="text-xs uppercase opacity-60">Hora</span>
                                        <span className="text-xl">{item.time}</span>
                                    </div>

                                    <div className="flex-1">
                                        <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{item.client}</h4>
                                        <p className="text-gray-500 font-medium">{item.service}</p>
                                    </div>

                                    <div className="hidden sm:flex items-center gap-2">
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            item.status === 'done' && "bg-green-500/10 text-green-400",
                                            item.status === 'current' && "bg-cyan-500/20 text-cyan-400 animate-pulse",
                                            item.status === 'pending' && "bg-white/10 text-gray-400",
                                        )}>
                                            {item.status === 'done' ? 'Concluído' : item.status === 'current' ? 'Em Andamento' : 'Pendente'}
                                        </span>
                                    </div>

                                    <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-500 hover:text-white transition-all">
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity Feed */}
                <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-[2.5rem] p-8">
                    <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <BarChart3 size={28} className="text-purple-400" />
                        Atividade Recente
                    </h2>

                    <ActivityFeed
                        activities={[
                            { time: '10 min atrás', title: 'Novo cliente cadastrado', desc: 'Ana Paula Santos • Lead', color: 'cyan' },
                            { time: '45 min atrás', title: 'Serviço concluído', desc: 'Limpeza Residencial • R$ 450', color: 'green' },
                            { time: '2h atrás', title: 'Pagamento recebido', desc: 'Referente ao pedido #1024', color: 'purple' },
                        ]}
                    />
                </div>
            </div>

            {/* Revenue Chart Section - NEW */}
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-cyan-400" />
                            Desempenho Semanal
                        </h3>
                        <p className="text-gray-500 text-sm mt-1">Evolução da receita nos últimos 7 dias</p>
                    </div>
                </div>

                <ForecastComparisonChart appointments={allAppointments} transactions={transactions} />
            </div>
        </div>
    );
}


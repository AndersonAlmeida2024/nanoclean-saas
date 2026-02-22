import { useState, useEffect } from 'react';
import {
    Calendar,
    ClipboardCheck,
    User,
    LogOut,
    Clock,
    MapPin,
    CheckCircle2,
    Loader2,
    AlertCircle,
    MessageCircle,
    Navigation,
    Wifi,
    WifiOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { appointmentService } from '../services/appointmentService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { useQuery } from '@tanstack/react-query';
import { InstallPWA } from '../components/InstallPWA';

export function TechnicianPortalPage() {
    const navigate = useNavigate();
    const { user, activeCompanyId, logout } = useAuthStore();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');

    const today = format(new Date(), 'yyyy-MM-dd');

    // Monitorar conexão
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // TanStack Query para carregar dados (com cache offline via persister)
    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['technician-appointments', activeCompanyId, user?.id, activeTab, today],
        queryFn: async () => {
            if (!activeCompanyId || !user) return [];
            // O backend via RLS já filtra o que o técnico pode ver
            if (activeTab === 'today') {
                return await appointmentService.getByDate(today, activeCompanyId);
            } else {
                return await appointmentService.getUpcoming(activeCompanyId);
            }
        },
        enabled: !!activeCompanyId && !!user,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleWaze = (location: string) => {
        const encoded = encodeURIComponent(location);
        window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank', 'noopener,noreferrer');
    };

    const handleWhatsApp = (phone: string, name: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const message = encodeURIComponent(`Olá ${name}, sou o técnico da NanoClean. Estarei chegando em breve para o seu atendimento!`);
        window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
    };

    if (isLoading && appointments.length === 0) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-12 h-12 text-cyan-500 animate-spin mb-4" />
                <p className="text-gray-400 font-medium">Preparando sua agenda...</p>
            </div>
        );
    }

    const filteredAppointments = appointments;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white pb-32">
            <InstallPWA />

            {/* Header com Status de Conexão */}
            <header className="bg-slate-900 border-b border-white/10 p-6 sticky top-0 z-50 backdrop-blur-xl bg-opacity-80">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-cyan-400 text-[10px] font-black tracking-widest uppercase">Portal do Técnico</p>
                            {isOnline ? (
                                <span className="flex items-center gap-1 text-[8px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full border border-green-500/20 font-bold uppercase tracking-tighter">
                                    <Wifi size={8} /> Online
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[8px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-500/20 font-bold uppercase tracking-tighter animate-pulse">
                                    <WifiOff size={8} /> Offline
                                </span>
                            )}
                        </div>
                        <h1 className="text-xl font-black">Olá, {user?.user_metadata?.name?.split(' ')[0] || 'Técnico'}</h1>
                        <p className="text-xs text-slate-500 font-medium italic">
                            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 active:scale-95 transition-all"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                {/* Tabs Operacionais */}
                <div className="flex gap-2 mt-6">
                    <button
                        onClick={() => setActiveTab('today')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                            activeTab === 'today'
                                ? "bg-cyan-500 text-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20"
                                : "bg-white/5 text-slate-400 border-white/10"
                        )}
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                            activeTab === 'upcoming'
                                ? "bg-cyan-500 text-slate-900 border-cyan-500 shadow-lg shadow-cyan-500/20"
                                : "bg-white/5 text-slate-400 border-white/10"
                        )}
                    >
                        Ver Próximos
                    </button>
                </div>
            </header>

            <div className="p-6 space-y-6 max-w-lg mx-auto">
                {!isOnline && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
                        <AlertCircle className="text-amber-500" size={18} />
                        <p className="text-xs text-amber-200">Você está offline. Exibindo dados salvos em cache.</p>
                    </div>
                )}

                {/* Resumo Rápido */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Pendentes</p>
                        <p className="text-2xl font-black">{appointments.filter(a => a.status === 'scheduled').length}</p>
                    </div>
                    <div className="bg-slate-900 border border-white/10 rounded-2xl p-4">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Concluídos</p>
                        <p className="text-2xl font-black text-green-500">{appointments.filter(a => a.status === 'completed').length}</p>
                    </div>
                </div>

                {/* Lista de Agendamentos */}
                <div className="space-y-4">
                    {filteredAppointments.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 border-dashed rounded-[2.5rem] p-12 text-center">
                            <AlertCircle className="mx-auto text-slate-700 mb-4" size={48} />
                            <p className="text-slate-500 font-medium italic">Nenhum serviço encontrado.</p>
                        </div>
                    ) : (
                        filteredAppointments.map((apt) => (
                            <motion.div
                                key={apt.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={cn(
                                    "bg-slate-900 border border-white/10 rounded-3xl p-5 relative overflow-hidden group",
                                    apt.status === 'completed' && "opacity-60 saturate-50"
                                )}
                            >
                                {/* Tag de Status */}
                                <div className="absolute top-0 right-0 p-3">
                                    <div className={cn(
                                        "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shadow-sm",
                                        apt.status === 'completed' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                    )}>
                                        {apt.status === 'completed' ? 'Finalizado' : 'Hoje'}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-cyan-400 border border-white/5">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black tracking-tight">{apt.scheduled_time?.substring(0, 5)}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase">{apt.service_type || 'Limpeza Professional'}</p>
                                    </div>
                                </div>

                                <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tighter">
                                    {apt.clients?.name || 'Cliente'}
                                </h3>

                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-6 bg-white/5 p-2 rounded-lg truncate">
                                    <MapPin size={12} className="text-red-500 shrink-0" />
                                    <span className="truncate">{apt.clients?.address || 'Consultar endereço na ficha'}</span>
                                </div>

                                {/* Botões Operacionais GIGANTES (Thumb-Friendly) */}
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button
                                        onClick={() => handleWaze(apt.clients?.address || '')}
                                        className="h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/10 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                                    >
                                        <Navigation size={20} className="text-blue-400" />
                                        <span>ROTA</span>
                                    </button>
                                    <button
                                        onClick={() => handleWhatsApp(apt.clients?.phone || '', apt.clients?.name || '')}
                                        className="h-14 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/10 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"
                                    >
                                        <MessageCircle size={20} className="text-green-500" />
                                        <span>ZAP</span>
                                    </button>
                                </div>

                                <button
                                    onClick={() => navigate(`/schedule?id=${apt.id}&action=inspect`)}
                                    className="w-full h-14 bg-gradient-to-r from-cyan-600 to-cyan-500 text-slate-900 font-black rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-cyan-500/20"
                                >
                                    <ClipboardCheck size={20} />
                                    ABRIR FICHA DE SERVIÇO
                                </button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Bottom Nav Fixo */}
            <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/90 border-t border-white/10 backdrop-blur-2xl p-4 flex justify-around items-center z-50">
                <button
                    onClick={() => setActiveTab('today')}
                    className={cn("flex flex-col items-center gap-1", activeTab === 'today' ? "text-cyan-400" : "text-slate-500")}
                >
                    <Calendar size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Agenda</span>
                </button>
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/40 -mt-8 border-4 border-[#0a0a0a] text-slate-900">
                    <CheckCircle2 size={24} />
                </div>
                <button className="flex flex-col items-center gap-1 text-slate-500">
                    <User size={20} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Perfil</span>
                </button>
            </nav>
        </div>
    );
}

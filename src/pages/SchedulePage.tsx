import { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Plus, Loader2, AlertCircle, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { appointmentService } from '../services/appointmentService';
import type { Appointment } from '../services/appointmentService';
import { supabase } from '../lib/supabase';
import { cn } from '../utils/cn';
import { useAuthStore } from '../stores/authStore';

export function SchedulePage() {
    const { companyId } = useAuthStore();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [selectedDate] = useState(startOfToday());
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAppointments = useCallback(async (showLoading = false) => {
        if (!companyId) return;
        try {
            if (showLoading) setIsLoading(true);
            else setIsRefreshing(true);

            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            console.log('[SchedulePage] Loading appointments for:', dateStr);

            const data = await appointmentService.getByDate(dateStr);
            setAppointments(data);
            setError(null);
        } catch (err: any) {
            console.error('[SchedulePage] Error loading data:', err);
            setError('Não foi possível carregar os agendamentos. Verifique sua conexão.');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedDate, companyId]);

    // Setup Realtime
    useEffect(() => {
        if (!companyId) return;

        console.log('[SchedulePage] Setting up Realtime for company:', companyId);

        const channel = supabase
            .channel(`schedule_changes_${companyId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `company_id=eq.${companyId}`
                },
                (payload) => {
                    console.log('[SchedulePage] Realtime event received:', payload.eventType);
                    // Recarrega os dados em qualquer mudança para garantir consistência total
                    loadAppointments();
                }
            )
            .subscribe((status) => {
                console.log('[SchedulePage] Subscribed status:', status);
                if (status === 'SUBSCRIBED') {
                    // Carga inicial garantida ao conectar
                    loadAppointments();
                }
            });

        return () => {
            console.log('[SchedulePage] Unsubscribing channel');
            supabase.removeChannel(channel);
        };
    }, [companyId, loadAppointments]);

    const getStatusInfo = (status: Appointment['status']) => {
        switch (status) {
            case 'scheduled': return { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Comprometido', icon: Clock };
            case 'in_progress': return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Em Atendimento', icon: Loader2 };
            case 'completed': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Concluído', icon: CheckCircle2 };
            case 'cancelled': return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelado', icon: XCircle };
            default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', label: status, icon: Clock };
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Agenda Dinâmica
                    </h1>
                    <p className="text-gray-400">
                        {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => loadAppointments()}
                        disabled={isRefreshing}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-gray-400 disabled:opacity-50"
                        title="Sincronizar manual"
                    >
                        <RefreshCw size={20} className={cn(isRefreshing && "animate-spin text-cyan-400")} />
                    </button>
                    <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                        <Plus size={20} />
                        Novo Agendamento
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <Loader2 size={48} className="text-cyan-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Sincronizando agendamentos...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                    <h3 className="text-white text-xl font-bold mb-2">Ops! Falha de Conexão</h3>
                    <p className="text-red-400/80 mb-6">{error}</p>
                    <button
                        onClick={() => loadAppointments(true)}
                        className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            ) : appointments.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl group">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                        <CalendarIcon size={32} className="text-gray-600" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhum agendamento para este dia.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {appointments.map((appointment) => {
                        const info = getStatusInfo(appointment.status);
                        return (
                            <div
                                key={appointment.id}
                                className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all duration-300 relative overflow-hidden"
                            >
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1", info.bg.replace('bg-', 'bg-').replace('/10', ''))} />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn("p-2 rounded-lg", info.bg)}>
                                                <info.icon size={18} className={info.color} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                    {appointment.service_type}
                                                </h3>
                                                <p className="text-sm text-gray-400 font-medium">
                                                    {appointment.clients?.name || 'Cliente Geral'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <Clock size={16} />
                                                <span>{appointment.scheduled_time}</span>
                                            </div>
                                            {appointment.address && (
                                                <div className="flex items-center gap-2 text-gray-500">
                                                    <MapPin size={16} />
                                                    <span className="truncate max-w-[200px]">{appointment.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                                        <span className="text-lg font-black text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price)}
                                        </span>
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full", info.bg, info.color)}>
                                            {info.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

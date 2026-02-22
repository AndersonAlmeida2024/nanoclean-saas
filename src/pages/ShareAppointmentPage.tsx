import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, CheckCircle2, AlertCircle, Download, Sparkles, Navigation } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calendarUtils } from '../utils/calendar';

export function ShareAppointmentPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [appointment, setAppointment] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchAppointment() {
            try {
                // Hardening: Usando RPC em vez de select direto para evitar Mass Listing Leaks
                const { data, error } = await supabase
                    .rpc('get_public_appointment', { p_token: token });

                if (error) throw error;
                if (!data) throw new Error('Agendamento não encontrado.');

                // Mapear retorno do RPC para o formato esperado pelo componente
                setAppointment({
                    ...data,
                    client: { name: data.client_name, address: data.address },
                    companies: { name: data.company_name }
                });
            } catch (err: any) {
                console.error('Error fetching shared appointment:', err);
                setError('Este link expirou ou o agendamento não foi encontrado.');
            } finally {
                setLoading(false);
            }
        }

        if (token) fetchAppointment();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !appointment) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h1 className="text-2xl font-bold text-white mb-2">Ops! Algo deu errado</h1>
                <p className="text-gray-400 max-w-sm mb-8">{error}</p>
                <Link to="/" className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10">
                    Voltar ao Início
                </Link>
            </div>
        );
    }

    const startTime = new Date(appointment.date);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2h de duração padrão

    const eventDetails = {
        title: `Serviço de Limpeza - ${appointment.companies?.name || 'NanoClean'}`,
        description: `Olá ${appointment.client?.name}! Seu serviço está confirmado.\nEste é um lembrete automático.`,
        location: appointment.client?.address || 'Endereço a confirmar',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
    };

    const handleGoogleCalendar = () => {
        window.open(calendarUtils.generateGoogleUrl(eventDetails), '_blank', 'noopener,noreferrer');
    };

    const handleIcsDownload = () => {
        calendarUtils.downloadIcs(eventDetails);
    };

    const handleGoogleMaps = () => {
        if (!appointment.client?.address) return;
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.client.address)}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-4 font-sans selection:bg-cyan-500/30">
            {/* Background Glow */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-full -z-10 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent opacity-50" />

            <div className="max-w-md mx-auto pt-12 pb-20">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12">
                    <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(6,182_212,0.3)] mb-4">
                        <Sparkles className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                        NANOCLEAN
                    </h1>
                </div>

                {/* Card do Agendamento */}
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 glass shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[40px] -mr-16 -mt-16" />

                    <div className="flex items-center gap-2 mb-6">
                        <CheckCircle2 className="text-cyan-400" size={20} />
                        <span className="text-cyan-400 font-bold text-sm tracking-widest uppercase">Serviço Confirmado</span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight mb-2">
                                {startTime.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                            </h2>
                            <div className="flex items-center gap-2 text-gray-400">
                                <Clock size={16} />
                                <span className="font-medium">Início às {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        <div className="h-px bg-white/5 w-full" />

                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="text-gray-400" size={20} />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Local do Serviço</p>
                                    <p className="text-white font-medium leading-tight">
                                        {appointment.client?.address || 'Informação restrita'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="mt-8 space-y-4">
                    <h3 className="text-center text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Ações Rápidas</h3>

                    <button
                        onClick={handleGoogleCalendar}
                        className="w-full py-5 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5"
                    >
                        <Calendar size={20} />
                        ADICIONAR AO GOOGLE AGENDA
                    </button>

                    <button
                        onClick={handleIcsDownload}
                        className="w-full py-5 bg-[#1a1a1a] border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Download size={20} />
                        BAIXAR ARQUIVO DE AGENDA (.ICS)
                    </button>

                    <button
                        onClick={handleGoogleMaps}
                        className="w-full py-5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                    >
                        <Navigation size={20} />
                        ABRIR NO GOOGLE MAPS
                    </button>

                    <p className="text-center text-xs text-gray-600 px-8 mt-6">
                        Ao adicionar à sua agenda, você receberá um lembrete automático 24 horas antes do início do serviço.
                    </p>
                </div>
            </div>
        </div>
    );
}

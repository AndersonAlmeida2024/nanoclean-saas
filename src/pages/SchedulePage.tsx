import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import { format, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { inspectionService } from '../services/inspectionService';
import { appointmentService } from '../services/appointmentService';
import { supabase } from '../lib/supabase';
import { useCompanyId, useCompany } from '../stores/authStore';
import { useAppointmentsCache } from '../hooks/useAppointmentsCache';
import { formatInspectionMessage } from '../utils/whatsapp';
import { Calendar } from '../components/Calendar';
import { InspectionModal } from '../components/InspectionModal';
import { AppointmentModal } from '../modules/agenda/components/AppointmentModal';
import { AppointmentCard } from '../components/AppointmentCard';

export function SchedulePage() {
    const companyId = useCompanyId();
    const company = useCompany();
    const [selectedDate, setSelectedDate] = useState(startOfToday());

    // ✅ PHASE 3 & 5: Optimized cache with Multi-tenant security
    const { appointments, isLoading, error, invalidate, invalidateAll } = useAppointmentsCache(selectedDate, companyId);

    const [allAppointmentsDates, setAllAppointmentsDates] = useState<string[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);
    const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    // ✅ PHASE 5: Multi-tenant safety - Invalidate cache immediately on company switch
    useEffect(() => {
        if (companyId) invalidateAll();
    }, [companyId, invalidateAll]);

    const loadAllDates = useCallback(async () => {
        if (!companyId) return;
        try {
            const { data } = await supabase.from('appointments').select('scheduled_date').eq('company_id', companyId);
            if (data) setAllAppointmentsDates(Array.from(new Set(data.map(a => a.scheduled_date))));
        } catch (err) {
            console.error('Erro ao carregar datas:', err);
        }
    }, [companyId]);

    useEffect(() => {
        if (companyId) loadAllDates();
    }, [companyId, loadAllDates]);

    // ✅ Setup Realtime Sync
    useEffect(() => {
        if (!companyId) return;
        const channel = supabase.channel(`sch_${companyId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `company_id=eq.${companyId}` }, () => invalidate()).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [companyId, invalidate]);

    // ✅ Handlers for AppointmentCard
    const handleOpenPreview = async (appointment: any) => {
        const inspection = await inspectionService.getByAppointment(appointment.id);
        if (inspection) {
            setSelectedReport(inspection);
            setSelectedAppointment(appointment); // Sync context
            setIsPreviewOpen(true);
        } else {
            alert('Nenhuma inspeção encontrada.');
        }
    };

    const handleSendReport = async (appointment: any) => {
        const inspection = await inspectionService.getByAppointment(appointment.id);
        if (inspection) {
            const whatsappUrl = formatInspectionMessage({
                clientName: appointment.clients?.name || 'Cliente',
                clientPhone: appointment.clients?.phone || '',
                inspectionId: inspection.id,
                publicToken: appointment.public_token,
                companyName: company?.name
            });
            window.open(whatsappUrl, '_blank');
        } else {
            alert('Nenhuma inspeção encontrada.');
        }
    };

    const handleOpenInspection = (appointment: any) => {
        setSelectedAppointment(appointment);
        setIsInspectionOpen(true);
    };

    const handleEdit = (appointment: any) => {
        setSelectedAppointment(appointment);
        setIsNewServiceModalOpen(true);
    };

    const handleDelete = async (appointment: any) => {
        const clientName = appointment.clients?.name || 'este cliente';
        if (window.confirm(`⚠️ EXCLUSÃO CRÍTICA: Deseja realmente excluir o agendamento de ${clientName}? Esta ação não pode ser desfeita.`)) {
            try {
                await appointmentService.delete(appointment.id);
                invalidate();
            } catch (err) {
                console.error('Erro ao excluir agendamento:', err);
                alert('Erro ao excluir agendamento. Verifique sua conexão.');
            }
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <CalendarDays className="text-cyan-500" size={36} />
                        Agenda <span className="text-gray-500 font-light">Inteligente</span>
                    </h1>
                    <p className="text-gray-400 mt-1 font-medium">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedAppointment(null);
                        setIsNewServiceModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
                >
                    <Plus size={22} /> Novo Serviço
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4 space-y-6">
                    <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} appointmentsDates={allAppointmentsDates} />
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">Resumo do Dia</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Pendentes</p>
                                <span className="text-3xl font-black text-white">{appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length}</span>
                            </div>
                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Concluídos</p>
                                <span className="text-3xl font-black text-emerald-400">{appointments.filter(a => a.status === 'completed').length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-8 space-y-6">
                    {isLoading ? (
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-20 flex flex-col items-center justify-center animate-pulse">
                            <Loader2 size={48} className="text-cyan-500 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Carregando serviços...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-12 text-center">
                            <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
                            <h3 className="text-xl font-bold text-white mb-2">Ops! Algum erro ocorreu</h3>
                            <button onClick={() => invalidate()} className="px-6 py-2 bg-white text-black rounded-xl font-bold mt-4">Tentar Novamente</button>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-20 text-center">
                            <CalendarIcon size={32} className="text-gray-700 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-gray-400">Nenhum serviço agendado</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {appointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onOpenPreview={handleOpenPreview}
                                    onSendReport={handleSendReport}
                                    onOpenInspection={handleOpenInspection}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <InspectionModal
                appointment={selectedAppointment}
                isOpen={isInspectionOpen}
                onClose={() => { setIsInspectionOpen(false); setSelectedAppointment(null); }}
                onComplete={() => invalidate()}
            />

            <AppointmentModal
                isOpen={isNewServiceModalOpen}
                appointment={selectedAppointment}
                onClose={() => {
                    setIsNewServiceModalOpen(false);
                    setSelectedAppointment(null);
                }}
                onSuccess={() => {
                    invalidate();
                    setIsNewServiceModalOpen(false);
                    setSelectedAppointment(null);
                }}
                selectedDate={selectedDate}
            />

            <InspectionModal
                isOpen={isPreviewOpen}
                onClose={() => { setIsPreviewOpen(false); setSelectedAppointment(null); }}
                appointment={selectedAppointment || selectedReport?.appointments}
                initialData={selectedReport}
                onComplete={() => invalidate()}
                readOnly={true}
            />
        </div>
    );
}

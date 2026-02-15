import { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import { useConfirm } from '../components/ConfirmationModal';
import { useToast } from '../components/Toast';
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
import { cn } from '../utils/cn';

export function SchedulePage() {
    const confirm = useConfirm();
    const toast = useToast();
    const companyId = useCompanyId();
    const company = useCompany();
    const [selectedDate, setSelectedDate] = useState(startOfToday());

    // ✅ PHASE 3 & 5: Optimized cache with Multi-tenant security
    const { appointments, isLoading, error, invalidate } = useAppointmentsCache(selectedDate, companyId);

    const [allAppointmentsDates, setAllAppointmentsDates] = useState<string[]>([]);
    const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
    const [isInspectionOpen, setIsInspectionOpen] = useState(false);
    const [isNewServiceModalOpen, setIsNewServiceModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    // ✅ PHASE 5: Multi-tenant safety handled inside useAppointmentsCache

    const [techniciansColors, setTechniciansColors] = useState<Record<string, string[]>>({});
    const [filterTechnicianId, setFilterTechnicianId] = useState<string>('all');
    const [companyTechnicians, setCompanyTechnicians] = useState<any[]>([]);

    const loadTechnicians = useCallback(async () => {
        if (!companyId) return;
        const { data } = await supabase.from('technicians').select('id, name, color').eq('company_id', companyId);
        setCompanyTechnicians(data || []);
    }, [companyId]);

    const loadAllDates = useCallback(async () => {
        if (!companyId) return;
        try {
            // Agora traz technicians para pintar o calendário
            const { data } = await supabase
                .from('appointments')
                .select('scheduled_date, technicians(color)')
                .eq('company_id', companyId);

            if (data) {
                const dates = Array.from(new Set(data.map(a => a.scheduled_date)));
                setAllAppointmentsDates(dates);

                // Agrupar cores por data
                const colorsMap: Record<string, string[]> = {};
                data.forEach((appt: any) => {
                    const date = appt.scheduled_date;
                    const color = appt.technicians?.color || '#06b6d4';
                    if (!colorsMap[date]) colorsMap[date] = [];
                    if (!colorsMap[date].includes(color)) colorsMap[date].push(color);
                });
                setTechniciansColors(colorsMap);
            }
        } catch (err) {
            console.error('Erro ao carregar datas:', err);
        }
    }, [companyId]);

    useEffect(() => {
        if (companyId) {
            loadAllDates();
            loadTechnicians();
        }
    }, [companyId, loadAllDates, loadTechnicians]);

    // ✅ Setup Realtime Sync - Date agnostic to prevent unnecessary re-subscriptions
    useEffect(() => {
        if (!companyId) return;
        const channel = supabase.channel(`sch_${companyId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'appointments',
                filter: `company_id=eq.${companyId}`
            }, () => {
                invalidate();
                loadAllDates(); // Sync calendar dots too
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [companyId, invalidate, loadAllDates]);

    // ✅ Handlers for AppointmentCard
    const handleOpenPreview = async (appointment: any) => {
        const inspection = await inspectionService.getByAppointment(appointment.id);
        if (inspection) {
            setSelectedReport(inspection);
            setSelectedAppointment(appointment); // Sync context
            setIsPreviewOpen(true);
        } else {
            toast.error('Nenhuma inspeção encontrada.');
        }
    };

    const handleSendReport = async (appointment: any) => {
        const inspection = await inspectionService.getByAppointment(appointment.id);
        if (inspection) {
            const whatsappUrl = formatInspectionMessage({
                clientName: appointment.clients?.name || 'Cliente',
                clientPhone: appointment.clients?.phone || '',
                inspectionId: inspection.id,
                companyName: company?.name
            });
            window.open(whatsappUrl, '_blank');
        } else {
            toast.error('Nenhuma inspeção encontrada.');
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
        confirm({
            title: 'Exclusão Crítica',
            message: `Deseja realmente excluir o agendamento de ${clientName}? Esta ação não pode ser desfeita.`,
            type: 'danger',
            confirmText: 'Excluir',
            onConfirm: async () => {
                try {
                    await appointmentService.delete(appointment.id);
                    invalidate();
                    loadAllDates();
                    toast.success('Agendamento excluído com sucesso.');
                } catch (err) {
                    console.error('Erro ao excluir agendamento:', err);
                    toast.error('Erro ao excluir agendamento. Verifique sua conexão.');
                }
            }
        });
    };

    const handleUpdateStatus = async (appointment: any, status: string) => {
        try {
            await appointmentService.update(appointment.id, { status: status as any });
            invalidate();
            loadAllDates();
        } catch (err) {
            console.error('Erro ao atualizar status:', err);
            alert('Erro ao atualizar status. Tente novamente.');
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                        <CalendarDays className="text-cyan-500 shrink-0" size={32} />
                        Agenda <span className="text-gray-500 font-light">Inteligente</span>
                    </h1>
                    <p className="text-gray-400 mt-1 font-medium text-sm md:text-base">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                </div>
                <button
                    onClick={() => {
                        setSelectedAppointment(null);
                        setIsNewServiceModalOpen(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 md:px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
                >
                    <Plus size={22} /> Novo Serviço
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4 space-y-6">
                    <Calendar
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        appointmentsDates={allAppointmentsDates}
                        techniciansColors={techniciansColors}
                    />

                    {/* Filtro de Técnicos */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <label className="text-xs text-gray-500 uppercase font-black tracking-widest mb-3 block">Filtrar por Técnico</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            <button
                                onClick={() => setFilterTechnicianId('all')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                                    filterTechnicianId === 'all'
                                        ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                                        : "bg-black/20 text-gray-400 border-transparent hover:bg-white/5"
                                )}
                            >
                                Todos
                            </button>
                            {companyTechnicians.map(tech => (
                                <button
                                    key={tech.id}
                                    onClick={() => setFilterTechnicianId(tech.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2",
                                        filterTechnicianId === tech.id
                                            ? "bg-slate-800 text-white border-white/20"
                                            : "bg-black/20 text-gray-400 border-transparent hover:bg-white/5"
                                    )}
                                    style={filterTechnicianId === tech.id ? { borderColor: tech.color } : {}}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tech.color }} />
                                    {tech.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden group">
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6">Resumo do Dia</h3>
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Pendentes</p>
                                <span className="text-3xl font-black text-white">{appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled').length}</span>
                            </div>
                            <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                                <p className="text-gray-500 text-[10px] font-black uppercase mb-1">Finalizados</p>
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
                            {appointments
                                .filter(appt => filterTechnicianId === 'all' || appt.technician_id === filterTechnicianId)
                                .map((appointment) => (
                                    <AppointmentCard
                                        key={appointment.id}
                                        appointment={appointment}
                                        onOpenPreview={handleOpenPreview}
                                        onSendReport={handleSendReport}
                                        onOpenInspection={handleOpenInspection}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onStatusUpdate={handleUpdateStatus}
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
                    loadAllDates(); // Atualizar bolinhas
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

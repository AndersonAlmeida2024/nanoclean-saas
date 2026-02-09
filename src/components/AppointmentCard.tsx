import { memo, useState, useEffect } from 'react';
import {
    Clock,
    MapPin,
    User,
    FileText,
    Send,
    ClipboardCheck,
    Sofa,
    Layout,
    CheckSquare,
    CheckCircle2,
    Loader2,
    XCircle,
    AlertCircle,
    MoreVertical,
    Trash2,
    Edit2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { inspectionService } from '../services/inspectionService';

interface AppointmentCardProps {
    appointment: any;
    onOpenPreview: (appointment: any) => void;
    onSendReport: (appointment: any) => void;
    onOpenInspection: (appointment: any) => void;
    onEdit?: (appointment: any) => void;
    onDelete?: (appointment: any) => void;
}

export const AppointmentCard = memo(({
    appointment,
    onOpenPreview,
    onSendReport,
    onOpenInspection,
    onEdit,
    onDelete
}: AppointmentCardProps) => {
    const [hasInspectionCheck, setHasInspectionCheck] = useState(appointment.has_inspection);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setIsMenuOpen(false); // Reset menu state on appointment change
        // If the flag is false but status is completed, double check from DB
        if (appointment.status === 'completed' && !appointment.has_inspection) {
            inspectionService.getByAppointment(appointment.id).then(ins => {
                if (ins) setHasInspectionCheck(true);
            }).catch(err => console.error('[AppointmentCard] Inspection check failed', err));
        } else {
            setHasInspectionCheck(appointment.has_inspection);
        }
    }, [appointment.id, appointment.status, appointment.has_inspection]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'scheduled': return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'Agendado', icon: Clock };
            case 'in_progress': return { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Em Andamento', icon: Loader2 };
            case 'completed': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Concluído', icon: CheckCircle2 };
            case 'cancelled': return { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Cancelado', icon: XCircle };
            default: return { color: 'text-gray-400', bg: 'bg-gray-500/10', label: status, icon: AlertCircle };
        }
    };

    const getServiceIcon = (type: string) => {
        const lowerType = type?.toLowerCase() || '';
        if (lowerType.includes('sofá') || lowerType.includes('sofa')) return Sofa;
        if (lowerType.includes('tapete') || lowerType.includes('rug')) return Layout;
        if (lowerType.includes('cadeira') || lowerType.includes('chair')) return CheckSquare;
        return ClipboardCheck;
    };

    const statusInfo = getStatusInfo(appointment.status);
    const ServiceIcon = getServiceIcon(appointment.service_type);

    return (
        <div className={cn(
            "group relative bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-3xl p-6 transition-all duration-500 overflow-hidden",
            "hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
        )}>
            {/* Sidebar Color Badge */}
            <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                statusInfo.bg.replace('/10', '/80').replace('bg-', 'bg-')
            )} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                    {/* Header: Service Icon + Title */}
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:rotate-6",
                            statusInfo.bg
                        )}>
                            <ServiceIcon size={28} className={statusInfo.color} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white group-hover:text-cyan-400 transition-colors">
                                {appointment.service_type}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-400 font-medium">
                                <User size={14} className="text-gray-500" />
                                <span>{appointment.clients?.name || 'Cliente Geral'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info: Time + Location */}
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                            <Clock size={14} className="text-cyan-400" />
                            <span className="text-sm font-bold text-white">
                                {appointment.scheduled_time}
                            </span>
                        </div>

                        {(appointment.address || appointment.location) && (
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.address || appointment.location)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-2 text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all group"
                            >
                                <MapPin size={14} className="text-cyan-500 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-medium truncate max-w-[250px] group-hover:text-cyan-400 transition-colors">
                                    {appointment.address || appointment.location}
                                </span>
                            </a>
                        )}
                    </div>
                </div>

                {/* Right Side: Price + Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Total</p>
                        <span className="text-2xl font-black text-white bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(appointment.price)}
                        </span>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        {/* Status Badge with Icon */}
                        <div className={cn(
                            "flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-lg",
                            statusInfo.bg,
                            statusInfo.color,
                            statusInfo.bg.replace('bg-', 'border-').replace('/10', '/40')
                        )}>
                            <statusInfo.icon size={12} className={cn(appointment.status === 'in_progress' && "animate-spin")} />
                            {statusInfo.label}
                        </div>

                        {/* Actions Logic */}
                        <div className="flex items-center gap-2">
                            <div className="flex gap-2 flex-1">
                                {hasInspectionCheck ? (
                                    <>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onOpenPreview(appointment); }}
                                            className="flex-1 p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase hover:text-white"
                                        >
                                            <FileText size={16} /> Resumo
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSendReport(appointment); }}
                                            className="flex-1 p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-2xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase"
                                        >
                                            <Send size={16} /> Enviar
                                        </button>
                                    </>
                                ) : (appointment.status === 'scheduled' || appointment.status === 'in_progress') ? (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onOpenInspection(appointment); }}
                                        className="w-full p-2.5 bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 hover:from-cyan-600/30 hover:to-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-2xl transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
                                    >
                                        <ClipboardCheck size={18} /> Iniciar Inspeção
                                    </button>
                                ) : (
                                    <div className="w-full text-center py-2 text-gray-600 text-[10px] font-black uppercase tracking-widest">
                                        Sem Ações
                                    </div>
                                )}
                            </div>

                            {/* Actions Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(!isMenuOpen);
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-2xl border transition-all",
                                        isMenuOpen
                                            ? "bg-white/10 border-white/20 text-white"
                                            : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
                                    )}
                                >
                                    <MoreVertical size={18} />
                                </button>

                                {isMenuOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                                        <div className="absolute right-0 bottom-full mb-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    onEdit?.(appointment);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm text-gray-300 transition-colors border-b border-white/5"
                                            >
                                                <Edit2 size={16} className="text-cyan-400" />
                                                Editar Agendamento
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsMenuOpen(false);
                                                    onDelete?.(appointment);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-sm text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                Excluir Serviço
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.appointment.id === nextProps.appointment.id &&
        prevProps.appointment.status === nextProps.appointment.status &&
        prevProps.appointment.has_inspection === nextProps.appointment.has_inspection &&
        prevProps.appointment.service_type === nextProps.appointment.service_type &&
        prevProps.appointment.price === nextProps.appointment.price;
});

AppointmentCard.displayName = 'AppointmentCard';

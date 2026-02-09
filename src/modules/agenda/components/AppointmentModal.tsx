import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, DollarSign, Briefcase, Loader2, Search, MapPin, CheckCircle2 } from 'lucide-react';
import { appointmentService } from '../../../services/appointmentService';
import { clientService } from '../../../services/clientService';
import { useUser, useCompanyId } from '../../../stores/authStore';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate?: Date;
    appointment?: any; // Para edição
}

export function AppointmentModal({ isOpen, onClose, onSuccess, selectedDate, appointment }: AppointmentModalProps) {
    const user = useUser();
    const companyId = useCompanyId();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [clientSearch, setClientSearch] = useState('');
    const [isSearchingClients, setIsSearchingClients] = useState(false);

    const [formData, setFormData] = useState({
        client_id: '',
        service_type: '',
        scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        scheduled_time: '09:00',
        price: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        if (isOpen) {
            loadClients();
            if (appointment) {
                setFormData({
                    client_id: appointment.client_id,
                    service_type: appointment.service_type,
                    scheduled_date: appointment.scheduled_date,
                    scheduled_time: appointment.scheduled_time.substring(0, 5),
                    price: appointment.price.toString(),
                    address: appointment.address || '',
                    notes: appointment.notes || '',
                });
                setClientSearch(appointment.clients?.name || '');
            } else {
                setFormData({
                    client_id: '',
                    service_type: '',
                    scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                    scheduled_time: '09:00',
                    price: '',
                    address: '',
                    notes: '',
                });
                setClientSearch('');
            }
        }
    }, [isOpen, appointment, selectedDate]);

    const loadClients = async () => {
        if (!companyId) return;
        try {
            setIsSearchingClients(true);
            const data = await clientService.getAll(companyId);
            setClients(data || []);
        } catch (err) {
            console.error('Erro ao carregar clientes:', err);
        } finally {
            setIsSearchingClients(false);
        }
    };

    const filteredClients = (clients || []).filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !formData.client_id) return;

        try {
            setIsLoading(true);
            const data = {
                ...formData,
                price: parseFloat(formData.price),
                status: appointment ? appointment.status : 'scheduled',
                user_id: user.id,
                company_id: companyId
            };

            if (appointment) {
                await appointmentService.update(appointment.id, data as any);
            } else {
                await appointmentService.create(data as any);
            }

            setShowSuccess(true);
            setTimeout(() => {
                onSuccess();
                onClose();
                setShowSuccess(false);
            }, 1000);
        } catch (err) {
            console.error('Erro ao agendar/atualizar serviço:', err);
            alert('Erro ao processar. Verifique a conexão com o Supabase.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Backdrop click to close */}
            <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[2rem] shadow-2xl p-8 overflow-hidden max-h-[90vh] overflow-y-auto cursor-default animate-in zoom-in-95 duration-300 outline-none">
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                            <CheckCircle2 className="text-emerald-400" size={48} />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tight">Sucesso!</h2>
                            <p className="text-emerald-400/80 font-medium">Agendamento registrado.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center">
                                    <CalendarIcon className="text-cyan-400" size={24} />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight leading-none">
                                    {appointment ? 'Editar' : 'Novo'}<br />
                                    <span className="text-gray-500 text-lg font-bold">Agendamento</span>
                                </h2>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl text-gray-400 transition-all hover:rotate-90">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1">Cliente</label>
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors group-focus-within:text-cyan-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {isSearchingClients ? (
                                        <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-cyan-500" size={24} /></div>
                                    ) : filteredClients.length === 0 ? (
                                        <p className="text-xs text-center text-gray-600 py-4 font-bold border border-dashed border-white/5 rounded-2xl">Nenhum cliente encontrado.</p>
                                    ) : (
                                        filteredClients.map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        client_id: client.id,
                                                        address: client.address || ''
                                                    });
                                                    setClientSearch(client.name);
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-4 rounded-2xl border text-left transition-all",
                                                    formData.client_id === client.id
                                                        ? "bg-cyan-500/10 border-cyan-500/50 text-white scale-[0.98]"
                                                        : "bg-white/5 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300"
                                                )}
                                            >
                                                <span className="text-sm font-black">{client.name}</span>
                                                <span className="text-[10px] font-bold opacity-50">{client.phone}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1 mb-2">Local do Serviço</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Endereço de atendimento"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1 mb-2">Serviço</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={formData.service_type}
                                            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                            placeholder="Ex: Limpeza Sofá"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1 mb-2">Preço (R$)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0,00"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 font-black"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1 mb-2">Data</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.scheduled_date}
                                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-cyan-500/50 [color-scheme:dark] font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] text-gray-500 uppercase font-black tracking-widest pl-1 mb-2">Hora</label>
                                    <input
                                        required
                                        type="time"
                                        value={formData.scheduled_time}
                                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-cyan-500/50 [color-scheme:dark] font-bold"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest transition-all border border-white/5">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !formData.client_id}
                                    className="flex-[2] py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Agendar'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

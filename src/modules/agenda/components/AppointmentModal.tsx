import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, DollarSign, Briefcase, Loader2, Search, MapPin } from 'lucide-react';
import { appointmentService } from '../../../services/appointmentService';
import { clientService } from '../../../services/clientService';
import { useAuthStore } from '../../../stores/authStore';
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
    const user = useAuthStore((state) => state.user);
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
        try {
            setIsSearchingClients(true);
            const data = await clientService.getAll();
            setClients(data || []);
        } catch (err) {
            console.error('Erro ao carregar clientes:', err);
        } finally {
            setIsSearchingClients(false);
        }
    };

    const filteredClients = clients.filter(c =>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-8 glass overflow-hidden max-h-[90vh] overflow-y-auto">
                {showSuccess ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full animate-pulse" />
                            <img
                                src="/success.png"
                                alt="Sucesso"
                                className="w-56 h-56 object-cover rounded-3xl relative z-10 border border-white/10 shadow-2xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black text-white tracking-tight">Serviço Agendado!</h2>
                            <p className="text-purple-400 font-medium">Agenda atualizada ⚡</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                    <CalendarIcon className="text-purple-400" size={20} />
                                </span>
                                Novo Agendamento
                            </h2>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Seleção de Cliente */}
                            <div className="space-y-2">
                                <label className="block text-sm text-gray-400 font-medium">Cliente</label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Buscar cliente..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {isSearchingClients ? (
                                        <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-gray-500" size={20} /></div>
                                    ) : filteredClients.length === 0 ? (
                                        <p className="text-xs text-center text-gray-500 py-2">Nenhum cliente encontrado.</p>
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
                                                    "flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                                                    formData.client_id === client.id
                                                        ? "bg-purple-500/10 border-purple-500/50 text-white"
                                                        : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
                                                )}
                                            >
                                                <span className="text-sm font-medium">{client.name}</span>
                                                <span className="text-[10px] opacity-50">{client.phone}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Endereço específico do agendamento */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Endereço do Serviço</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                    <input
                                        required
                                        type="text"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Local do atendimento"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Serviço e Preço */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Tipo de Serviço</label>
                                    <div className="relative group">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="text"
                                            value={formData.service_type}
                                            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                                            placeholder="Ex: Limpeza Sofá"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Valor (R$)</label>
                                    <div className="relative group">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="0,00"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Data e Hora */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Data</label>
                                    <div className="relative group">
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="date"
                                            value={formData.scheduled_date}
                                            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2 font-medium">Horário</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors" size={18} />
                                        <input
                                            required
                                            type="time"
                                            value={formData.scheduled_time}
                                            onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2 font-medium">Observações</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Ex: Levar escova macia..."
                                    className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500/50 resize-none transition-all"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={onClose} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading || !formData.client_id}
                                    className="flex-[2] py-4 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl font-black transition-all shadow-xl shadow-purple-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : 'Agendar Serviço'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

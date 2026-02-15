import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Instagram, MessageCircle, Facebook, Loader2, MapPin, CheckCircle2, History, FileText, Send } from 'lucide-react';
import { clientService } from '../../../services/clientService';
import { appointmentService } from '../../../services/appointmentService';
import { useUser, useCompanyId, useCompany } from '../../../stores/authStore';
import { InspectionModal } from '../../../components/InspectionModal';
import { cn } from '../../../utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInspectionMessage } from '../../../utils/whatsapp';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    client?: any; // Cliente opcional para modo edição/visualização
}

export function ClientModal({ isOpen, onClose, onSuccess, client }: ClientModalProps) {
    const user = useUser();
    const companyId = useCompanyId();
    const company = useCompany();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'history'>(client ? 'history' : 'info');
    const [history, setHistory] = useState<any[]>([]);

    // Preview Interno (usando InspectionModal agora)
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: client?.name || '',
        phone: client?.phone || '',
        email: client?.email || '',
        address: client?.address || '',
        source: client?.source || 'whatsapp',
        status: client?.status || 'lead',
    });

    // Carregar histórico e sincronizar dados se o cliente/modal mudar
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: client?.name || '',
                phone: client?.phone || '',
                email: client?.email || '',
                address: client?.address || '',
                source: client?.source || 'whatsapp',
                status: client?.status || 'lead',
            });
            setActiveTab(client ? 'history' : 'info');

            if (client?.id) {
                loadHistory();
            }
        }
    }, [isOpen, client?.id]);

    async function loadHistory() {
        if (!client?.id) return;
        try {
            setIsLoadingHistory(true);
            const data = await appointmentService.getByClient(client.id);
            setHistory(data || []);
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    }

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            alert('Sessão expirada. Por favor, faça login novamente.');
            return;
        }

        try {
            setIsLoading(true);

            const dataToSave = {
                ...formData,
                user_id: user.id,
                company_id: companyId,
                address: formData.address.trim() || null
            };

            if (client?.id) {
                await clientService.update(client.id, dataToSave as any);
            } else {
                await clientService.create(dataToSave as any);
            }

            setShowSuccess(true);

            // Animação e fechamento
            setTimeout(() => {
                onSuccess();
                onClose();
                setTimeout(() => {
                    setShowSuccess(false);
                    if (!client) {
                        setFormData({ name: '', phone: '', email: '', address: '', source: 'whatsapp', status: 'lead' });
                    }
                }, 500);
            }, 2000);
        } catch (err: any) {
            console.error('Erro ao cadastrar cliente:', err);

            let errorMessage = err.message || 'Erro desconhecido';

            if (errorMessage.includes('row-level security')) {
                errorMessage = 'Erro de Permissão (RLS): Seu usuário não está associado a uma empresa válida. Por favor, execute o script de correção (006) no Supabase.';
            }

            alert(`Erro do Banco: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendReport = (inspection: any) => {
        // ✅ PHASE 4: Using centralized WhatsApp logic
        const whatsappUrl = formatInspectionMessage({
            clientName: client?.name || formData.name,
            clientPhone: client?.phone || formData.phone || '',
            inspectionId: inspection.id,
            itemType: inspection.items?.item_type,
            companyName: company?.name
        });

        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-8 glass overflow-hidden max-h-[90vh] overflow-y-auto outline-none">
                {showSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1, rotate: 360 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182_212,0.3)]"
                        >
                            <CheckCircle2 className="text-white" size={48} />
                        </motion.div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-2"
                        >
                            <h2 className="text-3xl font-black text-white tracking-tight">Cliente Salvo!</h2>
                            <p className="text-cyan-400 font-medium">Base de dados atualizada ⚡</p>
                        </motion.div>
                    </motion.div>
                ) : (
                    <>
                        {/* Glow Decor - pointer-events-none added to prevent blocking clicks */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -mr-16 -mt-16 pointer-events-none" />

                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <User className="text-cyan-400" size={20} />
                                </span>
                                <h2 className="text-2xl font-bold text-white tracking-tight">
                                    {client ? 'Detalhes do Cliente' : 'Novo Cliente'}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all border border-white/5"
                                title="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-8">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                                    activeTab === 'info' ? "bg-cyan-500 text-white shadow-lg shadow-cyan-900/40" : "text-gray-500 hover:text-gray-300"
                                )}
                            >
                                <User size={16} /> Informações
                            </button>
                            {client && (
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all",
                                        activeTab === 'history' ? "bg-cyan-500 text-white shadow-lg shadow-cyan-900/40" : "text-gray-500 hover:text-gray-300"
                                    )}
                                >
                                    <History size={16} /> Histórico de Limpezas
                                </button>
                            )}
                        </div>

                        {activeTab === 'info' ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Nome */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-400 mb-2 font-medium">Nome Completo</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Ex: Anderson"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Telefone */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 font-medium">Telefone / WhatsApp</label>
                                        <div className="relative group">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                required
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="(47) 99999-9999"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-2 font-medium">E-mail (opcional)</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="anderson@email.com"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Endereço */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm text-gray-400 mb-2 font-medium">Endereço de Atendimento</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                placeholder="Rua, número, bairro..."
                                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Origem */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-3 font-medium text-center md:text-left">Como ele te conheceu?</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {[
                                            { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' },
                                            { id: 'instagram', icon: Instagram, label: 'Insta', color: 'text-pink-500' },
                                            { id: 'facebook', icon: Facebook, label: 'Face', color: 'text-blue-500' },
                                            { id: 'manual', icon: User, label: 'Manual', color: 'text-gray-400' },
                                        ].map((src) => (
                                            <button
                                                key={src.id}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, source: src.id as any })}
                                                className={cn(
                                                    "flex flex-col items-center justify-center p-3 rounded-xl border transition-all gap-1.5",
                                                    formData.source === src.id
                                                        ? "bg-cyan-500/20 border-cyan-500/50 scale-105 shadow-lg shadow-cyan-900/20"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10"
                                                )}
                                            >
                                                <src.icon className={cn(src.color)} size={20} />
                                                <span className="text-[10px] uppercase font-black tracking-widest">{src.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm text-gray-400 mb-3 font-medium">Status do Lead</label>
                                    <div className="flex gap-2 p-1 bg-black/40 border border-white/10 rounded-xl">
                                        {['lead', 'active', 'inactive'].map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, status: status as any })}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-sm font-bold uppercase tracking-tight transition-all",
                                                    formData.status === status
                                                        ? "bg-cyan-500 text-white shadow-lg shadow-cyan-900/40"
                                                        : "text-gray-500 hover:text-gray-300"
                                                )}
                                            >
                                                {status === 'lead' ? 'Lead' : status === 'active' ? 'Ativo' : 'Inativo'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all border border-white/5"
                                    >
                                        {client ? 'Fechar' : 'Cancelar'}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-[2] py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="animate-spin" size={24} />
                                        ) : (
                                            client ? 'Atualizar Dados' : 'Salvar Cliente'
                                        )}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {isLoadingHistory ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="animate-spin text-cyan-500" size={32} />
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
                                        <History size={48} className="mx-auto text-gray-600 mb-4 opacity-50" />
                                        <p className="text-gray-500 font-bold">Nenhuma limpeza registrada ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pb-4">
                                        {history.map((appointment) => {
                                            const inspection = appointment.service_inspections?.[0];
                                            return (
                                                <div
                                                    key={appointment.id}
                                                    className="group bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-2xl p-5 transition-all hover:bg-white/[0.08]"
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex gap-4">
                                                            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center shrink-0 border border-cyan-500/20">
                                                                <FileText className="text-cyan-400" size={20} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <h4 className="font-bold text-white capitalize text-lg">
                                                                    {inspection?.items?.item_type || appointment.service_type || 'Serviço'}
                                                                </h4>
                                                                <p className="text-xs text-gray-500 font-bold tracking-tight">
                                                                    {format(new Date(appointment.scheduled_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                                                </p>
                                                                {inspection?.items?.issues && inspection.items.issues.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                                        {inspection.items.issues.map((issue: string) => (
                                                                            <span key={issue} className="text-[9px] bg-red-500/5 text-red-500/80 border border-red-500/10 px-2 py-0.5 rounded-full uppercase font-black tracking-widest">
                                                                                {issue}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col gap-2 shrink-0">
                                                            {inspection ? (
                                                                <>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setSelectedReport(inspection);
                                                                            setIsPreviewOpen(true);
                                                                        }}
                                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold border border-white/10 transition-all"
                                                                    >
                                                                        <FileText size={14} /> Resumo
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSendReport(inspection);
                                                                        }}
                                                                        className="flex items-center justify-center gap-2 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-black border border-cyan-500/20 transition-all"
                                                                    >
                                                                        <Send size={14} /> Enviar
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <span className="text-[10px] text-gray-600 font-bold italic py-2">
                                                                    Sem laudo técnico
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <InspectionModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                appointment={{ ...selectedReport?.appointments, clients: client }}
                initialData={selectedReport}
                onComplete={loadHistory}
                readOnly={true}
            />
        </div>
    );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Mail, Instagram, MessageCircle, Facebook, Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { clientService } from '../../../services/clientService';
import { useAuthStore } from '../../../stores/authStore';
import { cn } from '../../../utils/cn';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
    const { user, companyId } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        source: 'whatsapp' as 'whatsapp' | 'instagram' | 'facebook' | 'manual',
        status: 'lead' as 'lead' | 'active' | 'inactive',
    });

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

            await clientService.create(dataToSave as any);

            setShowSuccess(true);

            // Animação e fechamento
            setTimeout(() => {
                onSuccess();
                onClose();
                setTimeout(() => {
                    setShowSuccess(false);
                    setFormData({ name: '', phone: '', email: '', address: '', source: 'whatsapp', status: 'lead' });
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-8 glass overflow-hidden max-h-[90vh] overflow-y-auto">
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
                        {/* Glow Decor */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[50px] -mr-16 -mt-16" />

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                    <User className="text-cyan-400" size={20} />
                                </span>
                                <h2 className="text-2xl font-bold text-white tracking-tight">Novo Cliente</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
                                title="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

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
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-[2] py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-cyan-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        'Salvar Cliente'
                                    )}
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}

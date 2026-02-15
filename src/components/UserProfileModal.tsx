import { useState } from 'react';
import { X, Check, MapPin, Key, Image as ImageIcon, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';

interface UserProfileModalProps {
    onClose: () => void;
    currentProfile: any; // Tipar melhor se possível
}

export function UserProfileModal({ onClose, currentProfile }: UserProfileModalProps) {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.user_metadata?.name || '',
        address_base: currentProfile?.address_base || '',
        pix_key: currentProfile?.pix_key || '',
        // company_logo não persistido no form data simples, seria upload
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Atualizar metadata do usuário (Nome)
            const { error: authError } = await supabase.auth.updateUser({
                data: { name: formData.name }
            });
            if (authError) throw authError;

            // Atualizar profile/company (Endereço e Pix)
            await supabase.auth.updateUser({
                data: {
                    address_base: formData.address_base,
                    pix_key: formData.pix_key
                }
            });

            // Feedback
            alert('Perfil atualizado com sucesso!');

            onClose();
            window.location.reload(); // Refresh para atualizar UI global
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">Editar Perfil</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Logo Upload (Mock) */}
                    <div className="flex justify-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden">
                                <ImageIcon size={32} className="text-slate-500" />
                            </div>
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                <Upload size={20} className="text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Nome (ReadOnly ou Editável) */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400">Nome da Empresa / Responsável</label>
                        <input
                            type="text"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Endereço Base */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <MapPin size={16} /> Endereço Base Operacional
                        </label>
                        <input
                            type="text"
                            placeholder="Ex: Centro, Itajaí - SC"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            value={formData.address_base}
                            onChange={e => setFormData({ ...formData, address_base: e.target.value })}
                        />
                    </div>

                    {/* Chave Pix */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <Key size={16} /> Chave Pix Padrão
                        </label>
                        <input
                            type="text"
                            placeholder="CPF, Email ou Aleatória"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                            value={formData.pix_key}
                            onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Check size={20} />}
                        Salvar Alterações
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

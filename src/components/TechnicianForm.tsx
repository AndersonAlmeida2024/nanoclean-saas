import { useState } from 'react';
import { X, Check, User, Phone, Palette, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
// import confetti from 'canvas-confetti';

interface TechnicianFormProps {
    onClose: () => void;
    onSuccess: () => void;
    isFirstTechnician?: boolean;
    technician?: any; // Dados para edição
}

const COLORS = [
    '#ef4444', // Red-500
    '#f97316', // Orange-500
    '#f59e0b', // Amber-500
    '#10b981', // Emerald-500
    '#14b8a6', // Teal-500
    '#06b6d4', // Cyan-500 (Default)
    '#3b82f6', // Blue-500
    '#ec4899', // Pink-500
];

export function TechnicianForm({ onClose, onSuccess, isFirstTechnician = false, technician }: TechnicianFormProps) {
    const { activeCompanyId } = useAuthStore();
    const [loading, setLoading] = useState(false);

    // Inicializar com dados do técnico se for edição
    const [formData, setFormData] = useState({
        name: technician?.name || '',
        phone: technician?.phone || '',
        color: technician?.color || '#06b6d4',
        commission_rate: technician?.commission_rate || 30,
        commission_type: technician?.commission_type || 'percent' as 'percent' | 'fixed'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                company_id: activeCompanyId,
                name: formData.name,
                phone: formData.phone.replace(/\D/g, ''),
                color: formData.color,
                commission_rate: formData.commission_rate,
                commission_type: formData.commission_type
            };

            let error;

            if (technician?.id) {
                // Update
                const res = await supabase.from('technicians').update(payload).eq('id', technician.id);
                error = res.error;
            } else {
                // Insert
                const res = await supabase.from('technicians').insert(payload);
                error = res.error;
            }

            if (error) throw error;

            if (isFirstTechnician) {
                // confetti({
                //     particleCount: 150,
                //     spread: 70,
                //     origin: { y: 0.6 },
                //     colors: ['#06b6d4', '#10b981', '#f59e0b']
                // });
            }

            alert('Técnico cadastrado com sucesso! O Modo Equipe foi ativado.');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar técnico:', error);
            alert(`Erro ao salvar: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white">{technician ? 'Editar Técnico' : 'Novo Técnico'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <User size={16} /> Nome Completo
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="Ex: João Silva"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <Phone size={16} /> WhatsApp
                        </label>
                        <input
                            type="tel"
                            required
                            placeholder="(11) 99999-9999"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    {/* Cor da Agenda */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <Palette size={16} /> Cor na Agenda
                        </label>
                        <div className="grid grid-cols-8 gap-2">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, color })}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color
                                        ? 'border-white scale-110 shadow-lg shadow-white/20'
                                        : 'border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Comissão */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 text-sm text-slate-400">
                            <Percent size={16} /> Modelo de Comissão
                        </label>

                        {/* Toggle Type */}
                        <div className="flex bg-slate-800 p-1 rounded-xl border border-white/5">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, commission_type: 'percent' })}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.commission_type === 'percent'
                                    ? 'bg-cyan-500 text-slate-900 shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                % Porcentagem
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, commission_type: 'fixed' })}
                                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${formData.commission_type === 'fixed'
                                    ? 'bg-cyan-500 text-slate-900 shadow-lg'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                R$ Valor Fixo
                            </button>
                        </div>

                        {/* Input Area */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-400">
                                    {formData.commission_type === 'percent' ? 'Definir Porcentagem' : 'Definir Valor'}
                                </span>
                                <span className="font-bold text-cyan-400 text-lg">
                                    {formData.commission_type === 'percent'
                                        ? `${formData.commission_rate}%`
                                        : `R$ ${Number(formData.commission_rate).toFixed(2)}`
                                    }
                                </span>
                            </div>

                            {formData.commission_type === 'percent' ? (
                                <>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        value={formData.commission_rate}
                                        onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-2"
                                    />
                                    <p className="text-xs text-slate-500">
                                        *Calculado sobre o valor total do serviço.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.50"
                                            placeholder="0,00"
                                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                            value={formData.commission_rate}
                                            onChange={e => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">
                                        *Valor fixo pago por serviço realizado.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Check size={20} />}
                            {isFirstTechnician ? 'Ativar Modo Equipe' : 'Salvar Técnico'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

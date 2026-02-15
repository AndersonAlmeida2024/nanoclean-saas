import { useState, useEffect } from 'react';
import { UserPlus, Phone, Trash2, Edit2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { TechnicianForm } from '../components/TechnicianForm';
import { useCompanySettings } from '../hooks/useCompanySettings';

interface Technician {
    id: string;
    name: string;
    phone: string;
    color: string;
    commission_rate: number;
    is_active: boolean;
}

export function TechnicianPage() {
    const { activeCompanyId, user } = useAuthStore();
    const { refetch: refetchSettings } = useCompanySettings();
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    useEffect(() => {
        if (activeCompanyId) loadTechnicians();
    }, [activeCompanyId]);

    async function loadTechnicians() {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('technicians')
                .select('*')
                .eq('company_id', activeCompanyId)
                .order('name');

            if (error) throw error;
            setTechnicians(data || []);
        } catch (error) {
            console.error('Erro ao carregar equipe:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleWhatsApp = (tech: Technician) => {
        const message = `Olá ${tech.name}, aqui é o ${user?.user_metadata?.name || 'Administrador'}. Seguem os detalhes do próximo serviço.`;
        window.open(`https://wa.me/55${tech.phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza? Isso não apagará o histórico de serviços.')) return;

        const { error } = await supabase.from('technicians').delete().eq('id', id);
        if (!error) loadTechnicians();
    };

    return (
        <div className="min-h-screen pb-20 p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Gestão de Equipe</h1>
                    <p className="text-sm text-slate-400">Gerencie seus técnicos e comissões</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
                >
                    <UserPlus size={20} />
                    <span className="hidden md:inline">Novo Técnico</span>
                </button>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {technicians.map((tech) => (
                            <motion.div
                                key={tech.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-slate-900 border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all"
                                style={{ borderLeftWidth: '4px', borderLeftColor: tech.color }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white/50 border border-white/5">
                                            <UserPlus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg">{tech.name}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-white/5">
                                                    {tech.commission_rate}% Comissão
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(tech.id)}
                                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => handleWhatsApp(tech)}
                                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Phone size={16} /> WhatsApp
                                    </button>
                                    <button
                                        onClick={() => {/* TODO: Edit */ }}
                                        className="px-3 bg-slate-800 hover:bg-slate-700 text-white border border-white/10 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {isFormOpen && (
                <TechnicianForm
                    onClose={() => setIsFormOpen(false)}
                    onSuccess={() => {
                        loadTechnicians();
                        refetchSettings(); // Atualiza estado global
                    }}
                />
            )}
        </div>
    );
}

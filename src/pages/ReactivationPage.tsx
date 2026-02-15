import { useState, useEffect } from 'react';
import { Repeat, TrendingUp, Calendar, Users, MessageCircle, AlertTriangle, Snowflake, Flame, ExternalLink, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InactiveClient {
    id: string;
    name: string;
    phone: string;
    last_service_date: string;
    last_service_value: number;
    days_inactive: number;
}

export function ReactivationPage() {
    const { activeCompanyId } = useAuthStore();
    const [clients, setClients] = useState<InactiveClient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'fire' | 'freezer'>('fire');
    const [searchQuery, setSearchQuery] = useState('');
    const [contactedIds, setContactedIds] = useState<string[]>(() => {
        const saved = localStorage.getItem('reactivation-contacted');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        if (activeCompanyId) {
            loadInactiveClients();
        }
    }, [activeCompanyId]);

    async function loadInactiveClients() {
        try {
            setIsLoading(true);
            // Chamando o RPC criado (threshold de 45 dias para começar a aparecer)
            const { data, error } = await supabase.rpc('get_inactive_clients', {
                days_threshold: 45
            });

            if (error) throw error;
            setClients(data || []);
        } catch (error) {
            console.error('[ReactivationPage] Erro ao carregar inativos:', error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleContact = (client: InactiveClient) => {
        // Higienizar telefone
        const cleanPhone = client.phone.replace(/\D/g, '');
        if (!cleanPhone) return;

        // Mensagem Personalizada
        const message = `Olá ${client.name.split(' ')[0]}, faz algum tempo que não cuidamos do seu espaço! A recomendação técnica é realizar a limpeza a cada 6 meses para evitar ácaros e sujeira profunda. Vamos agendar sua manutenção?`;

        const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');

        // Marcar como contatado na sessão
        const newContacted = [...new Set([...contactedIds, client.id])];
        setContactedIds(newContacted);
        localStorage.setItem('reactivation-contacted', JSON.stringify(newContacted));
    };

    // Filtragem por Tab e Busca
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isFireZone = c.days_inactive >= 45 && c.days_inactive <= 90;
        const isFreezer = c.days_inactive > 90;

        if (activeTab === 'fire') return matchesSearch && isFireZone;
        return matchesSearch && isFreezer;
    });

    // Cálculos de KPI
    const ticketMedio = clients.reduce((acc, curr) => acc + (curr.last_service_value || 0), 0) / (clients.length || 1);
    const potentialRevenue = clients.length * (ticketMedio || 150); // Fallback se não houver dados

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Repeat size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Churn Busters</h1>
                            <p className="text-sm text-slate-400">Reative clientes e recupere receita parada</p>
                        </div>
                    </div>

                    {/* KPI Dinheiro na Mesa */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-4"
                    >
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <TrendingUp size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Dinheiro na Mesa</p>
                            <p className="text-xl font-black text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(potentialRevenue)}
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Tabs de Controle */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex p-1 bg-slate-900 border border-white/10 rounded-xl">
                    <button
                        onClick={() => setActiveTab('fire')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'fire'
                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Flame size={16} />
                        Zona de Fogo (45-90d)
                    </button>
                    <button
                        onClick={() => setActiveTab('freezer')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'freezer'
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Snowflake size={16} />
                        Freezer (90d+)
                    </button>
                </div>

                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente na lista..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-full bg-slate-900 border border-white/10 rounded-xl pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                    />
                </div>
            </div>

            {/* Lista de Clientes */}
            {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="h-40 bg-slate-900/50 border border-white/5 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : filteredClients.length > 0 ? (
                <motion.div
                    layout
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredClients.map((client) => {
                            const isContacted = contactedIds.includes(client.id);
                            return (
                                <motion.div
                                    key={client.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={`relative group bg-slate-900 border border-white/10 rounded-2xl p-5 transition-all hover:border-cyan-500/30 ${isContacted ? 'opacity-50' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-cyan-400 transition-colors">
                                                {client.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Calendar size={12} />
                                                Último: {format(new Date(client.last_service_date), "dd 'de' MMM", { locale: ptBR })}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${activeTab === 'fire' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {client.days_inactive} dias
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 uppercase font-bold">Ticket Anterior</span>
                                            <span className="text-sm font-bold text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.last_service_value)}
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handleContact(client)}
                                            disabled={!client.phone}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 ${!client.phone
                                                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                                    : isContacted
                                                        ? 'bg-slate-800 text-slate-400'
                                                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                                                }`}
                                        >
                                            {isContacted ? (
                                                <>Contatado</>
                                            ) : (
                                                <>
                                                    <MessageCircle size={18} />
                                                    Reativar
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {!client.phone && (
                                        <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                                            <AlertTriangle size={10} />
                                            SEM TELEFONE
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-4">
                        {activeTab === 'fire' ? <Flame size={40} className="text-slate-800" /> : <Snowflake size={40} className="text-slate-800" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nada por aqui no momento</h3>
                    <p className="text-slate-400 max-w-sm">
                        {activeTab === 'fire'
                            ? 'Excelente! Você não tem clientes na zona de perigo imediato.'
                            : 'Nenhum cliente no freezer profundo ainda. Continue o bom trabalho!'}
                    </p>
                </div>
            )}
        </div>
    );
}

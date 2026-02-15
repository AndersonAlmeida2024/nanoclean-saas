import { useState, useEffect } from 'react';
import {
    Building2,
    Plus,
    ArrowRight,
    ShieldCheck,
    Users,
    MapPin,
    PlusCircle,
    Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import { companyService } from '../services/companyService';
import type { Company } from '../services/companyService';
import { withTimeout } from '../utils/withTimeout';

export function BranchesPage() {
    const { activeCompanyId, memberships, switchCompany } = useAuthStore();
    const [branches, setBranches] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newBranch, setNewBranch] = useState({ name: '', slug: '' });
    const [error, setError] = useState<string | null>(null);

    // Verifica se a empresa ativa é Matriz
    const activeMembership = memberships.find(m => m.company_id === activeCompanyId);
    const isMatrix = activeMembership?.companies?.company_type === 'matrix';
    const isOwner = activeMembership?.role === 'owner' || activeMembership?.role === 'admin';

    useEffect(() => {
        if (isMatrix && activeCompanyId) {
            loadBranches();
        } else if (activeCompanyId) {
            // Not matrix, stop loading immediately
            setIsLoading(false);
        }
    }, [activeCompanyId, isMatrix]);

    async function loadBranches() {
        if (!activeCompanyId) return;
        try {
            setIsLoading(true);
            setError(null);
            const data = await withTimeout(
                companyService.getBranches(activeCompanyId),
                10000,
                'Timeout ao carregar filiais. Verifique sua conexão.'
            );
            setBranches(data);
        } catch (err) {
            console.error('Erro ao carregar filiais:', err);
            setError(err instanceof Error ? err.message : 'Erro ao carregar filiais');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreateBranch(e: React.FormEvent) {
        e.preventDefault();
        try {
            await companyService.createBranch(newBranch.name, newBranch.slug);
            setNewBranch({ name: '', slug: '' });
            setIsCreating(false);
            loadBranches();
        } catch (err) {
            alert('Erro ao criar filial. Verifique se o slug é único.');
        }
    }

    // Se estiver carregando as informações de autenticação/membership
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <Loader2 className="text-cyan-500 animate-spin" size={40} />
            </div>
        );
    }

    if (!isMatrix) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] text-center p-6">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={40} className="text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Acesso Restrito</h1>
                <p className="text-gray-400 max-w-md">
                    Apenas contas de nível Matriz podem gerenciar filiais.
                    Sua empresa atual ({activeMembership?.companies?.name || 'Unidade'}) é uma unidade de operação.
                </p>
                {isOwner && (
                    <p className="text-xs text-cyan-500/50 mt-4">
                        Dica: Certifique-se de estar logado na unidade principal do seu negócio.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Gestão de Filiais
                    </h1>
                    <p className="text-gray-400">Expanda seu negócio e gerencie múltiplas unidades em um só lugar.</p>
                </div>

                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Nova Filial
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-red-400 font-medium mb-2">Erro ao carregar dados</p>
                        <p className="text-red-300/70 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={() => loadBranches()}
                        className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-bold transition-all"
                    >
                        Tentar Novamente
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                        <Building2 size={16} className="text-cyan-400" />
                        Total de Unidades
                    </p>
                    <h3 className="text-3xl font-black text-white">{branches.length + 1}</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                        <Users size={16} className="text-purple-400" />
                        Membros nas Filiais
                    </p>
                    <h3 className="text-3xl font-black text-white">--</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-emerald-400">
                    <p className="text-sm text-gray-400 flex items-center gap-2 mb-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        Status do Sistema
                    </p>
                    <h3 className="text-xl font-black">Operacional 100%</h3>
                </div>
            </div>

            {/* Matrix Card */}
            <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <Building2 size={120} />
                </div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] uppercase tracking-widest bg-cyan-500 text-black font-black px-2 py-1 rounded-full mb-3 inline-block">Sede Matriz</span>
                        <h2 className="text-2xl font-black text-white mb-2">{activeMembership?.companies?.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1"><MapPin size={14} /> Global</div>
                            <div className="flex items-center gap-1"><ShieldCheck size={14} className="text-cyan-400" /> Administrador Master</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Branches List */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <PlusCircle size={20} className="text-cyan-400" />
                    Unidades Operacionais
                </h3>

                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="text-cyan-500 animate-spin" size={40} />
                    </div>
                ) : branches.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-3xl">
                        <p className="text-gray-500">Nenhuma filial cadastrada ainda.</p>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="mt-4 text-cyan-400 hover:text-cyan-300 font-bold"
                        >
                            Comece criando a primeira agora →
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {branches.map(branch => (
                            <div key={branch.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Building2 className="text-gray-400 group-hover:text-cyan-400" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white text-lg">{branch.name}</h4>
                                            <p className="text-sm text-gray-500">{branch.slug}.nanoclean.com.br</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => switchCompany(branch.id)}
                                        className="p-3 bg-white/5 hover:bg-cyan-500/20 text-gray-400 hover:text-cyan-400 rounded-xl transition-all"
                                        title="Entrar na Unidade"
                                    >
                                        <ArrowRight size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-6">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl"
                    >
                        <h2 className="text-2xl font-black text-white mb-6">Cadastrar Nova Unidade</h2>
                        <form onSubmit={handleCreateBranch} className="space-y-4">
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-black mb-2 block">Nome da Unidade</label>
                                <input
                                    autoFocus
                                    required
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                                    placeholder="Ex: NanoClean - Jardins"
                                    value={newBranch.name}
                                    onChange={e => setNewBranch({ ...newBranch, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-widest text-gray-500 font-black mb-2 block">Slug Único (Identificador)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500 outline-none transition-all"
                                    placeholder="ex: jardins-sp"
                                    value={newBranch.slug}
                                    onChange={e => setNewBranch({ ...newBranch, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                                >
                                    Criar Filial
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

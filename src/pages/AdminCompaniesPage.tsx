import { useState, useEffect } from 'react';
import { adminService, type AdminCompany } from '../services/adminService';
import { Building2, ShieldAlert, CheckCircle2, MoreVertical, Plus, Search, Filter } from 'lucide-react';
import { cn } from '../utils/cn';

export function AdminCompaniesPage() {
    const [companies, setCompanies] = useState<AdminCompany[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            setIsLoading(true);
            const data = await adminService.listCompanies();
            setCompanies(data);
        } catch (err) {
            console.error('Failed to load companies');
        } finally {
            setIsLoading(false);
        }
    }

    async function toggleStatus(company: AdminCompany) {
        const newStatus = company.status === 'active' ? 'suspended' : 'active';
        try {
            await adminService.setCompanyStatus(company.id, newStatus);
            loadCompanies();
        } catch (err) {
            alert('Erro ao alterar status');
        }
    }

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white">Gestão de Empresas</h1>
                    <p className="text-gray-400">Total de {companies.length} tenants na plataforma</p>
                </div>
                <button className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/10">
                    <Plus size={20} />
                    Provisionar Empresa
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Empresas Ativas', value: companies.filter(c => c.status === 'active').length, color: 'text-green-400' },
                    { label: 'Suspensa / Débito', value: companies.filter(c => c.status === 'suspended').length, color: 'text-red-400' },
                    { label: 'Plano Pro/Matrix', value: companies.filter(c => c.plan_id !== 'free').length, color: 'text-cyan-400' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className={cn("text-3xl font-black", stat.color)}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou slug..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
                <button className="bg-white/5 border border-white/10 text-gray-300 px-4 py-3 rounded-xl flex items-center gap-2 hover:bg-white/10">
                    <Filter size={18} />
                    Filtros
                </button>
            </div>

            {/* Companies List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Plano</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider text-center">Usuários</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider">Criada em</th>
                                <th className="px-6 py-4 text-sm font-bold text-gray-400 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma empresa encontrada.
                                    </td>
                                </tr>
                            ) : filteredCompanies.map((company) => (
                                <tr key={company.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-cyan-500/20">
                                                <Building2 size={20} className="text-cyan-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white leading-none mb-1">{company.name}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-tighter">{company.slug}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold",
                                            company.status === 'active' ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                                        )}>
                                            {company.status === 'active' ? <CheckCircle2 size={12} /> : <ShieldAlert size={12} />}
                                            {company.status === 'active' ? 'ATIVA' : 'SUSPENSA'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-300 uppercase">{company.plan_id}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm text-white font-mono bg-white/5 px-2 py-1 rounded border border-white/5">{company.member_count}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-400">{new Date(company.created_at).toLocaleDateString()}</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => toggleStatus(company)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                                    company.status === 'active'
                                                        ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                                        : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                                                )}
                                            >
                                                {company.status === 'active' ? 'Suspender' : 'Ativar'}
                                            </button>
                                            <button className="p-2 text-gray-500 hover:text-white transition-colors">
                                                <MoreVertical size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

import { useState, useMemo } from 'react';
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import { ClientCard } from '../modules/crm/components/ClientCard';
import { ClientModal } from '../modules/crm/components/ClientModal';
import { type Client } from '../modules/crm/types';
import { useCompanyContext } from '../stores/authStore';
import { useClientsCache } from '../hooks/useClientsCache';

export function CRMPage() {
    const { companyId, platformContextLoaded } = useCompanyContext();

    // ✅ PERFORMANCE: Using cache hook instead of manual state + useEffect
    const { clients = [], isLoading, error, invalidate } = useClientsCache(
        platformContextLoaded ? companyId : null
    );

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (client: Client | null = null) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    // ✅ PERFORMANCE: Memoizing filtered list to prevent O(N) filtering on every render.
    // Also pre-calculates search lower case once to avoid repeated toLowerCase() calls in the loop.
    const filteredClients = useMemo(() => {
        const clientList = clients || [];
        if (!searchTerm) return clientList;

        const searchLower = searchTerm.toLowerCase();
        return clientList.filter((client: Client) => {
            const nameMatch = client?.name?.toLowerCase()?.includes(searchLower) ?? false;
            const phoneMatch = client?.phone?.includes(searchTerm) ?? false;
            return nameMatch || phoneMatch;
        });
    }, [clients, searchTerm]);

    // ✅ SAFETY GUARD: Prevent rendering if clients data is missing and not loading.
    if (!clients && !isLoading) return null;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        CRM & Clientes
                    </h1>
                    <p className="text-gray-400 mt-1">Gerencie seus contatos e leads em um só lugar.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-cyan-900/20"
                >
                    <Plus size={20} />
                    Novo Cliente
                </button>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center gap-4 bg-white/5 p-2 rounded-xl border border-white/10 max-w-md">
                <Search className="text-gray-500 ml-2" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:outline-none text-white w-full placeholder:text-gray-600"
                />
            </div>

            {/* States: Loading, Error, Empty, List */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="text-cyan-500 animate-spin" size={40} />
                    <p className="text-gray-400">Carregando sua base de clientes...</p>
                </div>
            ) : error ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center">
                    <AlertCircle className="text-red-500 mx-auto mb-4" size={40} />
                    <h3 className="text-white font-semibold mb-2">Ops! Algo deu errado</h3>
                    <p className="text-red-400/80 mb-6">{error}</p>
                    <button
                        onClick={() => invalidate()} // ✅ Invalidate cache to retry
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-2xl">
                    <p className="text-gray-500 mb-4">Nenhum cliente encontrado.</p>
                    <button
                        onClick={() => openModal(null)}
                        className="text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                        + Cadastrar primeiro cliente
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <div key={client.id} onClick={() => openModal(client)} className="cursor-pointer">
                            <ClientCard client={client} />
                        </div>
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedClient(null);
                }}
                onSuccess={() => {
                    invalidate(); // ✅ Invalidate cache to reload data
                    setIsModalOpen(false);
                    setSelectedClient(null);
                }}
                client={selectedClient}
            />
        </div>
    );
}

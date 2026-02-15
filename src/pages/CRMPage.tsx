import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Loader2, AlertCircle, Users, LayoutGrid, List } from 'lucide-react';
import { clientService } from '../services/clientService';
import { useCompanyId, usePlatformLoaded } from '../stores/authStore';
import { ClientModal } from '../modules/crm/components/ClientModal';
import { ClientCard } from '../modules/crm/components/ClientCard';
import { KanbanBoard } from '../modules/crm/components/KanbanBoard';
import { cn } from '../utils/cn';
import { withTimeout } from '../utils/withTimeout';

interface CRMPageProps {
    forcedView?: 'list' | 'kanban';
}

export function CRMPage({ forcedView }: CRMPageProps) {
    const companyId = useCompanyId();
    const isLoaded = usePlatformLoaded();

    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
        if (forcedView) return forcedView;
        return (localStorage.getItem('crm-view-mode') as 'list' | 'kanban') || 'kanban';
    });

    // Atualiza o modo se a prop mudar (importante para navegação dinâmica)
    useEffect(() => {
        if (forcedView) {
            setViewMode(forcedView);
        }
    }, [forcedView]);

    // Estados para o Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClient, setSelectedClient] = useState<any | null>(null);

    const loadClients = useCallback(async (silent = false) => {
        if (!companyId) return;
        try {
            if (!silent) setIsLoading(true);
            const data = await withTimeout(
                clientService.getAll(companyId),
                10000,
                'Timeout ao carregar clientes'
            );
            setClients(data || []);
        } catch (err) {
            console.error("Erro ao carregar CRM:", err);
        } finally {
            setIsLoading(false);
        }
    }, [companyId]);

    useEffect(() => {
        if (isLoaded && companyId) {
            loadClients();
        }
    }, [companyId, isLoaded, loadClients]);

    const handleNewClient = () => {
        setSelectedClient(null);
        setIsModalOpen(true);
    };

    const handleEditClient = (client: any) => {
        setSelectedClient(client);
        setIsModalOpen(true);
    };

    const handleViewModeChange = (mode: 'list' | 'kanban') => {
        if (forcedView) return; // Bloqueia alteração se forçado
        setViewMode(mode);
        localStorage.setItem('crm-view-mode', mode);
    };

    // ✅ PERFORMANCE: Memoizing filtered list to prevent O(N) filtering on every render.
    // Also pre-calculates search lower case once to avoid repeated toLowerCase() calls in the loop.
    const filtered = useMemo(() => {
        const clientList = clients || [];
        if (!searchTerm) return clientList;

        const searchLower = searchTerm.toLowerCase();
        return clientList.filter(client =>
            client?.name?.toLowerCase().includes(searchLower) ||
            client?.phone?.includes(searchTerm)
        );
    }, [clients, searchTerm]);

    // ✅ SAFETY GUARD: Prevent rendering if clients data is missing and not loading.
    if (!clients && !isLoading) return null;
>>>>>>> 004fe50229f5868424fc294ebbdf607ec730a724

    return (
        <div className="space-y-8 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="text-cyan-500" size={36} />
                        CRM <span className="text-gray-500 font-light">& Clientes</span>
                    </h1>
                    <p className="text-gray-400 mt-1 font-medium italic">Gerencie sua base de contatos e leads</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View Mode Toggle - Oculto se forçado */}
                    {!forcedView && (
                        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                            <button
                                onClick={() => handleViewModeChange('kanban')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    viewMode === 'kanban'
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "text-gray-500 hover:text-white"
                                )}
                            >
                                <LayoutGrid size={16} />
                                Kanban
                            </button>
                            <button
                                onClick={() => handleViewModeChange('list')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    viewMode === 'list'
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "text-gray-500 hover:text-white"
                                )}
                            >
                                <List size={16} />
                                Lista
                            </button>
                        </div>
                    )}

                    <button
                        onClick={handleNewClient}
                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95"
                    >
                        <Plus size={22} /> Novo Cliente
                    </button>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="max-w-md bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 focus-within:border-cyan-500/50 transition-all">
                <label htmlFor="crm-search" className="sr-only">Buscar por nome ou telefone</label>
                <Search className="text-gray-500" size={20} />
                <input
                    id="crm-search"
                    type="text"
                    placeholder="Buscar por nome ou telefone..."
                    className="bg-transparent border-none outline-none text-white w-full placeholder:text-gray-600 font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Conteúdo da Página */}
            {!isLoaded || isLoading ? (
                <div className="bg-white/5 border border-white/10 rounded-3xl p-20 flex flex-col items-center justify-center animate-pulse">
                    <Loader2 size={48} className="text-cyan-500 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Sincronizando clientes...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white/5 border border-white/10 border-dashed rounded-3xl p-20 text-center">
                    <AlertCircle className="mx-auto text-gray-700 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-gray-400">Nenhum cliente encontrado</h3>
                    <p className="text-gray-600 text-sm mt-2">Tente ajustar sua busca ou adicione um novo contato.</p>
                </div>
            ) : viewMode === 'kanban' ? (
                <KanbanBoard
                    clients={filtered}
                    onClientUpdate={() => loadClients(true)}
                    onClientClick={handleEditClient}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onClick={() => handleEditClient(client)}
                        />
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => loadClients(true)}
                client={selectedClient}
            />
        </div>
    );
}
import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Loader2, AlertCircle } from 'lucide-react';
import { clientService } from '../services/clientService';
import { ClientCard } from '../modules/crm/components/ClientCard';
import { ClientModal } from '../modules/crm/components/ClientModal';
import type { Client } from '../modules/crm/types';

export function CRMPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadClients = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await clientService.getAll();
            setClients((data || []) as Client[]);
            setError(null);
        } catch (err) {
            console.error('Erro ao carregar clientes:', err);
            setError('Não foi possível carregar os clientes. Verifique sua conexão ou chaves do Supabase.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadClients();
    }, [loadClients]);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm)
    );

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
                        onClick={() => loadClients()}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                    >
                        Tentar Novamente
                    </button>
                </div>
            ) : filteredClients.length === 0 ? (
                <div className="text-center py-20 bg-white/5 border border-white/10 border-dashed rounded-2xl">
                    <p className="text-gray-500 mb-4">Nenhum cliente encontrado.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                        + Cadastrar primeiro cliente
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <ClientCard key={client.id} client={client} />
                    ))}
                </div>
            )}

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={loadClients}
            />
        </div>
    );
}

import { ShieldCheck, MessageCircle, AlertCircle, Search, Filter } from 'lucide-react';

export default function AdminAuditPage() {
    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Auditoria do Sistema
                    </h1>
                    <p className="text-gray-400 mt-1">Monitoramento de integridade e logs de auditoria 🛡️</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl font-bold transition-all text-white">
                        <Search size={18} className="text-cyan-400" />
                        Buscar Logs
                    </button>
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-2.5 rounded-xl font-bold transition-all text-white">
                        <Filter size={18} className="text-purple-400" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center mb-4">
                        <ShieldCheck className="text-cyan-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Integridade RLS</h3>
                    <p className="text-gray-400 text-sm">Todas as políticas de Row Level Security estão ativas e funcionando corretamente.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
                        <MessageCircle className="text-purple-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Chat Auditoria</h3>
                    <p className="text-gray-400 text-sm">Módulo de monitoramento de conversas em fase de homologação.</p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                        <AlertCircle className="text-yellow-400" size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Alertas Criticos</h3>
                    <p className="text-gray-400 text-sm">Nenhum evento crítico detectado nas últimas 24 horas.</p>
                </div>
            </div>

            {/* Empty State / Coming Soon */}
            <div className="bg-[#111] border border-white/10 rounded-3xl p-20 text-center flex flex-col items-center justify-center border-dashed">
                <ShieldCheck size={48} className="text-gray-700 mb-6" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">Logs de Auditoria</h3>
                <p className="text-gray-600 max-w-sm">Esta área está sendo preparada para exibir o histórico completo de ações administrativas do sistema.</p>
            </div>
        </div>
    );
}

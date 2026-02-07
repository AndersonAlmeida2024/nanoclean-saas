import { MessageCircle, Instagram, Facebook, Phone, Calendar } from 'lucide-react';
import type { Client } from '../types';
import { cn } from '../../../utils/cn';

const SourceIcon = ({ source }: { source: Client['source'] }) => {
    switch (source) {
        case 'whatsapp': return <MessageCircle className="text-green-500" size={16} />;
        case 'instagram': return <Instagram className="text-pink-500" size={16} />;
        case 'facebook': return <Facebook className="text-blue-500" size={16} />;
        default: return <Phone className="text-gray-400" size={16} />;
    }
};

const StatusBadge = ({ status }: { status: Client['status'] }) => {
    const styles: Record<Client['status'], string> = {
        lead: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        active: "bg-green-500/10 text-green-500 border-green-500/20",
        inactive: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };

    const labels: Record<Client['status'], string> = {
        lead: "Novo Lead",
        active: "Cliente Ativo",
        inactive: "Inativo",
    };

    return (
        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border", styles[status])}>
            {labels[status]}
        </span>
    );
};

export function ClientCard({ client }: { client: Client }) {
    return (
        <div className="group bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {client.avatar ? (
                            <img src={client.avatar} alt={client.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center ring-2 ring-white/10">
                                <span className="text-lg font-bold text-white/50">{client.name[0]}</span>
                            </div>
                        )}
                        {(client.unreadMessages ?? 0) > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-[#1a1a1a]">
                                {client.unreadMessages}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg">{client.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <SourceIcon source={client.source} />
                            <span>{client.phone}</span>
                        </div>
                    </div>
                </div>

                <StatusBadge status={client.status} />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={14} />
                    <span>Último: {client.lastServiceDate || 'Nunca'}</span>
                </div>

                <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                    Ver Detalhes →
                </button>
            </div>
        </div>
    );
}

import { Phone, Calendar, User } from 'lucide-react';
import { memo } from 'react';

export const ClientCard = memo(({ client, onClick }: { client: any; onClick?: () => void }) => {
    return (
        <div
            onClick={onClick}
            className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 rounded-2xl p-5 transition-all cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xl uppercase border border-cyan-500/20">
                        {client.name?.[0] || <User size={20} />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg text-white group-hover:text-cyan-400 transition-colors">{client.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Phone size={14} />
                            <span>{client.phone}</span>
                        </div>
                    </div>
                </div>

                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${client.status === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                    {client.status || 'lead'}
                </span>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    <span>Último serviço: {client.lastServiceDate || 'Nenhum'}</span>
                </div>
                <span className="text-cyan-400 font-bold">Ver detalhes →</span>
            </div>
        </div>
    );
});
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { cn } from '../../../utils/cn';
import type { KanbanColumn as KanbanColumnType } from '../types/crm.types';

interface KanbanColumnProps {
    column: KanbanColumnType;
    clients: any[];
    onClientClick: (client: any) => void;
    isDragging: boolean;
}

export function KanbanColumn({ column, clients, onClientClick, isDragging }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "flex flex-col bg-white/[0.02] border border-white/10 rounded-2xl p-4 min-h-[600px] transition-all",
                isOver && "bg-white/[0.08] border-cyan-500/30 ring-2 ring-cyan-500/20"
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">{column.icon}</span>
                    <div>
                        <h3 className={cn("text-sm font-bold", column.color)}>
                            {column.title}
                        </h3>
                        <p className="text-xs text-gray-600 font-medium">
                            {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
                <SortableContext items={clients.map(c => c.id)} strategy={verticalListSortingStrategy}>
                    {clients.length === 0 ? (
                        <div className={cn(
                            "flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl transition-all",
                            isOver ? "border-cyan-500/30 bg-cyan-500/5" : "border-white/5"
                        )}>
                            <span className="text-4xl mb-2 opacity-20">{column.icon}</span>
                            <p className="text-xs text-gray-600 font-medium">
                                {isOver ? 'Solte aqui' : 'Nenhum cliente'}
                            </p>
                        </div>
                    ) : (
                        clients.map((client) => (
                            <KanbanCard
                                key={client.id}
                                client={client}
                                onClick={() => onClientClick(client)}
                                isDragging={false}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

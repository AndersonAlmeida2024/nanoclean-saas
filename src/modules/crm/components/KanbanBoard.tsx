import { useState } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KANBAN_COLUMNS, type LeadStage } from '../types/crm.types';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { clientService } from '../../../services/clientService';

interface KanbanBoardProps {
    clients: any[];
    onClientUpdate: () => void;
    onClientClick: (client: any) => void;
}

export function KanbanBoard({ clients, onClientUpdate, onClientClick }: KanbanBoardProps) {
    const [activeClient, setActiveClient] = useState<any | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Requires 8px movement to start drag (prevents accidental drags)
            },
        })
    );

    // Group clients by stage
    const clientsByStage = KANBAN_COLUMNS.reduce((acc, column) => {
        acc[column.id] = clients.filter(c => (c.stage || 'lead') === column.id);
        return acc;
    }, {} as Record<LeadStage, any[]>);

    const handleDragStart = (event: DragStartEvent) => {
        const client = clients.find(c => c.id === event.active.id);
        setActiveClient(client);
        setIsDragging(true);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setIsDragging(false);
        setActiveClient(null);

        if (!over) return;

        const clientId = active.id as string;
        let newStage = over.id as LeadStage;

        // If dropping over a card instead of a column, resolve the stage from that card
        const isColumn = KANBAN_COLUMNS.some(col => col.id === over.id);
        if (!isColumn) {
            const overClient = clients.find(c => c.id === over.id);
            if (overClient) {
                newStage = (overClient.stage || 'lead') as LeadStage;
            }
        }

        const client = clients.find(c => c.id === clientId);
        if (!client || client.stage === newStage) return;

        try {
            await clientService.updateStage(clientId, newStage);
            onClientUpdate();
        } catch (error) {
            console.error('Error updating client stage:', error);
            alert('Erro ao mover o cliente. Tente novamente.');
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 pb-8">
                {KANBAN_COLUMNS.map((column) => (
                    <SortableContext
                        key={column.id}
                        id={column.id}
                        items={clientsByStage[column.id].map(c => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <KanbanColumn
                            column={column}
                            clients={clientsByStage[column.id]}
                            onClientClick={onClientClick}
                            isDragging={isDragging}
                        />
                    </SortableContext>
                ))}
            </div>

            <DragOverlay>
                {activeClient ? (
                    <div className="rotate-3 scale-105 opacity-90">
                        <KanbanCard client={activeClient} onClick={() => { }} isDragging />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

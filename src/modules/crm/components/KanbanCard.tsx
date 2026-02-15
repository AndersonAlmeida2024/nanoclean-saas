import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../../utils/cn';
import { useRef } from 'react';

interface KanbanCardProps {
    client: any;
    onClick: () => void;
    isDragging: boolean;
}

export function KanbanCard({ client, onClick, isDragging }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: client.id });

    const dragStartPos = useRef<{ x: number; y: number } | null>(null);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        dragStartPos.current = { x: e.clientX, y: e.clientY };
    };

    const handleClick = (e: React.MouseEvent) => {
        // Only trigger onClick if the mouse hasn't moved much (not a drag)
        if (dragStartPos.current) {
            const deltaX = Math.abs(e.clientX - dragStartPos.current.x);
            const deltaY = Math.abs(e.clientY - dragStartPos.current.y);

            // If movement is less than 5px, consider it a click
            if (deltaX < 5 && deltaY < 5) {
                onClick();
            }
        }
        dragStartPos.current = null;
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onMouseDown={handleMouseDown}
            onClick={handleClick}
            className={cn(
                "bg-white/[0.03] border border-white/10 rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-white/[0.06] hover:border-white/20 group",
                isSortableDragging && "opacity-50 rotate-2 scale-105",
                isDragging && "shadow-2xl shadow-cyan-500/20"
            )}
        >
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                    {client.name}
                </h4>
            </div>
        </div>
    );
}

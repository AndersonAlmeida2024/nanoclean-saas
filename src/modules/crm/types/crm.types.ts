export type LeadStage = 'lead' | 'contacted' | 'quoted' | 'scheduled' | 'completed' | 'lost';

export interface KanbanColumn {
    id: LeadStage;
    title: string;
    color: string;
    bgColor: string;
    icon: string;
}

export const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'lead',
        title: 'Novos Leads',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10',
        icon: '👤'
    },
    {
        id: 'contacted',
        title: 'Contatados',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        icon: '📞'
    },
    {
        id: 'quoted',
        title: 'Orçamento Enviado',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        icon: '💰'
    },
    {
        id: 'scheduled',
        title: 'Agendado',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
        icon: '📅'
    },
    {
        id: 'completed',
        title: 'Finalizados',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        icon: '✅'
    },
    {
        id: 'lost',
        title: 'Perdidos',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        icon: '❌'
    }
];

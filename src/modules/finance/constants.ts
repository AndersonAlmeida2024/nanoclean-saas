import { ArrowUpRight, Fuel, Droplet, Megaphone, Wrench, Calculator, Tag, type LucideIcon } from 'lucide-react';
import type { TransactionCategory } from './types/finance.types';

export interface CategoryMetadata {
    id: TransactionCategory;
    label: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
}

export const TRANSACTION_CATEGORIES: CategoryMetadata[] = [
    {
        id: 'serviço',
        label: 'Serviço Prestado',
        icon: ArrowUpRight,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10'
    },
    {
        id: 'combustível',
        label: 'Combustível',
        icon: Fuel,
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10'
    },
    {
        id: 'equipamentos',
        label: 'Equipamentos',
        icon: Wrench,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10'
    },
    {
        id: 'produtos',
        label: 'Produtos Limpeza',
        icon: Droplet,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10'
    },
    {
        id: 'marketing',
        label: 'Marketing/Ads',
        icon: Megaphone,
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/10'
    },
    {
        id: 'contabilidade',
        label: 'Contabilidade',
        icon: Calculator,
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10'
    },
    {
        id: 'outros',
        label: 'Outros',
        icon: Tag,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10'
    },
];

export const getCategoryMetadata = (id: string): CategoryMetadata => {
    return TRANSACTION_CATEGORIES.find(c => c.id === id) || {
        id: 'outros',
        label: 'Outros',
        icon: Tag,
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/10'
    };
};

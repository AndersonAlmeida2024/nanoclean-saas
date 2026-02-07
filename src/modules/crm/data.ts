import type { Client } from './types';

export const MOCK_CLIENTS: Client[] = [
    {
        id: '1',
        name: 'Ana Silva',
        phone: '+55 11 99999-1234',
        source: 'instagram',
        status: 'lead',
        unreadMessages: 2,
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop'
    },
    {
        id: '2',
        name: 'Clínica Saúde Total',
        phone: '+55 11 3333-4444',
        source: 'whatsapp',
        status: 'active',
        lastServiceDate: '2023-12-10',
        unreadMessages: 0,
        avatar: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=150&h=150&fit=crop'
    },
    {
        id: '3',
        name: 'Carlos Oliveira',
        phone: '+55 21 98888-7777',
        source: 'facebook',
        status: 'inactive',
        lastServiceDate: '2023-05-20',
        unreadMessages: 0
    }
];

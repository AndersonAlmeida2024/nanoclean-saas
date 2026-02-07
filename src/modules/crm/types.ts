export type ClientStatus = 'lead' | 'active' | 'inactive';
export type ClientSource = 'whatsapp' | 'instagram' | 'facebook' | 'manual';

export interface Client {
    id: string;
    created_at?: string;
    name: string;
    phone: string;
    email?: string | null;
    address?: string | null;
    avatar?: string;
    status: ClientStatus;
    source: ClientSource;
    user_id?: string;
    company_id?: string;
    // Campos calculados/UI
    lastServiceDate?: string;
    unreadMessages?: number;
}

export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'lastServiceDate' | 'unreadMessages'>;

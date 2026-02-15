import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase: Faltam chaves de API. Backend rodando em modo limitado (ver .env.example)');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
);

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    company_id: string | null;
                    active_company_id: string | null;
                    role: string;
                    is_platform_admin: boolean;
                    created_at: string;
                };
                Update: Partial<Database['public']['Tables']['users']['Row']>;
            };
            companies: {
                Row: {
                    id: string;
                    name: string;
                    slug: string | null;
                    parent_company_id: string | null;
                    company_type: 'matrix' | 'branch';
                    status: 'active' | 'suspended' | 'trial_expired';
                    plan_id: string;
                    trial_ends_at: string | null;
                    created_at: string;
                };
            };
            company_memberships: {
                Row: {
                    id: string;
                    user_id: string;
                    company_id: string;
                    role: 'owner' | 'admin' | 'member';
                    is_active: boolean;
                    created_at: string;
                };
            };
            invites: {
                Row: {
                    id: string;
                    email: string;
                    company_id: string;
                    invited_by: string;
                    role: 'admin' | 'member';
                    token: string;
                    status: 'pending' | 'accepted' | 'expired';
                    created_at: string;
                    expires_at: string;
                };
            };
            clients: {
                Row: {
                    id: string;
                    created_at: string;
                    name: string;
                    phone: string;
                    email: string | null;
                    address: string | null;
                    status: 'lead' | 'active' | 'inactive';
                    source: 'whatsapp' | 'instagram' | 'facebook' | 'manual';
                    user_id: string;
                    company_id: string;
                };
                Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at'>;
            };
            appointments: {
                Row: {
                    id: string;
                    created_at: string;
                    client_id: string;
                    service_type: string;
                    scheduled_date: string;
                    scheduled_time: string;
                    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
                    address: string | null;
                    notes: string | null;
                    price: number;
                    user_id: string;
                    company_id: string;
                    public_token: string;
                    checked_in_at: string | null;
                };
                Insert: Omit<Database['public']['Tables']['appointments']['Row'], 'id' | 'created_at'>;
                Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
            };
            transactions: {
                Row: {
                    id: string;
                    created_at: string;
                    type: 'income' | 'expense';
                    amount: number;
                    description: string;
                    category: string;
                    appointment_id: string | null;
                    user_id: string;
                    company_id: string;
                };
            };
            service_inspections: {
                Row: {
                    id: string;
                    appointment_id: string;
                    company_id: string;
                    items: any;
                    photos_before: string[];
                    photos_after: string[];
                    customer_signature: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database['public']['Tables']['service_inspections']['Row'], 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Database['public']['Tables']['service_inspections']['Insert']>;
            };
        };
    };
}

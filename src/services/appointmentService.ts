import { supabase } from '../lib/supabase';
import type { Database } from '../lib/supabase';

export type Appointment = Database['public']['Tables']['appointments']['Row'] & {
    clients?: {
        name: string;
        phone: string;
        address?: string;
    } | null;
    technicians?: {
        name: string;
        color: string;
        phone: string;
    } | null;
    service_inspections?: {
        id: string;
    }[];
};

export type AppointmentInsert = Database['public']['Tables']['appointments']['Insert'];
export type AppointmentUpdate = Database['public']['Tables']['appointments']['Update'];

const APPOINTMENT_SELECT = `
    *,
    clients (
        name,
        phone,
        email,
        address
    ),
    technicians (
        name,
        color,
        phone
    ),
    service_inspections (
        id
    )
`;

export const appointmentService = {
    async getAll(companyId: string): Promise<Appointment[]> {
        if (!companyId) throw new Error('companyId is required');

        const { data, error } = await supabase
            .from('appointments')
            .select(APPOINTMENT_SELECT)
            .eq('company_id', companyId)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('[appointmentService.getAll] Error:', error);
            throw error;
        }
        return (data as any) || [];
    },

    async getByDate(date: string, companyId: string): Promise<Appointment[]> {
        if (!companyId) throw new Error('companyId is required');

        const { data, error } = await supabase
            .from('appointments')
            .select(APPOINTMENT_SELECT)
            .eq('scheduled_date', date)
            .eq('company_id', companyId)
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('[appointmentService.getByDate] Error:', { date, error });
            throw error;
        }
        return (data as any) || [];
    },

    async getUpcoming(companyId: string): Promise<Appointment[]> {
        if (!companyId) throw new Error('companyId is required');
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('appointments')
            .select(APPOINTMENT_SELECT)
            .eq('company_id', companyId)
            .gte('scheduled_date', today)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true });

        if (error) {
            console.error('[appointmentService.getUpcoming] Error:', error);
            throw error;
        }
        return (data as any) || [];
    },

    async create(appointment: AppointmentInsert) {
        // Log preventivo para debugar company_id ausente no front
        console.log('[appointmentService.create] Payload:', appointment);

        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
            .select(APPOINTMENT_SELECT)
            .single();

        if (error) {
            console.error('[appointmentService.create] Error:', { payload: appointment, error });
            throw error;
        }
        return data as Appointment;
    },

    async checkIn(id: string) {
        const { data, error } = await supabase
            .from('appointments')
            .update({ checked_in_at: new Date().toISOString(), status: 'in_progress' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[appointmentService.checkIn] Error:', error);
            throw error;
        }
        return data;
    },

    async update(id: string, updates: AppointmentUpdate) {
        console.log('[appointmentService.update] ID:', id, 'Payload:', updates);

        const { data, error } = await supabase
            .from('appointments')
            .update(updates)
            .eq('id', id)
            .select(APPOINTMENT_SELECT)
            .single();

        if (error) {
            console.error('[appointmentService.update] Error:', { id, updates, error });
            throw error;
        }

        // Se o agendamento foi concluído, criar transação financeira automaticamente
        if (updates.status === 'completed' && data) {
            await this.handleFinancialSync(data as Appointment);
        }

        return data as Appointment;
    },

    async delete(id: string) {
        console.log('[appointmentService.delete] ID:', id);

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[appointmentService.delete] Error:', { id, error });
            throw error;
        }

        // Se deletado, estornar transação financeira vinculada
        await supabase.from('transactions').delete().eq('appointment_id', id);
    },

    /**
     * Lógica auxiliar para sincronizar agendamentos concluídos com o financeiro.
     */
    async handleFinancialSync(appointment: Appointment) {
        try {
            const { data: existing } = await supabase
                .from('transactions')
                .select('id')
                .eq('appointment_id', appointment.id)
                .single();

            if (!existing) {
                await supabase.from('transactions').insert({
                    type: 'income',
                    amount: appointment.price,
                    description: `Agendamento: ${appointment.service_type}`,
                    category: 'Serviços',
                    appointment_id: appointment.id,
                    user_id: appointment.user_id,
                    company_id: appointment.company_id
                });
            }
        } catch (err) {
            console.error('[handleFinancialSync] Erro ao sincronizar financeiro:', err);
        }
    },

    async getByClient(clientId: string) {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                service_inspections (*)
            `)
            .eq('client_id', clientId)
            .order('scheduled_date', { ascending: false });

        if (error) {
            console.error('[appointmentService.getByClient] Error:', error);
            throw error;
        }

        return data;
    }
};

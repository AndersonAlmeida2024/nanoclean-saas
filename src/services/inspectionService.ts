import { supabase } from '../lib/supabase';

export interface ServiceInspection {
    id?: string;
    appointment_id: string;
    company_id: string;
    items: {
        item_type: 'sofa' | 'rug' | 'chair' | 'other';
        issues: string[];
    };
    photos_before: string[];
    photos_after: string[];
    customer_signature: string | null;
}

export const inspectionService = {
    async save(inspection: Omit<ServiceInspection, 'id'>) {
        const { data, error } = await supabase
            .from('service_inspections')
            .upsert([inspection])
            .select()
            .single();

        if (error) {
            console.error('Error saving inspection:', error);
            throw error;
        }

        return data;
    },

    async getByAppointment(appointmentId: string) {
        const { data, error } = await supabase
            .from('service_inspections')
            .select(`
                *,
                appointments (
                    public_token
                )
            `)
            .eq('appointment_id', appointmentId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching inspection:', error);
            throw error;
        }

        return data;
    },

    async uploadPhoto(file: File, fullPath: string) {
        const { error: uploadError } = await supabase.storage
            .from('inspections')
            .upload(fullPath, file);

        if (uploadError) {
            console.error('[inspectionService.uploadPhoto] Upload error:', uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('inspections')
            .getPublicUrl(fullPath);

        return publicUrl;
    },

    async getByClient(clientId: string) {
        // Busca inspeções vinculadas aos agendamentos do cliente
        const { data, error } = await supabase
            .from('service_inspections')
            .select(`
                *,
                appointments!inner (
                    client_id,
                    scheduled_date,
                    service_type,
                    public_token
                )
            `)
            .eq('appointments.client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[inspectionService.getByClient] Error:', error);
            throw error;
        }

        return data;
    }
};

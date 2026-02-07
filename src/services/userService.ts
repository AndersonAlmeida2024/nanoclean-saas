import { supabase } from '../lib/supabase';

export interface UserProfile {
    id: string;
    company_id: string | null;
    active_company_id: string | null;
    role: string;
    is_platform_admin: boolean;
}

export const userService = {
    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data as UserProfile;
    }
};

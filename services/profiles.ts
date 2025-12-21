import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

export const profileService = {
    async get(userId: string): Promise<UserProfile> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;

        // Map snake_case from DB to camelCase for TS
        return {
            id: data.id,
            email: data.email,
            role: data.role,
            subscriptionStatus: data.subscription_status,
            subscriptionEndDate: data.subscription_end_date,
            createdAt: data.created_at
        };
    },

    async update(id: string, updates: Partial<Omit<UserProfile, 'id' | 'email' | 'createdAt'>>): Promise<UserProfile> {
        // Map camelCase to snake_case for DB
        const dbUpdates: any = {};
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.subscriptionStatus) dbUpdates.subscription_status = updates.subscriptionStatus;
        if (updates.subscriptionEndDate !== undefined) dbUpdates.subscription_end_date = updates.subscriptionEndDate;

        const { data, error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            email: data.email,
            role: data.role,
            subscriptionStatus: data.subscription_status,
            subscriptionEndDate: data.subscription_end_date,
            createdAt: data.created_at
        };
    },

    async getAll(): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            id: item.id,
            email: item.email,
            role: item.role,
            subscriptionStatus: item.subscription_status,
            subscriptionEndDate: item.subscription_end_date,
            createdAt: item.created_at
        }));
    }
};

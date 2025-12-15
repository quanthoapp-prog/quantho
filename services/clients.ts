import { supabase } from '../lib/supabase';
import { Client } from '../types';

export const clientService = {
    async getAll() {
        const { data, error } = await supabase.from('clients').select('*');
        if (error) throw error;
        return data as Client[];
    },

    async add(client: Omit<Client, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            name: client.name,
            email: client.email,
            phone: client.phone
        };

        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (error) throw error;

        return data as Client;
    }
};

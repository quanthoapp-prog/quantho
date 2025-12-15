import { supabase } from '../lib/supabase';
import { AtecoCode } from '../types';

export const atecoService = {
    async getAll() {
        // Ateco codes are simple text ID primary keys in the DB schema provided in Step 77 (schema.sql)
        // But in App.tsx they are treating 'id' as text.
        const { data, error } = await supabase.from('ateco_codes').select('*');
        if (error) throw error;
        return data as AtecoCode[];
    },

    async add(ateco: AtecoCode, userId: string) {
        const payload = {
            id: ateco.id,
            user_id: userId,
            code: ateco.code,
            description: ateco.description,
            coefficient: ateco.coefficient
        };

        const { error } = await supabase.from('ateco_codes').insert(payload);
        if (error) throw error;
        return ateco;
    },

    async delete(id: string) {
        const { error } = await supabase.from('ateco_codes').delete().eq('id', id);
        if (error) throw error;
        return id;
    }
};

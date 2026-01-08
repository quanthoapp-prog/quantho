import { supabase } from '../lib/supabase';
import { Contract } from '../types';

export const contractService = {
    async getAll(userId: string): Promise<Contract[]> {
        const { data, error } = await supabase
            .from('contracts')
            .select('*')
            .eq('user_id', userId)
            .order('expected_date', { ascending: true });

        if (error) throw error;

        return (data || []).map(d => ({
            id: d.id,
            title: d.title,
            clientName: d.client_name,
            amount: d.amount,
            category: d.category || 'business',
            atecoCodeId: d.ateco_code_id,
            status: d.status,
            expectedDate: d.expected_date,
            notes: d.notes
        }));
    },

    async add(contract: Omit<Contract, 'id'>, userId: string): Promise<Contract> {
        const { data, error } = await supabase
            .from('contracts')
            .insert([{
                user_id: userId,
                title: contract.title,
                client_name: contract.clientName,
                amount: contract.amount,
                category: contract.category,
                ateco_code_id: contract.atecoCodeId,
                status: contract.status,
                expected_date: contract.expectedDate,
                notes: contract.notes
            }])
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            clientName: data.client_name,
            amount: data.amount,
            category: data.category || 'business',
            atecoCodeId: data.ateco_code_id,
            status: data.status,
            expectedDate: data.expected_date,
            notes: data.notes
        };
    },

    async update(contract: Contract): Promise<Contract> {
        const { data, error } = await supabase
            .from('contracts')
            .update({
                title: contract.title,
                client_name: contract.clientName,
                amount: contract.amount,
                category: contract.category,
                ateco_code_id: contract.atecoCodeId,
                status: contract.status,
                expected_date: contract.expectedDate,
                notes: contract.notes
            })
            .eq('id', contract.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            clientName: data.client_name,
            amount: data.amount,
            category: data.category || 'business',
            atecoCodeId: data.ateco_code_id,
            status: data.status,
            expectedDate: data.expected_date,
            notes: data.notes
        };
    },

    async delete(id: number): Promise<void> {
        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

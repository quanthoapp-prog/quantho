import { supabase } from '../lib/supabase';
import { Transaction } from '../types';

export const transactionService = {
    async getAll() {
        // We select * to match current logic.
        // In the future, we might want to order by date desc.
        const { data, error } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false }); // Added ordering for better UX

        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            date: t.date,
            type: t.type,
            category: t.category,
            amount: t.amount,
            description: t.description,
            client: t.client,
            tags: t.tags,
            atecoCodeId: t.ateco_code_id,
            status: t.status || 'active'
        })) as Transaction[];
    },

    async add(transaction: Omit<Transaction, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            date: transaction.date,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description,
            client: transaction.client || null,
            tags: transaction.tags || null,
            ateco_code_id: transaction.atecoCodeId || null,
            status: transaction.status || 'active'
        };

        const { data, error } = await supabase.from('transactions').insert(payload).select().single();
        if (error) throw error;

        return {
            id: data.id,
            date: data.date,
            type: data.type,
            category: data.category,
            amount: data.amount,
            description: data.description,
            client: data.client,
            tags: data.tags,
            atecoCodeId: data.ateco_code_id,
            status: data.status || 'active'
        } as Transaction;
    },

    async update(transaction: Transaction) {
        const payload = {
            date: transaction.date,
            type: transaction.type,
            category: transaction.category,
            amount: transaction.amount,
            description: transaction.description,
            client: transaction.client || null,
            tags: transaction.tags || null,
            ateco_code_id: transaction.atecoCodeId || null,
            status: transaction.status || 'active'
        };

        const { error } = await supabase.from('transactions').update(payload).eq('id', transaction.id);
        if (error) throw error;
        return transaction;
    },

    async delete(id: number) {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        return id;
    }
};

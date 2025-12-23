import { supabase } from '../lib/supabase';
import { Reminder } from '../types';

export const reminderService = {
    async getAll(userId: string) {
        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;

        return data.map((r: any) => ({
            id: r.id,
            title: r.title,
            date: r.date, // format is usually YYYY-MM-DD from DB date column
            type: r.type,
            isCompleted: r.is_completed
        })) as Reminder[];
    },

    async add(reminder: Omit<Reminder, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            title: reminder.title,
            date: reminder.date,
            type: reminder.type,
            is_completed: reminder.isCompleted
        };

        const { data, error } = await supabase
            .from('reminders')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            date: data.date,
            type: data.type,
            isCompleted: data.is_completed
        } as Reminder;
    },

    async update(reminder: Reminder) {
        const { data, error } = await supabase
            .from('reminders')
            .update({
                title: reminder.title,
                date: reminder.date,
                type: reminder.type,
                is_completed: reminder.isCompleted
            })
            .eq('id', reminder.id)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            title: data.title,
            date: data.date,
            type: data.type,
            isCompleted: data.is_completed
        } as Reminder;
    },

    async delete(id: number) {
        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

import { supabase } from '../lib/supabase';
import { Reminder } from '../types';

export const reminderService = {
    async getAll(userId: string) {
        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: true });

        if (error) {
            console.error("Error fetching reminders:", error);
            throw error;
        }

        return data.map((r: any) => ({
            id: r.id,
            title: r.title,
            date: r.date,
            time: r.time,
            type: r.type,
            isCompleted: r.is_completed
        })) as Reminder[];
    },

    async add(reminder: Omit<Reminder, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            title: reminder.title,
            date: reminder.date,
            time: reminder.time,
            type: reminder.type,
            is_completed: reminder.isCompleted
        };

        const { data, error } = await supabase
            .from('reminders')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("Error adding reminder:", error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            date: data.date,
            time: data.time,
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
                time: reminder.time,
                type: reminder.type,
                is_completed: reminder.isCompleted
            })
            .eq('id', reminder.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating reminder:", error);
            throw error;
        }

        return {
            id: data.id,
            title: data.title,
            date: data.date,
            time: data.time,
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

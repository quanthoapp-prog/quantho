import { supabase } from '../lib/supabase';
import { Notification } from '../types';

export const notificationService = {
    async getAll() {
        // Fetch up to 50 most recent notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error("Error loading notifications:", error);
            return []; // Always return array on error
        }

        return (data || []).map((n: any) => ({
            id: n.id,
            userId: n.user_id,
            title: n.title,
            message: n.message,
            type: n.type,
            isRead: n.is_read,
            createdAt: n.created_at,
            link: n.link
        })) as Notification[];
    },

    async markAsRead(id: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) throw error;
        return id;
    },

    async markAllAsRead(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    async delete(id: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return id;
    },

    // Function to create a notification (usually called by backend or trigger, but good to have)
    async add(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
        const payload = {
            user_id: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            link: notification.link,
            is_read: false
        };

        const { data, error } = await supabase
            .from('notifications')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: data.is_read,
            createdAt: data.created_at,
            link: data.link
        } as Notification;
    }
};

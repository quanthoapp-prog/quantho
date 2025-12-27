import { supabase } from '../lib/supabase';
import { Notification, Reminder, FixedDebt } from '../types';

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
            link: n.link,
            reminderId: n.reminder_id,
            deadlineId: n.deadline_id
        })) as Notification[];
    },

    async sync(reminders: Reminder[], fixedDebts: FixedDebt[], userId: string) {
        const { data: existingNotifs } = await supabase
            .from('notifications')
            .select('reminder_id, deadline_id')
            .eq('user_id', userId);

        const reminderIds = new Set((existingNotifs || []).map(n => n.reminder_id));
        const deadlineIds = new Set((existingNotifs || []).map(n => n.deadline_id));

        const today = new Date();
        const notificationThreshold = 3; // days
        const fiscalThreshold = 7; // days

        const newNotifs: any[] = [];

        // 1. Check Reminders
        reminders.forEach(r => {
            if (r.isCompleted) return;
            if (reminderIds.has(r.id)) return;

            const rDate = new Date(r.date);
            const diffDays = Math.ceil((rDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= notificationThreshold) {
                newNotifs.push({
                    user_id: userId,
                    title: 'Promemoria: ' + r.title,
                    message: `Hai una scadenza tra ${diffDays === 0 ? 'oggi' : diffDays + ' giorni'}${r.time ? ' alle ' + r.time : ''}.`,
                    type: diffDays === 0 ? 'warning' : 'info',
                    reminder_id: r.id,
                    link: '/calendar'
                });
            }
        });

        // 2. Check Fixed Debts
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            const deadlineId = `debt-${debt.id}-${today.getMonth()}-${today.getFullYear()}`;
            if (deadlineIds.has(deadlineId)) return;

            const debtDay = debt.debitDay;
            const targetDate = new Date(today.getFullYear(), today.getMonth(), debtDay);

            // If targetDate is already passed this month, don't notify unless it's today
            if (targetDate < today && targetDate.toDateString() !== today.toDateString()) return;

            const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays >= 0 && diffDays <= notificationThreshold) {
                newNotifs.push({
                    user_id: userId,
                    title: 'Rata in scadenza: ' + debt.name,
                    message: `Tra ${diffDays === 0 ? 'oggi' : diffDays + ' giorni'} scade la rata di ${debt.installment.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })}.`,
                    type: 'warning',
                    deadline_id: deadlineId,
                    link: '/fixed-debts'
                });
            }
        });

        // 3. Fiscal Deadlines (June 30 and Nov 30)
        const year = today.getFullYear();
        const fiscalDates = [
            { date: new Date(year, 5, 30), id: `fiscal-june-${year}`, label: 'Saldo + 1° Acconto Tasse' },
            { date: new Date(year, 10, 30), id: `fiscal-nov-${year}`, label: '2° Acconto Tasse' }
        ];

        fiscalDates.forEach(fd => {
            if (deadlineIds.has(fd.id)) return;

            const diffDays = Math.ceil((fd.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= fiscalThreshold) {
                newNotifs.push({
                    user_id: userId,
                    title: 'Scadenza Fiscale imminente',
                    message: `Il ${fd.date.toLocaleDateString('it-IT')} scade il ${fd.label}.`,
                    type: 'error',
                    deadline_id: fd.id,
                    link: '/calendar'
                });
            }
        });

        if (newNotifs.length > 0) {
            await supabase.from('notifications').insert(newNotifs);
            return true;
        }

        return false;
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

    async deleteAll(userId: string) {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;
    },

    // Function to create a notification (usually called by backend or trigger, but good to have)
    async add(notification: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
        const payload: any = {
            user_id: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            is_read: false
        };

        // Add optional fields only if they exist
        if (notification.link) {
            payload.link = notification.link;
        }
        if (notification.reminderId) {
            payload.reminder_id = notification.reminderId;
        }
        if (notification.deadlineId) {
            payload.deadline_id = notification.deadlineId;
        }

        const { data, error } = await supabase
            .from('notifications')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error('Error adding notification:', error);
            throw error;
        }

        return {
            id: data.id,
            userId: data.user_id,
            title: data.title,
            message: data.message,
            type: data.type,
            isRead: data.is_read,
            createdAt: data.created_at,
            link: data.link,
            reminderId: data.reminder_id,
            deadlineId: data.deadline_id
        } as Notification;
    }
};

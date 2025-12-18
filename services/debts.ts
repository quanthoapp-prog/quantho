import { supabase } from '../lib/supabase';
import { FixedDebt } from '../types';
import { transactionService } from './transactions';

export const debtsService = {
    async getAll() {
        const { data, error } = await supabase.from('fixed_debts').select('*');
        if (error) throw error;

        return data.map((d: any) => ({
            id: d.id,
            name: d.name,
            totalDue: d.total_due,
            installment: d.installment,
            debitDay: d.debit_day,
            isSuspended: d.is_suspended,
            type: d.type,
            startMonth: d.start_month,
            startYear: d.start_year,
            paymentMode: d.payment_mode || 'manual'
        })) as FixedDebt[];
    },

    async add(debt: Omit<FixedDebt, 'id'>, userId: string) {
        const payload = {
            user_id: userId,
            name: debt.name,
            total_due: debt.totalDue,
            installment: debt.installment,
            debit_day: debt.debitDay,
            is_suspended: debt.isSuspended,
            type: debt.type,
            start_month: debt.startMonth,
            start_year: debt.startYear,
            payment_mode: debt.paymentMode || 'manual'
        };

        const { data, error } = await supabase.from('fixed_debts').insert(payload).select().single();
        if (error) throw error;

        return {
            id: data.id,
            name: data.name,
            totalDue: data.total_due,
            installment: data.installment,
            debitDay: data.debit_day,
            isSuspended: data.is_suspended,
            type: data.type,
            startMonth: data.start_month,
            startYear: data.start_year,
            paymentMode: data.payment_mode || 'manual'
        } as FixedDebt;
    },

    async update(debt: FixedDebt) {
        const payload = {
            name: debt.name,
            total_due: debt.totalDue,
            installment: debt.installment,
            debit_day: debt.debitDay,
            is_suspended: debt.isSuspended,
            type: debt.type,
            start_month: debt.startMonth,
            start_year: debt.startYear,
            payment_mode: debt.paymentMode || 'manual'
        };

        const { error } = await supabase.from('fixed_debts').update(payload).eq('id', debt.id);
        if (error) throw error;
        return debt;
    },

    async delete(id: number) {
        const { error } = await supabase.from('fixed_debts').delete().eq('id', id);
        if (error) throw error;
        return id;
    },

    // Business Logic moved from App.tsx
    async checkAndCreateAutomaticPayments(debts: FixedDebt[], userId: string) {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        let createdCount = 0;

        for (const debt of debts) {
            // Skip if suspended or manual mode
            if (debt.isSuspended || debt.paymentMode !== 'auto') continue;

            // Skip if not yet started
            if (debt.startYear > currentYear ||
                (debt.startYear === currentYear && debt.startMonth > currentMonth)) {
                continue;
            }

            // Check if we should create payment for this month
            if (currentDay >= debt.debitDay) {
                // Check if payment already exists for this month
                const paymentTag = `debito-fisso-${debt.id}-${currentYear}-${currentMonth}`;

                const { data: existingPayments } = await supabase
                    .from('transactions')
                    .select('id')
                    .eq('user_id', userId)
                    .or(`tags.eq.${paymentTag},tags.ilike.%,${paymentTag},%,tags.ilike.${paymentTag},%,tags.ilike.%,${paymentTag}`)
                    .limit(1);

                // If no payment exists, create it
                if (!existingPayments || existingPayments.length === 0) {
                    const paymentDate = new Date(currentYear, currentMonth - 1, debt.debitDay);
                    const formattedDate = paymentDate.toISOString().split('T')[0];

                    await transactionService.add({
                        date: formattedDate,
                        type: 'expense',
                        category: 'personal',
                        amount: debt.installment,
                        description: `Rata ${debt.name} - ${currentMonth}/${currentYear}`,
                        client: '',
                        tags: paymentTag,
                        atecoCodeId: undefined, // using undefined to match optional property
                        status: 'active'
                    }, userId);
                    createdCount++;
                }
            }
        }
        return createdCount;
    }
};

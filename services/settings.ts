import { supabase } from '../lib/supabase';
import { UserSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

export const settingsService = {
    async get(userId?: string) {
        if (!userId) return DEFAULT_SETTINGS;

        const { data, error } = await supabase.from('user_settings').select('*').single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
            console.error('Error fetching settings:', error);
            return DEFAULT_SETTINGS;
        }

        if (!data) return DEFAULT_SETTINGS;

        // Map DB snake_case to camelCase
        return {
            openingHistory: data.opening_history || {},
            taxRateType: data.tax_rate_type || '5%',
            inpsType: data.inps_type || 'separata',
            artigianiFixedIncome: data.artigiani_fixed_income || 0,
            artigianiFixedCost: data.artigiani_fixed_cost || 0,
            artigianiExceedRate: data.artigiani_exceed_rate || 0,
            annualGoal: data.annual_goal || 0,
            expenseGoals: data.expense_goals || {},
            savedTags: data.saved_tags || [],
            manualSaldo: data.manual_saldo || 0,
            manualAccontiPaid: data.manual_acconti_paid || 0,
            lockedYears: data.locked_years || [],
            theme: data.theme || 'system'
        } as UserSettings;
    },

    async update(settings: UserSettings, userId: string) {
        const payload = {
            user_id: userId,
            opening_history: settings.openingHistory,
            tax_rate_type: settings.taxRateType,
            inps_type: settings.inpsType,
            artigiani_fixed_income: settings.artigianiFixedIncome,
            artigiani_fixed_cost: settings.artigianiFixedCost,
            artigiani_exceed_rate: settings.artigianiExceedRate,
            annual_goal: settings.annualGoal,
            expense_goals: settings.expenseGoals,
            manual_saldo: settings.manualSaldo,
            manual_acconti_paid: settings.manualAccontiPaid,
            locked_years: settings.lockedYears,
            saved_tags: settings.savedTags,
            theme: settings.theme
        };
        const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        return settings;
    }
};

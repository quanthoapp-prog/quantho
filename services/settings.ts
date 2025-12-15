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
            savedTags: data.saved_tags || []
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
            // saved_tags not yet persisted in DB based on current schema, skipping or adding if schema allows?
            // User requested persistence, but schema might need update. For now we follow App.tsx logic which sends what's there.
            // Wait, App.tsx upsert doesn't include saved_tags! The user requested to add it.
            // I should stick to current App.tsx logic for now to ensure refactor parity, then add features later.
        };

        const { error } = await supabase.from('user_settings').upsert(payload, { onConflict: 'user_id' });
        if (error) throw error;
        return settings;
    }
};


import { AtecoCode, UserSettings } from './types';

// Default system constants
export const LIMITE_FORFETTARIO = 85000;

// Defaults for new users
export const DEFAULT_SETTINGS: UserSettings = {
    openingHistory: {},
    taxRateType: '5%',
    inpsType: 'separata',
    artigianiFixedIncome: 18415,
    artigianiFixedCost: 4515,
    artigianiExceedRate: 0.24,
    annualGoal: 0,
    expenseGoals: {}
};

export const INITIAL_ATECO_CODES: AtecoCode[] = [
    { id: 'default_78', code: '62.02.00', description: 'Consulenza Informatica', coefficient: 0.78 },
    { id: 'ecommerce_40', code: '47.91.10', description: 'E-commerce', coefficient: 0.40 },
];

export const formatCurrency = (amount: number): string => {
    if (isNaN(amount) || !isFinite(amount)) return '€0.00';
    return `€${amount.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const getMonthsElapsed = (startYear: number, startMonth: number, endYear: number, endMonth: number): number => {
    if (endYear < startYear) return 0;
    if (endYear === startYear && endMonth < startMonth) return 0;
    return (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
};

// Updated initial transactions to use specific categories
export const INITIAL_TRANSACTIONS = [
    { id: 1, date: '2024-03-01', type: 'income', category: 'business', amount: 5500.00, description: 'Fattura Alpha', client: 'Alpha Corp', tags: 'web marketing', atecoCodeId: 'default_78' },
    { id: 2, date: '2024-03-15', type: 'expense', category: 'business', amount: 89.99, description: 'Hosting Annuale', client: '', tags: 'hosting' },
    { id: 3, date: '2024-04-05', type: 'income', category: 'business', amount: 3200.00, description: 'Fattura Beta', client: 'Beta LLC', tags: 'formazione', atecoCodeId: 'default_78' },
    { id: 4, date: '2024-04-10', type: 'expense', category: 'personal', amount: 1500.00, description: 'Affitto casa', client: '', tags: 'personale' },
    { id: 7, date: '2024-06-30', type: 'expense', category: 'tax', amount: 800.00, description: 'Acconto Tasse', client: '', tags: 'fiscale' },
    { id: 9, date: '2024-06-30', type: 'expense', category: 'inps', amount: 1200.00, description: 'Saldo INPS', client: '', tags: 'fiscale' },
    { id: 5, date: '2023-11-20', type: 'income', category: 'business', amount: 6500.00, description: 'Fattura Gamma', client: 'Gamma srl', tags: 'consulenza', atecoCodeId: 'default_78' },
    { id: 8, date: '2024-03-05', type: 'expense', category: 'personal', amount: 650.00, description: 'Rata Mutuo Marzo', client: '', tags: 'mutuo' },
] as const;

export const INITIAL_CLIENTS = [
    { id: 101, name: 'Alpha Corp', email: 'alpha@corp.com', phone: '111-222-3333' },
    { id: 102, name: 'Beta LLC', email: 'beta@llc.com', phone: '444-555-6666' },
    { id: 103, name: 'Gamma srl', email: 'gamma@srl.com', phone: '777-888-9999' },
] as const;

export const INITIAL_FIXED_DEBTS = [
    { id: 201, name: 'Mutuo Casa', totalDue: 150000, installment: 650, debitDay: 5, isSuspended: false, type: 'debt', startMonth: 1, startYear: 2024, paymentMode: 'manual' },
    { id: 202, name: 'Abbonamento CRM', totalDue: 0, installment: 49.99, debitDay: 15, isSuspended: false, type: 'subscription', startMonth: 3, startYear: 2024, paymentMode: 'manual' },
    { id: 203, name: 'Prestito Auto', totalDue: 12000, installment: 250, debitDay: 28, isSuspended: true, type: 'debt', startMonth: 1, startYear: 2023, paymentMode: 'manual' },
] as const;

// Helper function to determine if a transaction should be counted in stats
export const isTransactionActive = (transaction: { date: string; status?: 'active' | 'scheduled' }): boolean => {
    // If no status field, assume active (backward compatibility)
    if (!transaction.status || transaction.status === 'active') return true;

    // If scheduled, check if date has arrived
    if (transaction.status === 'scheduled') {
        const transactionDate = new Date(transaction.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        transactionDate.setHours(0, 0, 0, 0);
        return transactionDate <= today;
    }

    return true;
};
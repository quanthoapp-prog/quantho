import { describe, it, expect } from 'vitest';
import { calculateFiscalStats } from './fiscalLogic';
import { UserSettings, AtecoCode, Transaction, FixedDebt } from '../types';

describe('calculateFiscalStats', () => {
    const mockAtecoCodes: AtecoCode[] = [
        { id: '1', code: '62.01', description: 'Software', coefficient: 0.67 }
    ];

    const mockSettings: UserSettings = {
        taxRateType: '5%',
        inpsType: 'separata',
        annualGoal: 100000,
        openingHistory: {},
        manualSaldo: 0,
        manualAccontiPaid: 0,
        artigianiFixedCost: 4515,
        artigianiFixedIncome: 18415,
        artigianiExceedRate: 0.24,
        expenseGoals: {}
    };

    it('calculates gross income correctly', () => {
        const transactions: Transaction[] = [
            { id: 1, date: '2024-01-01', amount: 1000, type: 'income', category: 'business', description: 'Test', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' },
            { id: 2, date: '2024-02-01', amount: 2000, type: 'income', category: 'business', description: 'Test', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' }
        ];

        const stats = calculateFiscalStats({
            transactions,
            fixedDebts: [],
            settings: mockSettings,
            currentYear: 2024,
            atecoCodes: mockAtecoCodes
        });

        expect(stats.income).toBe(3000);
    });

    it('calculates flat tax correctly (5% on 67% of income)', () => {
        const transactions: Transaction[] = [
            { id: 1, date: '2024-01-01', amount: 10000, type: 'income', category: 'business', description: 'Test', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' }
        ];

        const stats = calculateFiscalStats({
            transactions,
            fixedDebts: [],
            settings: mockSettings,
            currentYear: 2024,
            atecoCodes: mockAtecoCodes
        });

        expect(stats.flatTax).toBe(335);
    });

    it('deducts INPS paid from taxable income', () => {
        const transactions: Transaction[] = [
            { id: 1, date: '2024-01-01', amount: 10000, type: 'income', category: 'business', description: 'Sale', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' },
            { id: 2, date: '2024-01-15', amount: 1000, type: 'expense', category: 'inps', description: 'INPS contribution', status: 'active', client: 'System', tags: '' }
        ];

        const stats = calculateFiscalStats({
            transactions,
            fixedDebts: [],
            settings: mockSettings,
            currentYear: 2024,
            atecoCodes: mockAtecoCodes
        });

        expect(stats.flatTax).toBe(285);
    });

    it('calculates INPS estimate for Gestione Separata (~26.23%)', () => {
        const transactions: Transaction[] = [
            { id: 1, date: '2024-01-01', amount: 10000, type: 'income', category: 'business', description: 'Sale', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' }
        ];

        const stats = calculateFiscalStats({
            transactions,
            fixedDebts: [],
            settings: mockSettings,
            currentYear: 2024,
            atecoCodes: mockAtecoCodes
        });

        expect(stats.inps).toBeCloseTo(1757.41, 2);
    });

    it('calculates net available income correctly', () => {
        const transactions: Transaction[] = [
            { id: 1, date: '2024-01-01', amount: 10000, type: 'income', category: 'business', description: 'Sale', status: 'active', client: 'C1', tags: '', atecoCodeId: '1' }
        ];
        const fixedDebts: FixedDebt[] = [
            { id: 1, name: 'Office', installment: 500, startMonth: 1, startYear: 2024, type: 'debt', isSuspended: false, paymentMode: 'manual', debitDay: 1, totalDue: 6000 }
        ];

        const stats = calculateFiscalStats({
            transactions,
            fixedDebts,
            settings: mockSettings,
            currentYear: 2024,
            atecoCodes: mockAtecoCodes
        });

        expect(stats.netAvailableIncome).toBeCloseTo(1907.59, 2);
    });
});

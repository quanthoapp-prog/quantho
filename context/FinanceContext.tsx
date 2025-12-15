import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Transaction, Client, FixedDebt, UserSettings, AtecoCode, Stats } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { transactionService } from '../services/transactions';
import { clientService } from '../services/clients';
import { settingsService } from '../services/settings';
import { debtsService } from '../services/debts';
import { atecoService } from '../services/ateco';
import { useTaxCalculations } from '../hooks/useTaxCalculations';
import { supabase } from '../lib/supabase';

interface FinanceContextType {
    // Data
    transactions: Transaction[];
    clients: Client[];
    fixedDebts: FixedDebt[];
    settings: UserSettings;
    atecoCodes: AtecoCode[];
    stats: Stats;
    currentYear: number;
    availableYears: number[];
    isLoading: boolean;
    userEmail: string | null;

    // Actions
    setCurrentYear: (year: number) => void;
    addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
    updateTransaction: (t: Transaction) => Promise<void>;
    deleteTransaction: (id: number) => Promise<void>;
    addClient: (c: Omit<Client, 'id'>) => Promise<void>;
    addFixedDebt: (d: Omit<FixedDebt, 'id'>) => Promise<void>;
    updateFixedDebt: (d: FixedDebt) => Promise<void>;
    deleteFixedDebt: (id: number) => Promise<void>;
    registerDebtPayment: (debtId: number) => Promise<void>;
    updateSettings: (s: UserSettings) => Promise<void>;
    addAtecoCode: (a: AtecoCode) => Promise<void>;
    deleteAtecoCode: (id: string) => Promise<void>;
    exportData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = () => {
    const context = useContext(FinanceContext);
    if (!context) {
        throw new Error('useFinance must be used within a FinanceProvider');
    }
    return context;
};

interface FinanceProviderProps {
    children: ReactNode;
    userId: string | null;
    userEmail: string | null;
}

export const FinanceProvider: React.FC<FinanceProviderProps> = ({ children, userId, userEmail }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [fixedDebts, setFixedDebts] = useState<FixedDebt[]>([]);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [atecoCodes, setAtecoCodes] = useState<AtecoCode[]>([]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [isLoading, setIsLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        if (!userId) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [txs, cls, dbs, sts, atc] = await Promise.all([
                    transactionService.getAll(),
                    clientService.getAll(),
                    debtsService.getAll(),
                    settingsService.get(userId),
                    atecoService.getAll()
                ]);

                setTransactions(txs);
                setClients(cls);
                setFixedDebts(dbs);
                setSettings(sts);
                setAtecoCodes(atc);

                // Run automated checks after load
                const newPaymentsCount = await debtsService.checkAndCreateAutomaticPayments(dbs, userId);
                if (newPaymentsCount > 0) {
                    // Refetch transactions if new ones were created
                    const updatedTxs = await transactionService.getAll();
                    setTransactions(updatedTxs);
                }
            } catch (error) {
                console.error("Failed to load initial data", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [userId]);

    // Derived State
    const availableYears = React.useMemo(() => {
        const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
        const currentYearVal = new Date().getFullYear();
        years.add(currentYearVal);
        years.add(currentYearVal - 1);
        return Array.from(years).sort((a: number, b: number) => b - a);
    }, [transactions]);

    const stats = useTaxCalculations({
        transactions,
        fixedDebts,
        settings,
        currentYear,
        atecoCodes
    });

    // Actions
    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        if (!userId) return;
        try {
            const newTx = await transactionService.add(t, userId);
            setTransactions(prev => [...prev, newTx]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const updateTransaction = async (t: Transaction) => {
        try {
            const updated = await transactionService.update(t);
            setTransactions(prev => prev.map(item => item.id === updated.id ? updated : item));
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const deleteTransaction = async (id: number) => {
        try {
            await transactionService.delete(id);
            setTransactions(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const addClient = async (c: Omit<Client, 'id'>) => {
        if (!userId) return;
        try {
            const newClient = await clientService.add(c, userId);
            setClients(prev => [...prev, newClient]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const addFixedDebt = async (d: Omit<FixedDebt, 'id'>) => {
        if (!userId) return;
        try {
            const newDebt = await debtsService.add(d, userId);
            setFixedDebts(prev => [...prev, newDebt]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const updateFixedDebt = async (d: FixedDebt) => {
        try {
            const updated = await debtsService.update(d);
            setFixedDebts(prev => prev.map(item => item.id === updated.id ? updated : item));
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const deleteFixedDebt = async (id: number) => {
        try {
            await debtsService.delete(id);
            setFixedDebts(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const registerDebtPayment = async (debtId: number) => {
        if (!userId) return;
        const debt = fixedDebts.find(d => d.id === debtId);
        if (!debt) return;

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYearVal = today.getFullYear();
        const paymentTag = `debito-fisso-${debt.id}-${currentYearVal}-${currentMonth}`;

        try {
            const newTx = await transactionService.add({
                date: today.toISOString().split('T')[0],
                type: 'expense',
                category: 'personal',
                amount: debt.installment,
                description: `Rata ${debt.name} - ${currentMonth}/${currentYearVal}`,
                client: '',
                tags: paymentTag,
                atecoCodeId: undefined,
                status: 'active'
            }, userId);
            setTransactions(prev => [...prev, newTx]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const updateSettingsAction = async (newSettings: UserSettings) => {
        if (!userId) return;
        // Optimistic update
        setSettings(newSettings);
        try {
            await settingsService.update(newSettings, userId);
        } catch (e) {
            console.error("Failed to sync settings", e);
            // Could revert here if needed
        }
    };

    const addAtecoCode = async (ateco: AtecoCode) => {
        if (!userId) return;
        try {
            await atecoService.add(ateco, userId);
            setAtecoCodes(prev => [...prev, ateco]);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const deleteAtecoCode = async (id: string) => {
        try {
            await atecoService.delete(id);
            setAtecoCodes(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const exportData = () => {
        const data = {
            exportDate: new Date().toISOString(),
            userEmail,
            settings,
            transactions,
            clients,
            fixedDebts,
            atecoCodes
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `quantho_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const value = {
        transactions,
        clients,
        fixedDebts,
        settings,
        atecoCodes,
        stats,
        currentYear,
        availableYears,
        isLoading,
        userEmail,
        setCurrentYear,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addClient,
        addFixedDebt,
        updateFixedDebt,
        deleteFixedDebt,
        registerDebtPayment,
        updateSettings: updateSettingsAction,
        addAtecoCode,
        deleteAtecoCode,
        exportData
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

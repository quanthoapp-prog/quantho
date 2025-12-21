import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Transaction, Client, FixedDebt, UserSettings, AtecoCode, Stats, UserProfile } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { transactionService } from '../services/transactions';
import { clientService } from '../services/clients';
import { settingsService } from '../services/settings';
import { debtsService } from '../services/debts';
import { atecoService } from '../services/ateco';
import { profileService } from '../services/profiles';
import { useTaxCalculations } from '../hooks/useTaxCalculations';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

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
    profile: UserProfile | null;

    // Admin Data
    allProfiles: UserProfile[];

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
    deleteAccount: () => Promise<void>;
    updateProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
    fetchAllProfiles: () => Promise<void>;
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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
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
                // Load profile first to ensure permissions are set correctly
                try {
                    const pro = await profileService.get(userId);
                    if (pro) {
                        setProfile(pro);
                    } else {
                        setProfile({
                            id: userId,
                            email: userEmail || '',
                            role: 'user',
                            subscriptionStatus: 'trial',
                            subscriptionEndDate: null,
                            createdAt: new Date().toISOString()
                        });
                    }
                } catch (pe) {
                    console.error("FinanceContext: Critical error loading profile:", pe);
                }

                // Load other data
                const [txs, cls, dbs, sts, atc] = await Promise.all([
                    transactionService.getAll().catch(e => { console.error("txs error", e); return []; }),
                    clientService.getAll().catch(e => { console.error("clients error", e); return []; }),
                    debtsService.getAll().catch(e => { console.error("debts error", e); return []; }),
                    settingsService.get(userId).catch(e => { console.error("settings error", e); return DEFAULT_SETTINGS; }),
                    atecoService.getAll().catch(e => { console.error("ateco error", e); return []; })
                ]);

                setTransactions(txs);
                setClients(cls);
                setFixedDebts(dbs);
                setSettings(sts);
                setAtecoCodes(atc);

                // Run automated checks after load
                const newPaymentsCount = await debtsService.checkAndCreateAutomaticPayments(dbs, userId);
                if (newPaymentsCount > 0) {
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
        const promise = transactionService.add(t, userId)
            .then(newTx => setTransactions(prev => [...prev, newTx]));

        toast.promise(promise, {
            loading: 'Aggiunta transazione...',
            success: 'Transazione aggiunta!',
            error: 'Errore durante l\'aggiunta'
        });
        await promise;
    };

    const updateTransaction = async (t: Transaction) => {
        const promise = transactionService.update(t)
            .then(updated => setTransactions(prev => prev.map(item => item.id === updated.id ? updated : item)));

        toast.promise(promise, {
            loading: 'Aggiornamento...',
            success: 'Transazione aggiornata!',
            error: 'Errore durante l\'aggiornamento'
        });
        await promise;
    };

    const deleteTransaction = async (id: number) => {
        const promise = transactionService.delete(id)
            .then(() => setTransactions(prev => prev.filter(item => item.id !== id)));

        toast.promise(promise, {
            loading: 'Eliminazione...',
            success: 'Transazione eliminata!',
            error: 'Errore durante l\'eliminazione'
        });
        await promise;
    };

    const addClient = async (c: Omit<Client, 'id'>) => {
        if (!userId) return;
        const promise = clientService.add(c, userId)
            .then(newClient => setClients(prev => [...prev, newClient]));

        toast.promise(promise, {
            loading: 'Aggiunta cliente...',
            success: 'Cliente aggiunto!',
            error: 'Errore durante l\'aggiunta del cliente'
        });
        await promise;
    };

    const addFixedDebt = async (d: Omit<FixedDebt, 'id'>) => {
        if (!userId) return;
        const promise = debtsService.add(d, userId)
            .then(newDebt => setFixedDebts(prev => [...prev, newDebt]));

        toast.promise(promise, {
            loading: 'Salvataggio...',
            success: 'Debito fisso salvato!',
            error: 'Errore durante il salvataggio'
        });
        await promise;
    };

    const updateFixedDebt = async (d: FixedDebt) => {
        const promise = debtsService.update(d)
            .then(updated => setFixedDebts(prev => prev.map(item => item.id === updated.id ? updated : item)));

        toast.promise(promise, {
            loading: 'Aggiornamento...',
            success: 'Debito aggiornato!',
            error: 'Errore durante l\'aggiornamento'
        });
        await promise;
    };

    const deleteFixedDebt = async (id: number) => {
        const promise = debtsService.delete(id)
            .then(() => setFixedDebts(prev => prev.filter(item => item.id !== id)));

        toast.promise(promise, {
            loading: 'Eliminazione...',
            success: 'Debito eliminato con successo!',
            error: 'Errore durante l\'eliminazione'
        });
        await promise;
    };

    const registerDebtPayment = async (debtId: number) => {
        if (!userId) return;
        const debt = fixedDebts.find(d => d.id === debtId);
        if (!debt) return;

        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYearVal = today.getFullYear();
        const paymentTag = `debito-fisso-${debt.id}-${currentYearVal}-${currentMonth}`;

        const promise = transactionService.add({
            date: today.toISOString().split('T')[0],
            type: 'expense',
            category: 'personal',
            amount: debt.installment,
            description: `Rata ${debt.name} - ${currentMonth}/${currentYearVal}`,
            client: '',
            tags: paymentTag,
            atecoCodeId: undefined,
            status: 'active'
        }, userId).then(newTx => setTransactions(prev => [...prev, newTx]));

        toast.promise(promise, {
            loading: 'Registrazione pagamento...',
            success: 'Pagamento registrato!',
            error: 'Errore durante la registrazione'
        });
        await promise;
    };

    const updateSettingsAction = async (newSettings: UserSettings) => {
        if (!userId) return;
        // Optimistic update
        setSettings(newSettings);
        const promise = settingsService.update(newSettings, userId);

        toast.promise(promise, {
            loading: 'Salvataggio impostazioni...',
            success: 'Impostazioni salvate!',
            error: 'Errore nel salvataggio remoto'
        });
        await promise;
    };

    const addAtecoCode = async (ateco: AtecoCode) => {
        if (!userId) return;
        const promise = atecoService.add(ateco, userId)
            .then(() => setAtecoCodes(prev => [...prev, ateco]));

        toast.promise(promise, {
            loading: 'Aggiunta codice ATECO...',
            success: 'Codice ATECO aggiunto!',
            error: 'Errore durante l\'aggiunta'
        });
        await promise;
    };

    const deleteAtecoCode = async (id: string) => {
        const promise = atecoService.delete(id)
            .then(() => setAtecoCodes(prev => prev.filter(item => item.id !== id)));

        toast.promise(promise, {
            loading: 'Eliminazione...',
            success: 'Codice eliminato!',
            error: 'Errore durante l\'eliminazione'
        });
        await promise;
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

    const deleteAccount = async () => {
        if (!userId) return;

        const promise = (async () => {
            // 1. Delete all transactions
            const { error: txError } = await supabase.from('transactions').delete().eq('user_id', userId);
            if (txError) throw txError;

            // 2. Delete all clients
            const { error: clError } = await supabase.from('clients').delete().eq('user_id', userId);
            if (clError) throw clError;

            // 3. Delete all fixed debts
            const { error: dbError } = await supabase.from('fixed_debts').delete().eq('user_id', userId);
            if (dbError) throw dbError;

            // 4. Delete user settings
            const { error: stError } = await supabase.from('user_settings').delete().eq('user_id', userId);
            if (stError) throw stError;

            // 5. Sign out
            const { error: authError } = await supabase.auth.signOut();
            if (authError) throw authError;
        })();

        toast.promise(promise, {
            loading: 'Eliminazione account in corso...',
            success: 'Account eliminato correttamente',
            error: 'Errore durante l\'eliminazione'
        });
        await promise;
    };

    const fetchAllProfiles = async () => {
        if (profile?.role !== 'admin') return;
        try {
            const data = await profileService.getAll();
            setAllProfiles(data);
        } catch (error) {
            console.error("Failed to fetch all profiles", error);
        }
    };

    const updateProfile = async (id: string, updates: Partial<UserProfile>) => {
        if (profile?.role !== 'admin') return;
        const promise = profileService.update(id, updates)
            .then(updated => {
                setAllProfiles(prev => prev.map(p => p.id === id ? updated : p));
                if (id === userId) setProfile(updated);
            });

        toast.promise(promise, {
            loading: 'Aggiornamento profilo...',
            success: 'Profilo aggiornato!',
            error: 'Errore durante l\'aggiornamento'
        });
        await promise;
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
        exportData,
        deleteAccount,
        profile,
        allProfiles,
        fetchAllProfiles,
        updateProfile
    };

    return (
        <FinanceContext.Provider value={value}>
            {children}
        </FinanceContext.Provider>
    );
};

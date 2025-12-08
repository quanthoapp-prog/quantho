import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { ChevronsRight, Menu, X, FileText, TrendingUp, Banknote, Users, Settings, LogOut, Target, Wallet } from 'lucide-react';
import DashboardView from './components/DashboardView';
import TransactionsView from './components/TransactionsView';
import ClientsView from './components/ClientsView';
import FixedDebtsView from './components/FixedDebtsView';
import SettingsView from './components/SettingsView';
import AuthView from './components/AuthView';
import GoalsView from './components/GoalsView';
import { Transaction, Client, FixedDebt, TabId, Stats, UserSettings, AtecoCode } from './types';
import { LIMITE_FORFETTARIO, INITIAL_TRANSACTIONS, INITIAL_CLIENTS, INITIAL_FIXED_DEBTS, DEFAULT_SETTINGS, INITIAL_ATECO_CODES } from './constants';

const App: React.FC = () => {
    // Auth State
    const [user, setUser] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // Auth Listener
    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user?.email ?? null);
            setUserId(session?.user?.id ?? null);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user?.email ?? null);
            setUserId(session?.user?.id ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [activeTab, setActiveTabState] = useState<TabId>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // HISTORY API HANDLER FOR MOBILE BACK GESTURE
    // 1. Listen for popstate (Back button)
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            if (event.state && event.state.tab) {
                setActiveTabState(event.state.tab);
            } else {
                // If no state (e.g. initial load or back to start), default to dashboard
                setActiveTabState('dashboard');
            }
        };

        window.addEventListener('popstate', handlePopState);

        // Replace initial state so we have a base to go back to if needed, 
        // or just ensure current state is marked.
        window.history.replaceState({ tab: 'dashboard' }, '');

        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    // 2. Custom setter that pushes history
    const setActiveTab = (tab: TabId) => {
        setActiveTabState(tab);
        // Only push if different from current state to avoid duplicate stacking
        if (history.state?.tab !== tab) {
            window.history.pushState({ tab }, '');
        }
    };

    // State to trigger "Add Transaction" modal from Dashboard shortcut
    const [startAddingTransaction, setStartAddingTransaction] = useState(false);

    // Application State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [fixedDebts, setFixedDebts] = useState<FixedDebt[]>([]);
    const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
    const [atecoCodes, setAtecoCodes] = useState<AtecoCode[]>([]);

    // Load Data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const [
                { data: transactionsData },
                { data: clientsData },
                { data: fixedDebtsData },
                { data: settingsData },
                { data: atecoCodesData }
            ] = await Promise.all([
                supabase.from('transactions').select('*'),
                supabase.from('clients').select('*'),
                supabase.from('fixed_debts').select('*'),
                supabase.from('user_settings').select('*').single(),
                supabase.from('ateco_codes').select('*')
            ]);

            if (transactionsData) {
                const mappedTransactions: Transaction[] = transactionsData.map((t: any) => ({
                    id: t.id,
                    date: t.date,
                    type: t.type,
                    category: t.category,
                    amount: t.amount,
                    description: t.description,
                    client: t.client,
                    tags: t.tags,
                    atecoCodeId: t.ateco_code_id
                }));
                setTransactions(mappedTransactions);
            }

            if (clientsData) {
                setClients(clientsData as Client[]);
            }

            if (fixedDebtsData) {
                const mappedDebts: FixedDebt[] = fixedDebtsData.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    totalDue: d.total_due,
                    installment: d.installment,
                    debitDay: d.debit_day,
                    isSuspended: d.is_suspended,
                    type: d.type,
                    startMonth: d.start_month,
                    startYear: d.start_year
                }));
                setFixedDebts(mappedDebts);
            }

            if (settingsData) {
                const s: any = settingsData;
                const mappedSettings: UserSettings = {
                    openingHistory: s.opening_history || {},
                    taxRateType: s.tax_rate_type || '5%',
                    inpsType: s.inps_type || 'separata',
                    artigianiFixedIncome: s.artigiani_fixed_income || 0,
                    artigianiFixedCost: s.artigiani_fixed_cost || 0,
                    artigianiExceedRate: s.artigiani_exceed_rate || 0,
                    annualGoal: s.annual_goal || 0,
                    expenseGoals: s.expense_goals || {}
                };
                setSettings(mappedSettings);
            }

            if (atecoCodesData) {
                // ateco_codes keys match exactly (code, description, coefficient) assuming 'id' is standard.
                // Checking schema: id text primary key.
                // types: id string.
                // No mapping needed beyond standard props if names match.
                // Checking schema again: id, user_id, code, description, coefficient.
                // Types: id, code, description, coefficient.
                // Matches.
                setAtecoCodes(atecoCodesData as AtecoCode[]);
            }
        };

        fetchData();
    }, [user]);

    // Helpers to manage data
    const addTransaction = async (t: Omit<Transaction, 'id'>) => {
        const payload = {
            user_id: userId, // Ensure userId is attached
            date: t.date,
            type: t.type,
            category: t.category,
            amount: t.amount,
            description: t.description,
            client: t.client || null,
            tags: t.tags || null,
            ateco_code_id: t.atecoCodeId || null
        };

        const { data, error } = await supabase.from('transactions').insert(payload).select().single();

        if (data && !error) {
            // Map back to camelCase
            const newTransaction: Transaction = {
                id: data.id,
                date: data.date,
                type: data.type,
                category: data.category,
                amount: data.amount,
                description: data.description,
                client: data.client, // Stored as string in schema currently
                tags: data.tags,
                atecoCodeId: data.ateco_code_id
            };
            setTransactions([...transactions, newTransaction]);
        } else {
            console.error('Error adding transaction:', error);
        }
    };

    const updateTransaction = async (updatedTransaction: Transaction) => {
        const payload = {
            date: updatedTransaction.date,
            type: updatedTransaction.type,
            category: updatedTransaction.category,
            amount: updatedTransaction.amount,
            description: updatedTransaction.description,
            client: updatedTransaction.client || null,
            tags: updatedTransaction.tags || null,
            ateco_code_id: updatedTransaction.atecoCodeId || null
        };

        const { error } = await supabase.from('transactions').update(payload).eq('id', updatedTransaction.id);
        if (!error) {
            setTransactions(transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
        } else {
            console.error('Error updating transaction:', error);
        }
    };

    const deleteTransaction = async (id: number) => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (!error) {
            setTransactions(transactions.filter(t => t.id !== id));
        }
    };

    const addClient = async (c: Omit<Client, 'id'>) => {
        // Clients table is simple: name, email, phone. Matches frontend so spread might work but safer to be explicit.
        const payload = {
            user_id: userId,
            name: c.name,
            email: c.email,
            phone: c.phone
        };
        const { data, error } = await supabase.from('clients').insert(payload).select().single();
        if (data && !error) {
            setClients([...clients, data as any]);
        }
    };

    const addAtecoCode = async (ateco: AtecoCode) => {
        const payload = {
            id: ateco.id,
            user_id: userId,
            code: ateco.code,
            description: ateco.description,
            coefficient: ateco.coefficient
        };

        const { error } = await supabase.from('ateco_codes').insert(payload);
        if (!error) {
            setAtecoCodes([...atecoCodes, ateco]);
        } else {
            console.error('Error adding ateco:', error);
        }
    };

    const deleteAtecoCode = async (id: string) => {
        const { error } = await supabase.from('ateco_codes').delete().eq('id', id);
        if (!error) {
            setAtecoCodes(atecoCodes.filter(c => c.id !== id));
        } else {
            console.error('Error deleting ateco:', error);
        }
    };

    const handleLogin = (email: string) => {
        // Handled by Auth Listener now
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setActiveTab('dashboard');
    };

    const exportAllData = () => {
        const data = {
            exportDate: new Date().toISOString(),
            userEmail: user,
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

    // Dashboard Shortcuts Handlers
    const handleNewTransactionShortcut = () => {
        setActiveTab('transactions');
        setStartAddingTransaction(true);
    };

    const handleSetGoalsShortcut = () => {
        setActiveTab('goals');
    };

    // Calculations
    const availableYears = useMemo(() => {
        const years = new Set<number>(transactions.map(t => new Date(t.date).getFullYear()));
        const currentYearVal = new Date().getFullYear();
        years.add(currentYearVal);
        years.add(currentYearVal - 1);
        return Array.from(years).sort((a: number, b: number) => b - a);
    }, [transactions]);

    const stats: Stats = useMemo(() => {
        const today = new Date();
        const currentFullYear = today.getFullYear();

        // 1. Calculate Fixed Debts Estimate
        let totalFixedDebtEstimate = 0;
        fixedDebts.forEach(debt => {
            if (debt.isSuspended) return;
            const startMonth = debt.startYear < currentFullYear ? 1 : debt.startMonth;
            if (debt.startYear <= currentFullYear) {
                const activeMonthsInCurrentYear = Math.max(0, 12 - startMonth + 1);
                totalFixedDebtEstimate += activeMonthsInCurrentYear * debt.installment;
            }
        });

        // 2. Filter Transactions
        const yearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);

        // 3. Gross Income Calculation
        let income = 0;
        let grossTaxableIncome = 0; // Fatturato * Coeff (without deducting INPS yet)

        yearTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                income += t.amount;
                // Find coefficient for this specific transaction
                const ateco = atecoCodes.find(c => c.id === t.atecoCodeId) || atecoCodes[0];
                const coefficient = ateco ? ateco.coefficient : 0.78;
                grossTaxableIncome += t.amount * coefficient;
            });

        // 4. Calculate Expenses & Outflows
        // REAL EXPENSES = Everything that leaves the bank account (Business + Personal + Taxes + INPS)
        const allExpenses = yearTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const taxesPaid = yearTransactions
            .filter(t => t.type === 'expense' && (t.category === 'tax' || t.category === 'inps'))
            .reduce((sum, t) => sum + t.amount, 0);

        const inpsPaid = yearTransactions
            .filter(t => t.type === 'expense' && t.category === 'inps')
            .reduce((sum, t) => sum + t.amount, 0);

        // 5. Calculate Net Taxable Income (Reddito Imponibile Netto)
        // Rule: Imponibile = (Fatturato * Coeff) - INPS Versati
        const redditoImponibile = Math.max(0, grossTaxableIncome - inpsPaid);

        // 6. Calculate Flat Tax Estimate
        const taxRate = settings.taxRateType === '5%' ? 0.05 : 0.15;
        const flatTax = redditoImponibile * taxRate;

        // 7. Calculate INPS Estimate
        let inpsEstimate = 0;
        if (settings.inpsType === 'separata') {
            // Gestione Separata (approx 26.23%)
            inpsEstimate = redditoImponibile * 0.2623;
        } else {
            // Artigiani e Commercianti
            const fixedCost = settings.artigianiFixedCost || 4515;
            const threshold = settings.artigianiFixedIncome || 18415;
            const exceedRate = settings.artigianiExceedRate || 0.24;

            inpsEstimate = fixedCost;
            if (redditoImponibile > threshold) {
                inpsEstimate += (redditoImponibile - threshold) * exceedRate;
            }
        }

        const totalTaxEstimate = flatTax + inpsEstimate;

        // Liquidità di Cassa = Opening Balance (for this year) + Income - Expenses
        const openingBalance = settings.openingHistory[currentYear] || 0;
        const realNetIncome = income - allExpenses; // Net cash flow for current year
        const currentLiquidity = openingBalance + realNetIncome;

        // Estimated Fiscal Net Income (Netto Fiscale - Cash in Pocket)
        // CORRECTED: Income - Taxes (Do not subtract implicit costs, because they are cash!)
        const estimatedNetIncome = income - totalTaxEstimate;

        // Net Available Income (Netto Disponibile)
        // Netto Fiscale - Debiti Fissi
        // Note: This amount must cover Variable Expenses (Groceries, etc.)
        const netAvailableIncome = estimatedNetIncome - totalFixedDebtEstimate;

        const remainingTaxDue = totalTaxEstimate - taxesPaid;

        // --- FORECASTING: SMART BREAK-EVEN ---
        // A. Fatturato di Pareggio (Break Even Turnover)

        // 1. Determine "Time Elapsed" to project variable expenses
        let monthsElapsed = 1;
        if (currentYear < currentFullYear) monthsElapsed = 12;
        else if (currentYear === currentFullYear) monthsElapsed = Math.max(1, today.getMonth() + 1);

        // 2. Calculate Total Non-Tax Spending (Transactions)
        const nonTaxExpensesYTD = allExpenses - taxesPaid - inpsPaid;

        // 3. Smart Separation: "Variable" vs "Fixed"
        // We assume 'totalFixedDebtEstimate' is the baseline mandatory cost.
        // We estimate how much of 'nonTaxExpensesYTD' is actually Fixed Debt payments vs Variable Spending.
        // Heuristic: Fixed Debts Paid YTD approx = (Total Fixed / 12) * monthsElapsed
        const estimatedFixedPaidYTD = (totalFixedDebtEstimate / 12) * monthsElapsed;

        // Variable Spending YTD = Total Spending - Estimated Fixed Paid
        // (If negative, it means user didn't log fixed debts in transactions, so all transactions are variable/extra)
        let variableSpendingYTD = nonTaxExpensesYTD - estimatedFixedPaidYTD;
        if (variableSpendingYTD < 0) variableSpendingYTD = nonTaxExpensesYTD;

        // 4. Project Annual Variable Spending
        const projectedAnnualVariableExpenses = (variableSpendingYTD / monthsElapsed) * 12;

        // 5. Target Net Income = Fixed Debts (Certain) + Projected Variable (Lifestyle)
        // This ensures we cover the Fixed contracts AND the lifestyle displayed by the user's spending habits.
        const targetNetIncome = totalFixedDebtEstimate + projectedAnnualVariableExpenses;

        // 6. Gross Up Formula (Precise)
        let breakEvenTurnover = 0;
        const weightedCoeff = income > 0 ? (grossTaxableIncome / income) : 0.78; // Default to 78% if no income

        if (settings.inpsType === 'separata') {
            const inpsRate = 0.2623;
            // Formula: Turnover * Margin = Target
            // Margin = 1 - (INPS%) - (Tax% on TaxableBase post INPS)
            const margin = 1 - (weightedCoeff * inpsRate) - (weightedCoeff * (1 - inpsRate) * taxRate);

            if (margin > 0) {
                breakEvenTurnover = targetNetIncome / margin;
            }
        } else {
            // Artigiani Logic
            const fixedInps = settings.artigianiFixedCost || 4515;
            const threshold = settings.artigianiFixedIncome || 18415;
            const exceedRate = settings.artigianiExceedRate || 0.24;

            // Scenario 1: Income Low (Fixed INPS dominates)
            const marginLow = 1 - weightedCoeff * taxRate;
            // Need to cover Target + FixedINPS (grossed for tax)
            const constantPartLow = fixedInps * (1 - taxRate);
            const t1 = (targetNetIncome + constantPartLow) / marginLow;

            if (t1 * weightedCoeff <= threshold) {
                breakEvenTurnover = t1;
            } else {
                // Scenario 2: Income High (Exceed rate applies)
                const marginHigh = 1 - (weightedCoeff * exceedRate) - (weightedCoeff * (1 - exceedRate) * taxRate);

                if (marginHigh > 0) {
                    // Gross up Target + FixedINPS (Base cost)
                    breakEvenTurnover = (targetNetIncome + fixedInps) / marginHigh;
                }
            }
        }

        // B. Monthly Net (Salary)
        const monthlyNetIncome = netAvailableIncome / 12;

        // C. Efficiency per 1000€ (Marginal Value)
        const avgCoefficient = income > 0 ? (grossTaxableIncome / income) : 0.78;
        const marginalTaxable = 1000 * avgCoefficient;

        let marginalInps = 0;
        if (settings.inpsType === 'separata') {
            marginalInps = marginalTaxable * 0.2623;
        } else {
            const projectedAnnualIncome = (income / monthsElapsed) * 12;
            const projectedTaxable = projectedAnnualIncome * avgCoefficient;
            const threshold = settings.artigianiFixedIncome || 18415;

            if (projectedTaxable > threshold) {
                marginalInps = marginalTaxable * (settings.artigianiExceedRate || 0.24);
            } else {
                marginalInps = 0;
            }
        }

        // Deduct INPS from Taxable base for Flat Tax
        const marginalTaxBase = marginalTaxable - marginalInps;
        const marginalTax = marginalTaxBase * taxRate;
        const taxEfficiencyPer1000 = 1000 - marginalInps - marginalTax;

        // D. Goals Calculation
        const goalPercentage = settings.annualGoal > 0 ? (income / settings.annualGoal) * 100 : 0;
        const gapToGoal = Math.max(0, settings.annualGoal - income);

        return {
            income,
            realExpenses: allExpenses, // Now includes taxes and INPS
            taxesPaid,
            inpsPaid,
            realNetIncome,
            currentLiquidity,
            redditoImponibile,
            flatTax,
            inps: inpsEstimate,
            totalTaxEstimate,
            estimatedNetIncome,
            netAvailableIncome,
            remainingTaxDue,
            totalFixedDebtEstimate,
            percentualeSoglia: (income / LIMITE_FORFETTARIO) * 100,
            taxRateApplied: taxRate,
            breakEvenTurnover,
            monthlyNetIncome,
            taxEfficiencyPer1000,
            goalPercentage,
            gapToGoal
        };
    }, [transactions, fixedDebts, currentYear, settings, atecoCodes]);

    // DATABASE UPDATES
    const updateSettings = async (updatedSettings: UserSettings) => {
        // Optimistic update
        setSettings(updatedSettings);

        if (userId) {
            const { error } = await supabase.from('user_settings').upsert({
                user_id: userId,
                opening_history: updatedSettings.openingHistory,
                tax_rate_type: updatedSettings.taxRateType,
                inps_type: updatedSettings.inpsType,
                artigiani_fixed_income: updatedSettings.artigianiFixedIncome,
                artigiani_fixed_cost: updatedSettings.artigianiFixedCost,
                artigiani_exceed_rate: updatedSettings.artigianiExceedRate,
                annual_goal: updatedSettings.annualGoal,
                expense_goals: updatedSettings.expenseGoals
            }, { onConflict: 'user_id' });

            if (error) {
                console.error('Error saving settings:', error);
            }
        }
    };

    const addFixedDebt = async (debt: Omit<FixedDebt, 'id'>) => {
        const payload = {
            user_id: userId,
            name: debt.name,
            total_due: debt.totalDue,
            installment: debt.installment,
            debit_day: debt.debitDay,
            is_suspended: debt.isSuspended,
            type: debt.type,
            start_month: debt.startMonth,
            start_year: debt.startYear
        };

        const { data, error } = await supabase.from('fixed_debts').insert(payload).select().single();

        if (data && !error) {
            // Map back to camelCase for local state
            const newDebt: FixedDebt = {
                id: data.id,
                name: data.name,
                totalDue: data.total_due,
                installment: data.installment,
                debitDay: data.debit_day,
                isSuspended: data.is_suspended,
                type: data.type,
                startMonth: data.start_month,
                startYear: data.start_year
            };
            setFixedDebts([...fixedDebts, newDebt]);
        }
    };

    const updateFixedDebt = async (debt: FixedDebt) => {
        const payload = {
            name: debt.name,
            total_due: debt.totalDue,
            installment: debt.installment,
            debit_day: debt.debitDay,
            is_suspended: debt.isSuspended,
            type: debt.type,
            start_month: debt.startMonth,
            start_year: debt.startYear
        };

        const { error } = await supabase.from('fixed_debts').update(payload).eq('id', debt.id);

        if (!error) {
            setFixedDebts(fixedDebts.map(d => d.id === debt.id ? debt : d));
        }
    };

    const deleteFixedDebt = async (id: number) => {
        const { error } = await supabase.from('fixed_debts').delete().eq('id', id);
        if (!error) {
            setFixedDebts(fixedDebts.filter(d => d.id !== id));
        }
    };

    // SHOW AUTH VIEW IF NOT LOGGED IN
    if (!user) {
        return <AuthView onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Navbar */}
            <div className="bg-white shadow sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600 rounded-lg p-2 text-white shadow-lg shadow-blue-200">
                                    <Wallet size={24} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-extrabold text-slate-800 tracking-tight">Quant'ho</span>
                                    <div className="text-[10px] font-semibold text-slate-400 -mt-1 tracking-wider uppercase">Finance Manager</div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop: Year Selector & Logout */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1">
                                <label className="text-sm font-medium text-gray-700">Anno:</label>
                                <select
                                    value={currentYear}
                                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                    className="bg-transparent border-none font-bold text-gray-900 focus:ring-0 cursor-pointer"
                                >
                                    {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                                </select>
                            </div>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={18} />
                                Esci
                            </button>
                        </div>

                        {/* Mobile: Hamburger */}
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-b shadow-lg sticky top-16 z-10">
                    <div className="px-4 py-3 space-y-3">
                        <div className="flex items-center justify-between pb-3 border-b">
                            <label className="text-sm font-medium text-gray-700">Anno Fiscale:</label>
                            <select
                                value={currentYear}
                                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                                className="border rounded-lg px-3 py-1.5 font-semibold bg-white text-gray-900"
                            >
                                {availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: FileText },
                            { id: 'transactions', label: 'Transazioni', icon: TrendingUp },
                            { id: 'fixedDebts', label: 'Debiti Fissi', icon: Banknote },
                            { id: 'clients', label: 'Clienti', icon: Users },
                            { id: 'goals', label: 'Obiettivi', icon: Target },
                            { id: 'settings', label: 'Impostazioni', icon: Settings }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id as TabId);
                                    setMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === item.id
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <item.icon size={20} />
                                {item.label}
                            </button>
                        ))}

                        <button
                            onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 border-t border-gray-100 mt-2"
                        >
                            <LogOut size={20} />
                            Esci
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Tabs */}
            <div className="hidden md:block bg-white border-b sticky top-16 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: 'dashboard', label: 'Dashboard' },
                            { id: 'transactions', label: 'Transazioni' },
                            { id: 'fixedDebts', label: 'Debiti Fissi' },
                            { id: 'clients', label: 'Clienti' },
                            { id: 'goals', label: 'Obiettivi' },
                            { id: 'settings', label: 'Impostazioni' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabId)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {activeTab === 'dashboard' && (
                    <DashboardView
                        stats={stats}
                        currentYear={currentYear}
                        transactions={transactions}
                        onNewTransactionClick={() => setActiveTab('transactions')}
                        onSetGoalsClick={() => setActiveTab('goals')}
                        settings={settings}
                    />
                )}
                {activeTab === 'transactions' && (
                    <TransactionsView
                        currentYear={currentYear}
                        transactions={transactions}
                        clients={clients}
                        atecoCodes={atecoCodes}
                        onAddTransaction={addTransaction}
                        onUpdateTransaction={updateTransaction}
                        onDeleteTransaction={deleteTransaction}
                        startAdding={startAddingTransaction}
                        onAddStarted={() => setStartAddingTransaction(false)}
                    />
                )}
                {activeTab === 'clients' && (
                    <ClientsView
                        currentYear={currentYear}
                        transactions={transactions}
                        clients={clients}
                        onAddClient={addClient}
                    />
                )}
                {activeTab === 'fixedDebts' && (
                    <FixedDebtsView
                        fixedDebts={fixedDebts}
                        currentYear={currentYear}
                        onAddDebt={addFixedDebt}
                        onUpdateDebt={updateFixedDebt}
                        onDeleteDebt={deleteFixedDebt}
                    />
                )}
                {activeTab === 'goals' && (
                    <GoalsView
                        settings={settings}
                        onUpdateSettings={updateSettings}
                        stats={stats}
                        currentYear={currentYear}
                        transactions={transactions}
                    />
                )}
                {activeTab === 'settings' && (
                    <SettingsView
                        settings={settings}
                        onUpdateSettings={updateSettings}
                        atecoCodes={atecoCodes}
                        onAddAtecoCode={addAtecoCode}
                        onDeleteAtecoCode={deleteAtecoCode}
                        currentYear={currentYear}
                        transactions={transactions}
                        userEmail={user}
                        onLogout={handleLogout}
                        onExportData={exportAllData}
                    />
                )}
            </main>

            <footer className="mt-auto bg-white border-t py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-400">
                    <p className="hidden sm:block">Quantho - Regime Forfettario Italiano</p>
                    <p className="sm:hidden text-xs">Quantho</p>
                    <p className="text-xs mt-1">Non costituisce consulenza fiscale professionale.</p>
                </div>
            </footer>
        </div>
    );
};

export default App;